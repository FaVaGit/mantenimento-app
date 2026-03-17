#!/usr/bin/env node
import crypto from 'crypto';

const args = process.argv.slice(2);
const getArg = (name, fallback = '') => {
  const prefix = `--${name}=`;
  const found = args.find((arg) => arg.startsWith(prefix));
  return found ? found.slice(prefix.length) : fallback;
};

const secret = String(getArg('secret', process.env.AUTH_URL_LOGIN_SECRET || '')).trim();
const subject = String(getArg('sub', process.env.AUTH_URL_LOGIN_ALLOWED_USER || 'favagit')).trim().toLowerCase();
const ttlSecRaw = Number(getArg('ttl', process.env.AUTH_URL_LOGIN_TTL_SEC || '120'));
const ttlSec = Number.isFinite(ttlSecRaw) ? Math.max(30, Math.min(180, Math.floor(ttlSecRaw))) : 120;
const baseUrl = String(getArg('baseUrl', 'https://favagit.github.io/mantenimento-app/')).trim();

if (!secret) {
  console.error('Missing AUTH_URL_LOGIN_SECRET (env or --secret=...).');
  process.exit(1);
}
if (!subject) {
  console.error('Missing subject (--sub=...).');
  process.exit(1);
}

const toBase64Url = (value) => Buffer.from(value)
  .toString('base64')
  .replace(/\+/g, '-')
  .replace(/\//g, '_')
  .replace(/=+$/g, '');

const now = Math.floor(Date.now() / 1000);
const payload = {
  sub: subject,
  aud: 'url-login',
  iat: now,
  exp: now + ttlSec,
  jti: typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : crypto.randomBytes(16).toString('hex')
};

const payloadPart = toBase64Url(JSON.stringify(payload));
const signatureHex = crypto.createHmac('sha256', secret).update(payloadPart).digest('hex');
const signaturePart = toBase64Url(Buffer.from(signatureHex, 'hex'));
const token = `${payloadPart}.${signaturePart}`;

const joiner = baseUrl.includes('?') ? '&' : '?';
const url = `${baseUrl}${joiner}autologin=1&authToken=${encodeURIComponent(token)}`;

console.log('token:', token);
console.log('url  :', url);
