import { auth } from '@clerk/nextjs/server';
import { NextResponse, type NextRequest } from 'next/server';

import { getAnthropicClient } from '../../../ai/client';
import { LENS_IDS, getLensSystemPrompt } from '../../../prompts/lenses';
import type { LensId } from '../../../prompts/lenses';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

function isLensId(id: unknown): id is LensId {
  return typeof id === 'string' && (LENS_IDS as readonly string[]).includes(id);
}

export async function POST(req: NextRequest): Promise<Response> {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Sign in to use editorial lenses.' }, { status: 401 });
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
              content: `Here is the work:\n\n${text.slice(0, 12000)}`,
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
