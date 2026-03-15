'use strict';

require('dotenv').config();

const path = require('path');
const fs = require('fs');
const express = require('express');
const { calculateModel } = require('./calculate-model');

const app = express();
const port = Number(process.env.PORT || 3000);
const calculateRateWindowMs = Number(process.env.CALCULATE_RATE_WINDOW_MS || 60_000);
const calculateRateMaxRequests = Number(process.env.CALCULATE_RATE_MAX_REQUESTS || 30);
const calculateRequestLog = new Map();

const publicDir = path.join(__dirname, '..', 'frontend', 'public');

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

// Serve minified bundle when available, fallback to source app.js in development.
app.get('/app.js', (req, res) => {
  const minPath = path.join(publicDir, 'app.min.js');
  const sourcePath = path.join(publicDir, 'app.js');
  const target = fs.existsSync(minPath) ? minPath : sourcePath;
  res.sendFile(target);
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
  console.log(`Server running on http://localhost:${port}`);
});
