import { NextRequest, NextResponse } from 'next/server';
import { Octokit } from '@octokit/rest';
import { reportSchema } from '@/lib/report-schema';

export const runtime = 'nodejs';

const TURNSTILE_VERIFY_URL =
  'https://challenges.cloudflare.com/turnstile/v0/siteverify';

async function verifyTurnstile(token: string, ip: string | null) {
  const secret = process.env.TURNSTILE_SECRET_KEY as string;
  const form = new URLSearchParams();
  form.set('secret', secret);
  form.set('response', token);
  if (ip) form.set('remoteip', ip);

  const res = await fetch(TURNSTILE_VERIFY_URL, { method: 'POST', body: form });
  if (!res.ok) return false;
  const json = (await res.json()) as { success: boolean };
  return json.success === true;
}

export async function POST(req: NextRequest) {
  if (!process.env.TURNSTILE_SECRET_KEY) {
    console.error('Missing TURNSTILE_SECRET_KEY');
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = reportSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Invalid payload',
        fields: parsed.error.issues.map((i) => ({
          path: i.path.join('.'),
          code: i.code,
        })),
      },
      { status: 400 },
    );
  }
  const body = parsed.data;

  const ip =
    req.headers.get('cf-connecting-ip') ??
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    null;

  const ok = await verifyTurnstile(body.turnstileToken, ip);
  if (!ok) {
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 403 },
    );
  }

  if (body.kind === 'vote') {
    console.log(
      JSON.stringify({
        type: 'vote',
        ts: new Date().toISOString(),
        path: body.path,
        locale: body.locale,
        value: body.value,
      }),
    );
    return NextResponse.json({ ok: true });
  }

  const token = process.env.GITHUB_REPORT_TOKEN;
  const owner = process.env.GITHUB_REPORT_REPO_OWNER;
  const repo = process.env.GITHUB_REPORT_REPO_NAME;
  if (!token || !owner || !repo) {
    console.error('Missing GitHub env vars');
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }

  const octokit = new Octokit({ auth: token });
  try {
    const issue = await octokit.rest.issues.create({
      owner,
      repo,
      title: body.title,
      body:
        `${body.body}\n\n---\n` +
        `- Page: ${body.path ?? '(none)'}\n` +
        `- Locale: ${body.locale}\n` +
        `- Submitted via: omc.vibetip.help`,
      labels: [`kind/${body.category}`, 'via/web'],
    });
    return NextResponse.json({ ok: true, url: issue.data.html_url });
  } catch (e) {
    console.error('GitHub issue create failed', e);
    return NextResponse.json(
      { error: 'Could not file issue' },
      { status: 503 },
    );
  }
}
