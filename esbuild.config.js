const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const isWatch = process.argv.includes('--watch');

const sharedConfig = {
  bundle: true,
  format: 'esm',
  external: ['jszip'],
  platform: 'browser',
  loader: { '.tsx': 'tsx', '.ts': 'ts' },
  jsx: 'automatic',
  define: {
    'global': 'window',
    'process.env.NODE_ENV': '"production"'
  },
  inject: ['./node-shims.js'],
  alias: {
    'fs': './fs-stub.js'
  }
};

const configs = [
  {
    ...sharedConfig,
    entryPoints: ['src/main.tsx'],
    outfile: 'dist/bundle.js',
  }
];

/**
 * Copy PDF.js worker file to dist folder
 */
function copyPdfWorker() {
  const workerSrc = path.join(__dirname, 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.mjs');
  const workerDest = path.join(__dirname, 'dist', 'pdf.worker.mjs');

  // Create dist directory if it doesn't exist
  if (!fs.existsSync(path.join(__dirname, 'dist'))) {
    fs.mkdirSync(path.join(__dirname, 'dist'));
  }

  // Copy worker file
  if (fs.existsSync(workerSrc)) {
    fs.copyFileSync(workerSrc, workerDest);
    console.log('✓ Copied PDF.js worker to dist/');
  } else {
    console.warn('⚠ PDF.js worker not found at:', workerSrc);
  }
}

if (isWatch) {
  copyPdfWorker();
  Promise.all(configs.map(config => esbuild.context(config))).then(contexts => {
    contexts.forEach(ctx => ctx.watch());
    console.log('Watching for changes...');
  });
} else {
  copyPdfWorker();
  Promise.all(configs.map(config => esbuild.build(config))).catch(() => process.exit(1));
}
