import { auth } from '@clerk/nextjs/server';
import { NextResponse, type NextRequest } from 'next/server';

import { getAnthropicClient } from '../../../ai/client';
import { MODELS, TOKEN_LIMITS } from '../../../ai/config';
import { buildConversationEditorialSystem, buildConversationLensSystem } from '../../../prompts/conversation';
import {
  FRAGMENT_ASK_TRADITION_COPY,
  FRAGMENT_REDIRECT_COPY,
  buildFragmentSystem,
} from '../../../prompts/fragment';
import { LENS_META } from '../../../prompts/lenses/meta';
import { decideFragmentRoute, isFragmentAsk, type FragmentAsk } from '../../../lib/fragment';
import { TESTER_WORD_CAP, countWords } from '../../../lib/limits';
import { getFragmentContext } from '../../../lib/readings';
import { LENS_IDS } from '../../../prompts/lenses/types';
import type { LensId } from '../../../prompts/lenses/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

function isLensId(id: unknown): id is LensId {
  return typeof id === 'string' && (LENS_IDS as readonly string[]).includes(id);
}

/**
 * The canonical phrasing of each preset ask.
 *
 * Server-side rather than sent from the browser: what the model is asked is
 * prompt surface, and the option labels the writer sees are UI copy that will
 * change when the Editor voice is finalised. Keeping the two apart means the
 * copy can be rewritten without touching what the model is actually asked.
 */
const ASK_AS_QUESTION: Record<Exclude<FragmentAsk, 'free'>, string> = {
  craft: 'How is the writing itself holding up? Line-level craft only.',
  fit: 'Does this sit consistently with what you have already read of my work?',
  tradition: 'Does this read as authentic to the tradition I am working in?',
};

/**
 * Fragment mode (Fragment Handling & Revision Loop spec).
 *
 * EPHEMERAL, and that is load-bearing rather than incidental. Nothing here
 * writes: no reading is stored, no work is created, nothing touches the
 * continuity ledger. A stored fragment would become the prior that
 * getPriorRevisionNotes reads, and since a fragment answer carries no
 * `## WHAT TO REVISE` heading, the lookup would return null and the revision
 * loop would silently stop closing. Storing nothing is what prevents that.
 *
 * Streams on the same NDJSON contract as the rest of this route so the client
 * has one reader. The `route` event goes first in every case, including the
 * two that need no model call at all.
 */
async function handleFragment(
  userId: string,
  body: Record<string, unknown>
): Promise<Response> {
  const passage = typeof body.passage === 'string' ? body.passage.trim() : '';
  const ask = isFragmentAsk(body.ask) ? body.ask : 'free';
  const freeText = typeof body.message === 'string' ? body.message.trim() : '';
  const namedTradition =
    typeof body.namedTradition === 'string' ? body.namedTradition.trim() : '';

  if (!passage) {
    return NextResponse.json({ error: 'No passage provided.' }, { status: 400 });
  }
  // The one word-count boundary in the system (Word Cap standing decision).
  // A fragment is still text going to a brain, so it answers to the same
  // ceiling — and nothing here introduces a MINIMUM, which is the whole point.
  if (countWords(passage) > TESTER_WORD_CAP) {
    return NextResponse.json(
      {
        error: `That is past what I can take in one go right now — up to about ${TESTER_WORD_CAP.toLocaleString()} words. Send it as a full reading instead.`,
      },
      { status: 400 }
    );
  }
  if (ask === 'free' && !freeText) {
    return NextResponse.json({ error: 'No question provided.' }, { status: 400 });
  }

  // Context is a lookup, never an inference — see lib/fragment.ts. It is also
  // only fetched when the ask needs it, so the ordinary craft question costs
  // no database round trip.
  const priorContext = ask === 'fit' ? await getFragmentContext(userId) : null;
  const route = decideFragmentRoute({
    ask,
    hasPriorContext: priorContext !== null,
    namedTradition,
  });

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (obj: Record<string, unknown>) =>
        controller.enqueue(encoder.encode(JSON.stringify(obj) + '\n'));

      try {
        send({ type: 'route', route: route.kind });

        // Both non-answer routes are deterministic and cost nothing. Emitted
        // as ordinary text so the client renders every case through one path.
        if (route.kind !== 'answer') {
          const copy =
            route.kind === 'redirect' ? FRAGMENT_REDIRECT_COPY : FRAGMENT_ASK_TRADITION_COPY;
          send({ type: 'text', delta: copy });
          send({ type: 'done', reply: copy });
          return;
        }

        const question = ask === 'free' ? freeText : ASK_AS_QUESTION[ask];
        const client = getAnthropicClient();
        const anthropicStream = await client.messages.stream({
          model: MODELS.conversation,
          max_tokens: TOKEN_LIMITS.fragment,
          system: buildFragmentSystem({
            namedTradition: namedTradition || null,
            priorContext,
            lensId: isLensId(body.target) ? body.target : null,
          }),
          messages: [
            {
              role: 'user',
              content: `The writer asks: ${question}\n\nThe passage:\n${passage}`,
            },
          ],
        });

        let full = '';
        for await (const chunk of anthropicStream) {
          if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
            full += chunk.delta.text;
            send({ type: 'text', delta: chunk.delta.text });
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

  // Fragment mode takes its own path and shares only the transport. Handled
  // before anything below so the existing conversation contract is untouched.
  if (body.kind === 'fragment') return handleFragment(userId, body);

  const { message, target, reportText, diagnostic, history, submittedText } = body;

  if (typeof message !== 'string' || !message.trim()) {
    return NextResponse.json({ error: 'No message provided.' }, { status: 400 });
  }

  // Build system prompt based on target (editorial or lens ID)
  let systemPrompt: string;
  const tradition = (diagnostic as Record<string, unknown>)?.tradition as string ?? 'unknown';

  if (isLensId(target)) {
    const meta = LENS_META[target];
    systemPrompt = buildConversationLensSystem(
      target,
      meta.name,
      tradition,
      typeof submittedText === 'string' ? submittedText : ''
    );
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
