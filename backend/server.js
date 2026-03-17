'use strict';

// Allow a specific .env file path via DEV_ENV_FILE (e.g. .env.dev)
// so the dev server can be configured independently from production.
const { config: dotenvConfig } = require('dotenv');
const envFile = process.env.DEV_ENV_FILE || '.env';
dotenvConfig({ path: envFile });

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const express = require('express');
const { calculateModel } = require('./calculate-model');

const app = express();
const port = Number(process.env.PORT || 3000);
const calculateRateWindowMs = Number(process.env.CALCULATE_RATE_WINDOW_MS || 60_000);
const calculateRateMaxRequests = Number(process.env.CALCULATE_RATE_MAX_REQUESTS || 30);
const calculateRequestLog = new Map();
const urlLoginTokenStore = new Map();
const accessLogEnabled = String(process.env.ACCESS_LOG_ENABLED || (process.env.NODE_ENV === 'production' ? 'true' : 'false')).toLowerCase() === 'true';
const accessLogSalt = String(process.env.ACCESS_LOG_SALT || 'mantenimento-app');
const authUrlLoginSecret = String(process.env.AUTH_URL_LOGIN_SECRET || '').trim();
const authUrlLoginAllowedUser = String(process.env.AUTH_URL_LOGIN_ALLOWED_USER || 'favagit').trim().toLowerCase();
const authUrlLoginSupabaseUrl = String(process.env.AUTH_URL_LOGIN_SUPABASE_URL || process.env.KEYLOCK_SUPABASE_URL || '').trim().replace(/\/+$/, '');
const authUrlLoginSupabaseAnonKey = String(process.env.AUTH_URL_LOGIN_SUPABASE_ANON_KEY || process.env.KEYLOCK_SUPABASE_ANON_KEY || '').trim();
const authUrlLoginSupabaseEmail = String(process.env.AUTH_URL_LOGIN_SUPABASE_EMAIL || '').trim().toLowerCase();
const authUrlLoginSupabasePassword = String(process.env.AUTH_URL_LOGIN_SUPABASE_PASSWORD || '');
const authUrlLoginMaxTtlSec = Number(process.env.AUTH_URL_LOGIN_MAX_TTL_SEC || 180);
const apiAllowedOrigins = String(process.env.API_ALLOWED_ORIGINS || '')
  .split(',')
  .map((v) => v.trim())
  .filter(Boolean);

function isAllowedApiOrigin(origin) {
  if (!origin) return false;
  if (!apiAllowedOrigins.length) return false;
  return apiAllowedOrigins.includes(origin);
}

function toBase64Url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function fromBase64Url(input) {
  const normalized = String(input || '')
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const padLength = (4 - (normalized.length % 4)) % 4;
  return Buffer.from(normalized + '='.repeat(padLength), 'base64');
}

