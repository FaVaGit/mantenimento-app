import { build } from 'esbuild';
import path from 'node:path';
import fs from 'node:fs';

const root = process.cwd();
const sourceApp = path.join(root, 'app.js');
const entry = path.join(root, 'frontend', 'public', 'app.js');
const outfile = path.join(root, 'frontend', 'public', 'app.min.js');

// Keep frontend/public/app.js in sync with the root app.js source.
if (fs.existsSync(sourceApp)) {
  fs.copyFileSync(sourceApp, entry);
}

await build({
  entryPoints: [entry],
  outfile,
  bundle: false,
  minify: true,
  legalComments: 'none',
  charset: 'ascii',
  target: ['es2020']
});

console.log('Built frontend/public/app.min.js');
