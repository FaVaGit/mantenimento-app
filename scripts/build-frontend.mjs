import { build } from 'esbuild';
import path from 'node:path';

const root = process.cwd();
const entry = path.join(root, 'frontend', 'public', 'app.js');
const outfile = path.join(root, 'frontend', 'public', 'app.min.js');

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
