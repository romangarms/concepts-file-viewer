const esbuild = require('esbuild');

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

if (isWatch) {
  Promise.all(configs.map(config => esbuild.context(config))).then(contexts => {
    contexts.forEach(ctx => ctx.watch());
    console.log('Watching for changes...');
  });
} else {
  Promise.all(configs.map(config => esbuild.build(config))).catch(() => process.exit(1));
}
