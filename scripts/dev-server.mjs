/**
 * Dev server launcher.
 * Sets DEV_ENV_FILE and DEV_SOURCE_JS before spawning backend/server.js,
 * without requiring cross-env or any extra dependency.
 *
 * Usage:  npm run dev
 *
 * DEV_SOURCE_JS=true  → server serves raw frontend/public/app.js (no rebuild needed)
 * DEV_ENV_FILE=.env.dev → dotenv loads .env.dev instead of .env
 */
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const serverEntry = path.join(root, 'backend', 'server.js');

const child = spawn(process.execPath, [serverEntry], {
  stdio: 'inherit',
  env: {
    ...process.env,
    DEV_ENV_FILE: '.env.dev',
    DEV_SOURCE_JS: 'true',
    NODE_ENV: process.env.NODE_ENV || 'development'
  }
});

child.on('exit', (code) => process.exit(code ?? 0));
