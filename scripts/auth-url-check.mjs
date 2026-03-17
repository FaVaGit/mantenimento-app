#!/usr/bin/env node
/**
 * auth-url-check.mjs
 *
 * Validates the full autologin URL-login pipeline end-to-end:
 *   1. Calls /api/auth/url-login/start  (generates token on server)
 *   2. Calls /api/auth/url-login/exchange  (redeems token for session)
 *   3. Reports ok / error with details
 *
 * Usage:
 *   node scripts/auth-url-check.mjs \
 *     --backendUrl=https://mantenimento-app.onrender.com \
 *     --bootstrapKey=<BOOTSTRAP_KEY> \
 *     [--sub=favagit] [--verbose]
 *
 * Env vars (used as fallback if CLI args are absent):
 *   AUTH_URL_LOGIN_BOOTSTRAP_KEY
 *   AUTH_URL_LOGIN_BACKEND_URL   (defaults to http://localhost:3001)
 *   AUTH_URL_LOGIN_ALLOWED_USER  (first in comma-separated list used as default sub)
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// ── Load .env from project root (best-effort, no hard dep on dotenv) ──────────
const __dir = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dir, '..', '.env');
try {
  const envContent = readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx < 1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const raw = trimmed.slice(eqIdx + 1).trim();
    const val = raw.replace(/^['"]|['"]$/g, '');
    if (!(key in process.env)) process.env[key] = val;
  }
} catch {
  // .env not found — ok, rely on environment
}

// ── CLI args ──────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const getArg = (name, fallback = '') => {
  const prefix = `--${name}=`;
  const found = args.find((a) => a.startsWith(prefix));
  return found ? found.slice(prefix.length) : fallback;
};
const hasFlag = (name) => args.includes(`--${name}`);

const backendUrl = (
  getArg('backendUrl',
    process.env.AUTH_URL_LOGIN_BACKEND_URL || 'http://localhost:3001'
  )
).replace(/\/$/, '');

const bootstrapKey = getArg(
  'bootstrapKey',
  process.env.AUTH_URL_LOGIN_BOOTSTRAP_KEY || ''
);

const defaultSub = (process.env.AUTH_URL_LOGIN_ALLOWED_USER || 'favagit')
  .split(',')[0].trim();
const sub = getArg('sub', defaultSub);
const verbose = hasFlag('verbose');

// ── Helpers ───────────────────────────────────────────────────────────────────
const ok  = (msg) => console.log(`  \x1b[32m✓\x1b[0m  ${msg}`);
const err = (msg) => console.log(`  \x1b[31m✗\x1b[0m  ${msg}`);
const inf = (msg) => verbose && console.log(`  \x1b[90m→  ${msg}\x1b[0m`);

// ── Pre-flight checks ─────────────────────────────────────────────────────────
console.log('\n\x1b[1mauth:url-check\x1b[0m — autologin pipeline validation');
console.log('─'.repeat(50));
console.log(`  backend : ${backendUrl}`);
console.log(`  subject : ${sub}`);
console.log('─'.repeat(50));

let exitCode = 0;

if (!bootstrapKey) {
  err('AUTH_URL_LOGIN_BOOTSTRAP_KEY is not set (--bootstrapKey= or env var)');
  process.exit(1);
}

// ── Step 1: generate token via /start ─────────────────────────────────────────
let loginUrl = '';
let authToken = '';

try {
  const startUrl = `${backendUrl}/api/auth/url-login/start?k=${encodeURIComponent(bootstrapKey)}&sub=${encodeURIComponent(sub)}&format=json`;
  inf(`GET ${startUrl.replace(bootstrapKey, '<BOOTSTRAP_KEY>')}`);

  const res = await fetch(startUrl);
  const body = await res.json().catch(() => null);

  if (!res.ok || !body?.ok) {
    err(`/start returned ${res.status}: ${JSON.stringify(body)}`);
    process.exit(1);
  }

  loginUrl = body.url || '';
  ok(`/api/auth/url-login/start → ${res.status} ok`);
  inf(`returned url: ${loginUrl}`);

  // Extract authToken from returned URL
  const urlObj = new URL(loginUrl);
  authToken = urlObj.searchParams.get('authToken') || '';
  if (!authToken) {
    // Try hash fragment
    const hash = urlObj.hash.slice(1);
    authToken = new URLSearchParams(hash).get('authToken') || '';
  }

  if (!authToken) {
    err('authToken not found in the URL returned by /start');
    process.exit(1);
  }
  ok(`authToken extracted (${authToken.length} chars)`);
} catch (e) {
  err(`/start request failed: ${e.message}`);
  process.exit(1);
}

// ── Step 2: exchange token via /exchange ─────────────────────────────────────
try {
  const exchangeUrl = `${backendUrl}/api/auth/url-login/exchange`;
  inf(`POST ${exchangeUrl}  token length=${authToken.length}`);

  const res = await fetch(exchangeUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: authToken }),
  });

  const body = await res.json().catch(() => null);

  if (!res.ok || !body?.ok) {
    err(`/exchange returned ${res.status}: ${JSON.stringify(body)}`);
    exitCode = 1;
  } else {
    const email = body.session?.user?.email || body.user?.email || '(unknown)';
    ok(`/api/auth/url-login/exchange → ${res.status} ok`);
    ok(`Logged in as: ${email}`);
    if (verbose && body.session?.access_token) {
      inf(`access_token (first 32): ${body.session.access_token.slice(0, 32)}...`);
    }
  }
} catch (e) {
  err(`/exchange request failed: ${e.message}`);
  exitCode = 1;
}

// ── Summary ───────────────────────────────────────────────────────────────────
console.log('─'.repeat(50));
if (exitCode === 0) {
  console.log('\x1b[32m\x1b[1m  PASSED\x1b[0m — autologin pipeline is functional');
  console.log(`\n  Share this link (valid for ~120 s):\n  ${loginUrl}\n`);
} else {
  console.log('\x1b[31m\x1b[1m  FAILED\x1b[0m — see errors above');
}
console.log();
process.exit(exitCode);
