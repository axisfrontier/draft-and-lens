import { auth } from '@clerk/nextjs/server';
import { NextResponse, type NextRequest } from 'next/server';

import { getAnthropicClient } from '../../../ai/client';
import { excerptForReading } from '../../../ai/read-window';
import { isLensAuthorsOwnWork } from '../../../ai/lens-authorship';
import { LENS_IDS, getLensSystemPrompt } from '../../../prompts/lenses';
import { LENS_META } from '../../../prompts/lenses/meta';
import { LENS_SELF_RECOGNITION } from '../../../prompts/lenses/self-recognition';
import type { LensId } from '../../../prompts/lenses';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

/**
 * How much of the submission a lens reads, in characters.
 *
 * The number is unchanged — this route already stopped at 12,000. What changed
 * (2026-08-31) is that it now says so. Before, the text was cut here with no
 * label, so a lens giving its opinion on the work could not tell a truncated
 * submission from one that ended where it stopped — the same defect Brain 1
 * had, in the one place it is worst, because a lens reading streams to the
 * writer verbatim as a reading. Reachable in ordinary use: `ReportView` sends
 * the already-submitted text, which the 4,000-word cap allows up to roughly
 * 20,800 characters, so any piece over ~2,300 words was being read in part and
 * presented as whole.
 *
 * Kept separate from Brain 1's window on purpose. Different model, different
 * job, different budget; the shared thing is the shape, not the number.
 */
const LENS_READ_WINDOW_CHARS = 12000;

function isLensId(id: unknown): id is LensId {
  return typeof id === 'string' && (LENS_IDS as readonly string[]).includes(id);
}

export async function POST(req: NextRequest): Promise<Response> {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Sign in to read this through another voice.' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }

  const { lensId, text, tradition, register, ambition } = body;
  if (!isLensId(lensId)) {
    return NextResponse.json({ error: 'Invalid lens ID.' }, { status: 400 });
  }
  if (typeof text !== 'string' || !text.trim()) {
    return NextResponse.json({ error: 'No text provided.' }, { status: 400 });
  }

  // ── A lens handed its own work ────────────────────────────────────────
  // Reachable because the provenance gate asks rather than refuses: a writer
  // who answered "it's mine" has a reading, and can now ask Carver to read
  // Carver. The generic hold would be wrong twice here — it breaks the voice
  // the writer came for, and "I think I've read this before" is not the honest
  // sentence when the honest sentence is "I wrote it".
  //
  // Answered in character and returned immediately: no lens call, no reading
  // of someone else's published work, and the line hands the moment back to
  // the writer's own writing rather than ending on a refusal.
  if (await isLensAuthorsOwnWork(text, LENS_META[lensId].name)) {
    const encoder = new TextEncoder();
    const line = LENS_SELF_RECOGNITION[lensId];
    return new Response(
      new ReadableStream<Uint8Array>({
        start(controller) {
          const send = (obj: Record<string, unknown>) =>
            controller.enqueue(encoder.encode(JSON.stringify(obj) + '\n'));
          send({ type: 'self_recognition' });
          send({ type: 'text', delta: line });
          send({ type: 'done', reply: line });
          controller.close();
        },
      }),
      {
        headers: {
          'Content-Type': 'application/x-ndjson',
          'Transfer-Encoding': 'chunked',
          'Cache-Control': 'no-cache',
        },
      }
    );
  }

  const systemPrompt = getLensSystemPrompt(
    lensId,
    typeof tradition === 'string' ? tradition : undefined,
    typeof register === 'string' ? register : undefined,
    typeof ambition === 'string' ? ambition : undefined,
  );

  const client = getAnthropicClient();
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (obj: Record<string, unknown>) =>
        controller.enqueue(encoder.encode(JSON.stringify(obj) + '\n'));

      try {
        const anthropicStream = await client.messages.stream({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1200,
          system: systemPrompt,
          messages: [
            {
              role: 'user',
              content: `Here is the work:\n\n${excerptForReading(text, LENS_READ_WINDOW_CHARS)}`,
            },
          ],
        });

        let full = '';
        for await (const chunk of anthropicStream) {
          if (
            chunk.type === 'content_block_delta' &&
            chunk.delta.type === 'text_delta'
          ) {
            const delta = chunk.delta.text;
            full += delta;
            send({ type: 'text', delta });
          }
        }
        send({ type: 'done', reading: full });
      } catch (err) {
        send({ type: 'error', message: err instanceof Error ? err.message : 'Unknown error' });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson',
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache',
    },
  });
}
