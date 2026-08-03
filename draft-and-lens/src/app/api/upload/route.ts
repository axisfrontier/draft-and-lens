import { auth } from '@clerk/nextjs/server';
import { NextResponse, type NextRequest } from 'next/server';

import {
  MAX_UPLOAD_BYTES,
  UPLOAD_MESSAGES,
  extensionOf,
  formatFor,
  rejectionReason,
} from '../../../lib/upload-formats';
import { logSecurityEvent } from '../../../lib/security-log';

/**
 * POST /api/upload — text extraction for binary manuscript formats.
 *
 * .txt, .md, .fountain and .fdx are read in the browser; they are already text.
 * .docx and .pdf are not: they are binary containers, and the drop zone's
 * `FileReader.readAsText` returned mojibake for them rather than failing, which
 * is how an unreadable file reached the analysis screen. Those two formats come
 * here instead and are extracted with a real parser.
 *
 * Contract: multipart/form-data with a single `file` field.
 *   200 { text }   extracted, gated, safe to analyse
 *   4xx { error }  a specific, actionable message for the upload screen
 *
 * The response carries only the writer's own text back to the writer's own
 * browser. No prompt or lens IP is involved on this path.
 */

// mammoth and unpdf both require the Node runtime.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function fail(message: string, status = 400): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

/** Extract the document text of a .docx (an OOXML zip) as plain paragraphs. */
async function extractDocx(bytes: ArrayBuffer): Promise<string> {
  const mammoth = await import('mammoth');
  const { value } = await mammoth.extractRawText({ buffer: Buffer.from(bytes) });
  return value;
}

/** Extract the text layer of a PDF. Returns '' for scans, which carry none. */
async function extractPdf(bytes: ArrayBuffer): Promise<string> {
  const { extractText, getDocumentProxy } = await import('unpdf');
  const pdf = await getDocumentProxy(new Uint8Array(bytes));
  const { text } = await extractText(pdf, { mergePages: true });
  return Array.isArray(text) ? text.join('\n\n') : text;
}

export async function POST(req: NextRequest): Promise<Response> {
  const { userId } = await auth();
  if (!userId) {
    logSecurityEvent('auth_denied', { route: 'POST /api/upload' });
    return fail('Please sign in to upload your work.', 401);
  }

  let file: File | null = null;
  try {
    const form = await req.formData();
    const entry = form.get('file');
    if (entry instanceof File) file = entry;
  } catch {
    return fail('That upload did not arrive intact. Try again.');
  }
  if (file === null) return fail('No file was received. Try again.');

  const format = formatFor(file.name);
  if (format === null) return fail(UPLOAD_MESSAGES.unsupported(extensionOf(file.name)));
  if (format.transport !== 'server') {
    // Textual formats are read in the browser; reaching here means the client
    // and this route have drifted apart.
    return fail(UPLOAD_MESSAGES.unsupported(format.ext));
  }
  if (file.size > MAX_UPLOAD_BYTES) return fail(UPLOAD_MESSAGES.tooLarge(file.size), 413);

  let text: string;
  try {
    const bytes = await file.arrayBuffer();
    text = format.ext === '.docx' ? await extractDocx(bytes) : await extractPdf(bytes);
  } catch {
    // Password-protected, truncated or otherwise unparseable. The specific
    // parser error is not useful to a writer, so it is not surfaced.
    return fail(UPLOAD_MESSAGES.extractionFailed(format.label), 422);
  }

  const normalised = text.replace(/\r\n/g, '\n').trim();
  const reason = rejectionReason(normalised, format);
  if (reason !== null) return fail(reason, 422);

  return NextResponse.json({ text: normalised });
}
