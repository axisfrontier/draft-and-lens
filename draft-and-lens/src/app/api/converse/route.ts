import { auth } from '@clerk/nextjs/server';
import { NextResponse, type NextRequest } from 'next/server';

import { getAnthropicClient } from '../../../ai/client';
import { MODELS, TOKEN_LIMITS } from '../../../ai/config';
import { buildConversationEditorialSystem, buildConversationLensSystem } from '../../../prompts/conversation';
import { LENS_META } from '../../../prompts/lenses/meta';
import { LENS_IDS } from '../../../prompts/lenses/types';
import type { LensId } from '../../../prompts/lenses/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

function isLensId(id: unknown): id is LensId {
  return typeof id === 'string' && (LENS_IDS as readonly string[]).includes(id);
}

export async function POST(req: NextRequest): Promise<Response> {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Sign in to use your personal editor.' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }

  const { message, target, reportText, diagnostic, history } = body;

  if (typeof message !== 'string' || !message.trim()) {
    return NextResponse.json({ error: 'No message provided.' }, { status: 400 });
  }

  // Build system prompt based on target (editorial or lens ID)
  let systemPrompt: string;
  const tradition = (diagnostic as Record<string, unknown>)?.tradition as string ?? 'unknown';

  if (isLensId(target)) {
    const meta = LENS_META[target];
    systemPrompt = buildConversationLensSystem(target, meta.name, tradition);
  } else {
    // default: editorial voice
      systemPrompt = buildConversationEditorialSystem({
      diagnostic: diagnostic as Parameters<typeof buildConversationEditorialSystem>[0]['diagnostic'],
      reportText: typeof reportText === 'string' ? reportText : '',
    });
  }

  // Build message history for multi-turn context
  type MsgRole = 'user' | 'assistant';
  const prevHistory: Array<{ role: MsgRole; content: string }> = Array.isArray(history)
    ? (history as Array<{ role: string; content: string }>)
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .map((m) => ({ role: m.role as MsgRole, content: String(m.content) }))
    : [];

  const messages: Array<{ role: MsgRole; content: string }> = [
    ...prevHistory,
    { role: 'user', content: message },
  ];

  const client = getAnthropicClient();
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (obj: Record<string, unknown>) =>
        controller.enqueue(encoder.encode(JSON.stringify(obj) + '\n'));

      try {
        const anthropicStream = await client.messages.stream({
          model: MODELS.conversation,
          max_tokens: TOKEN_LIMITS.conversation,
          system: systemPrompt,
          messages,
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
        send({ type: 'done', reply: full });
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
