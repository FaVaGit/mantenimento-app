import { build } from 'esbuild';
import { context } from 'esbuild';
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

const watchMode = process.argv.includes('--watch');

const buildOptions = {
  entryPoints: [entry],
  outfile,
  bundle: false,
  minify: true,
  legalComments: 'none',
  charset: 'ascii',
  target: ['es2020']
};

if (watchMode) {
  // In watch mode: also watch the root app.js source and re-sync on every rebuild.
  const ctx = await context({
    ...buildOptions,
    plugins: [{
      name: 'sync-source',
      setup(build) {
        build.onStart(() => {
          if (fs.existsSync(sourceApp)) {
            fs.copyFileSync(sourceApp, entry);
          }
        });
        build.onEnd((result) => {
          if (result.errors.length === 0) {
            console.log(`[${new Date().toLocaleTimeString()}] Rebuilt app.min.js`);
          }
        });
      }
    }]
  });
  await ctx.watch();
  console.log('Watching for changes (app.js -> app.min.js). Ctrl+C to stop.');
} else {
  await build(buildOptions);
  console.log('Built frontend/public/app.min.js');
}
