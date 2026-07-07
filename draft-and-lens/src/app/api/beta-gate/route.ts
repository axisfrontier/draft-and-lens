import { type NextRequest, NextResponse } from 'next/server';

async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const password = String(form.get('password') ?? '');
  const nextParam = String(form.get('next') ?? '/');
  const expected = process.env.BETA_GATE_PASSWORD;

  if (!expected || password !== expected) {
    const url = req.nextUrl.clone();
    url.pathname = '/beta-gate';
    url.search = '';
    url.searchParams.set('next', nextParam);
    url.searchParams.set('error', '1');
    return NextResponse.redirect(url);
  }

  const url = req.nextUrl.clone();
  url.pathname = nextParam.startsWith('/') ? nextParam : '/';
  url.search = '';
  const res = NextResponse.redirect(url);
  res.cookies.set('dl_beta', await sha256Hex(expected), {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
