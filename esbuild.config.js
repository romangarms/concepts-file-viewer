const esbuild = require('esbuild');

const isWatch = process.argv.includes('--watch');

const config = {
  entryPoints: ['src/main.ts'],
  bundle: true,
  format: 'esm',
  outfile: 'dist/bundle.js',
  external: ['jszip'],
  platform: 'browser',
  define: {
    'global': 'window',
    'process.env.NODE_ENV': '"production"'
  },
  inject: ['./node-shims.js'],
  alias: {
    'fs': './fs-stub.js'
  }
};

if (isWatch) {
  esbuild.context(config).then(ctx => {
    ctx.watch();
    console.log('Watching for changes...');
  });
} else {
  esbuild.build(config).catch(() => process.exit(1));
}