function safeCompareHex(aHex, bHex) {
  try {
    const a = Buffer.from(String(aHex || ''), 'hex');
    const b = Buffer.from(String(bHex || ''), 'hex');
    if (a.length === 0 || b.length === 0 || a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch (_) {
    return false;
  }
}

function pruneConsumedUrlLoginTokens(nowSec) {
  for (const [jti, exp] of urlLoginTokenStore.entries()) {
    if (!Number.isFinite(exp) || exp <= nowSec) {
      urlLoginTokenStore.delete(jti);
    }
  }
}

function validateUrlLoginToken(tokenValue) {
  if (!authUrlLoginSecret) return { ok: false, error: 'URL login secret missing on server.' };
  if (!tokenValue || typeof tokenValue !== 'string') return { ok: false, error: 'Token missing.' };

  const token = String(tokenValue || '').trim();
  const parts = token.split('.');
  if (parts.length !== 2) return { ok: false, error: 'Malformed token.' };

  const payloadPart = parts[0];
  const signaturePart = parts[1];
  const expectedSignatureHex = crypto.createHmac('sha256', authUrlLoginSecret).update(payloadPart).digest('hex');
  const gotSignatureHex = fromBase64Url(signaturePart).toString('hex');
  if (!safeCompareHex(expectedSignatureHex, gotSignatureHex)) {
    return { ok: false, error: 'Invalid token signature.' };
  }

  let payload;
  try {
    payload = JSON.parse(fromBase64Url(payloadPart).toString('utf8'));
  } catch (_) {
    return { ok: false, error: 'Invalid token payload.' };
  }

  const nowSec = Math.floor(Date.now() / 1000);
  pruneConsumedUrlLoginTokens(nowSec);

  const sub = String(payload && payload.sub ? payload.sub : '').trim().toLowerCase();
  const aud = String(payload && payload.aud ? payload.aud : '').trim().toLowerCase();
  const jti = String(payload && payload.jti ? payload.jti : '').trim();
  const exp = Number(payload && payload.exp);
  const iat = Number(payload && payload.iat);

  if (!sub || sub !== authUrlLoginAllowedUser) return { ok: false, error: 'Token user not allowed.' };
  if (aud && aud !== 'url-login') return { ok: false, error: 'Invalid token audience.' };
  if (!jti) return { ok: false, error: 'Token nonce missing.' };
  if (!Number.isFinite(exp) || exp <= nowSec) return { ok: false, error: 'Token expired.' };
  if (!Number.isFinite(iat) || iat > nowSec + 30) return { ok: false, error: 'Invalid token issue time.' };
  if ((exp - iat) > authUrlLoginMaxTtlSec) return { ok: false, error: 'Token TTL too long.' };
  if (urlLoginTokenStore.has(jti)) return { ok: false, error: 'Token already used.' };

  urlLoginTokenStore.set(jti, exp);
  return { ok: true, payload };
}

async function deriveProfileKeyForUser(userId) {
  const password = String(authUrlLoginSupabasePassword || '');
  if (!password || !userId) return '';

  const salt = crypto.createHash('sha256').update(`keylock:${userId}`).digest();
  const key = await new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, 120000, 32, 'sha256', (err, derivedKey) => {
      if (err) return reject(err);
      resolve(derivedKey);
    });
  });
  return Buffer.from(key).toString('base64');
}

const publicDir = path.join(__dirname, '..', 'frontend', 'public');
// When DEV_SOURCE_JS=true the server always serves raw app.js (no rebuild needed).
const devSourceJs = String(process.env.DEV_SOURCE_JS || 'false').toLowerCase() === 'true';

function createRequestId() {
  return typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : crypto.randomBytes(16).toString('hex');
}

function anonymizeClientIp(ip) {
  return crypto.createHash('sha256').update(`${accessLogSalt}:${ip}`).digest('hex').slice(0, 16);
}

function getClientIp(req) {
  return String(req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown');
}

function pruneExpiredRateEntries(now) {
  for (const [ip, entry] of calculateRequestLog.entries()) {
    if (now - entry.windowStart >= calculateRateWindowMs) {
      calculateRequestLog.delete(ip);
    }
  }
}

function applyCalculateRateLimit(req, res, next) {
  const now = Date.now();
  const clientIp = getClientIp(req);
  const retryAfterSeconds = Math.ceil(calculateRateWindowMs / 1000);

  pruneExpiredRateEntries(now);

  const current = calculateRequestLog.get(clientIp);
  if (!current || now - current.windowStart >= calculateRateWindowMs) {
    calculateRequestLog.set(clientIp, { count: 1, windowStart: now });
    res.setHeader('RateLimit-Limit', String(calculateRateMaxRequests));
    res.setHeader('RateLimit-Remaining', String(calculateRateMaxRequests - 1));
    res.setHeader('RateLimit-Reset', String(Math.ceil((now + calculateRateWindowMs) / 1000)));
    return next();
  }

  if (current.count >= calculateRateMaxRequests) {
    res.setHeader('Retry-After', String(retryAfterSeconds));
    res.setHeader('RateLimit-Limit', String(calculateRateMaxRequests));
    res.setHeader('RateLimit-Remaining', '0');
    res.setHeader('RateLimit-Reset', String(Math.ceil((current.windowStart + calculateRateWindowMs) / 1000)));
    return res.status(429).json({ ok: false, error: 'Too many calculation requests. Please retry later.' });
  }

  current.count += 1;
  res.setHeader('RateLimit-Limit', String(calculateRateMaxRequests));
  res.setHeader('RateLimit-Remaining', String(Math.max(calculateRateMaxRequests - current.count, 0)));
  res.setHeader('RateLimit-Reset', String(Math.ceil((current.windowStart + calculateRateWindowMs) / 1000)));
  next();
}

app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(express.json({ limit: '64kb' }));
app.use((req, res, next) => {
  const startedAt = process.hrtime.bigint();
  req.requestId = createRequestId();
  res.setHeader('X-Request-Id', req.requestId);

  res.on('finish', () => {
    const shouldLog = accessLogEnabled && (req.path.startsWith('/api/') || res.statusCode >= 400);
    if (!shouldLog) return;

    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    const entry = {
      ts: new Date().toISOString(),
      requestId: req.requestId,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      durationMs: Number(durationMs.toFixed(1)),
      clientRef: anonymizeClientIp(getClientIp(req))
    };

    console.info(JSON.stringify(entry));
  });

  next();
});
app.use((req, res, next) => {
  const host = String(req.hostname || '').toLowerCase();
  const isLocal = host === 'localhost' || host === '127.0.0.1';
  const isSecure = req.secure || String(req.get('x-forwarded-proto') || '').toLowerCase() === 'https';

  if (!isLocal && process.env.NODE_ENV === 'production' && !isSecure) {
    return res.redirect(301, `https://${req.headers.host}${req.originalUrl}`);
  }

  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  if (isSecure) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});
app.use((err, req, res, next) => {
  if (!err) return next();

  if (err.type === 'entity.too.large') {
    return res.status(413).json({ ok: false, error: 'Calculation payload too large.' });
  }

  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ ok: false, error: 'Invalid JSON payload.' });
  }

  return next(err);
});

