import 'server-only';

import {
  buildConversationEditorialSystem,
  buildConversationLensSystem,
} from '../../prompts/conversation';
import { LENS_META, type LensId } from '../../prompts/lenses';
import type { DiagnosticResult } from '../../prompts/types';
import { getAnthropicClient } from '../client';
import { MODELS, TOKEN_LIMITS } from '../config';
import { extractText } from './_shared';

/**
 * Brain 7 — Conversation. Holds the full analysis + diagnostic + history; honest,
 * never vague-encouraging. Editorial target answers to the corpus; a lens target
 * answers in voice. Ported from sendConvMessage(). On demand, not part of the
 * analysis pipeline.
 */

export type ConversationTarget = 'editorial' | LensId;

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ConversationInput {
  target: ConversationTarget;
  diagnostic: DiagnosticResult | null;
  reportText: string;
  /** Full chat history, including the new writer message as the last entry. */
  messages: ConversationMessage[];
}

export async function runConversation(input: ConversationInput): Promise<string> {
  const isLens = input.target !== 'editorial';
  const system = isLens
    ? buildConversationLensSystem(
        input.target as LensId,
        LENS_META[input.target as LensId].name,
        input.diagnostic?.tradition ?? 'unknown'
      )
    : buildConversationEditorialSystem({
        diagnostic: input.diagnostic,
        reportText: input.reportText,
      });

  const client = getAnthropicClient();
  const msg = await client.messages.create({
    model: MODELS.conversation,
    max_tokens: TOKEN_LIMITS.conversation,
    system,
    messages: input.messages,
  });
  return extractText(msg);
}
