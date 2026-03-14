'use strict';

require('dotenv').config();

const path = require('path');
const fs = require('fs');
const express = require('express');
const { calculateModel } = require('./calculate-model');

const app = express();
const port = Number(process.env.PORT || 3000);

const publicDir = path.join(__dirname, '..', 'frontend', 'public');

app.disable('x-powered-by');
app.use(express.json({ limit: '256kb' }));
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  next();
});

// Serve minified bundle when available, fallback to source app.js in development.
app.get('/app.js', (req, res) => {
  const minPath = path.join(publicDir, 'app.min.js');
  const sourcePath = path.join(publicDir, 'app.js');
  const target = fs.existsSync(minPath) ? minPath : sourcePath;
  res.sendFile(target);
});

app.post('/api/calculate', (req, res) => {
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