app.use('/api', (req, res, next) => {
  const origin = String(req.get('origin') || '');
  if (isAllowedApiOrigin(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Max-Age', '600');
  }

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  return next();
});

// Serve minified bundle when available, fallback to source app.js in development.
app.get('/app.js', (req, res) => {
  const minPath = path.join(publicDir, 'app.min.js');
  const sourcePath = path.join(publicDir, 'app.js');
  const target = (!devSourceJs && fs.existsSync(minPath)) ? minPath : sourcePath;
  res.sendFile(target);
});

app.post('/api/auth/url-login/exchange', async (req, res) => {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('Pragma', 'no-cache');

  const hasServerConfig = authUrlLoginSecret
    && authUrlLoginSupabaseUrl
    && authUrlLoginSupabaseAnonKey
    && authUrlLoginSupabaseEmail
    && authUrlLoginSupabasePassword;

  if (!hasServerConfig) {
    return res.status(503).json({ ok: false, error: 'Secure URL login not configured on server.' });
  }

  const token = String(req.body && req.body.token ? req.body.token : '').trim();
  const tokenCheck = validateUrlLoginToken(token);
  if (!tokenCheck.ok) {
    return res.status(401).json({ ok: false, error: tokenCheck.error || 'Invalid token.' });
  }

  try {
    const supaResponse = await fetch(`${authUrlLoginSupabaseUrl}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: authUrlLoginSupabaseAnonKey
      },
      body: JSON.stringify({
        email: authUrlLoginSupabaseEmail,
        password: authUrlLoginSupabasePassword
      })
    });

    const supaJson = await supaResponse.json().catch(() => ({}));
    if (!supaResponse.ok || !supaJson || !supaJson.access_token || !supaJson.refresh_token || !supaJson.user || !supaJson.user.id) {
      return res.status(401).json({ ok: false, error: 'Supabase session exchange failed.' });
    }

    const profileKey = await deriveProfileKeyForUser(String(supaJson.user.id));
    return res.json({
      ok: true,
      session: {
        access_token: supaJson.access_token,
        refresh_token: supaJson.refresh_token,
        expires_in: Number(supaJson.expires_in || 0),
        token_type: String(supaJson.token_type || 'bearer'),
        user: supaJson.user,
        profile_key: profileKey
      }
    });
  } catch (_) {
    return res.status(500).json({ ok: false, error: 'Secure URL login exchange error.' });
  }
});

app.post('/api/calculate', applyCalculateRateLimit, (req, res) => {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  try {
    const model = calculateModel(req.body || {});
    res.json({ ok: true, model });
  } catch (err) {
    res.status(400).json({ ok: false, error: 'Invalid calculation payload.' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'mantenimento-backend' });
});

app.use(express.static(publicDir, {
  extensions: ['html'],
  maxAge: '1h'
}));

app.get('*', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.listen(port, () => {
  const mode = devSourceJs ? ' [DEV — raw app.js]' : '';
  console.log(`Server running on http://localhost:${port}${mode}  (env: ${envFile})`);
});
