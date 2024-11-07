import * as esbuild from 'esbuild'
import { globSync } from 'glob'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url';
import clear from "esbuild-plugin-output-reset";
import inline from "esbuild-plugin-inline-import"

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

await esbuild.build({
  entryPoints: [
    resolve(__dirname, 'src/index.tsx'),
    resolve(__dirname, 'src/module.tsx'),
  ],
  bundle: true,
  // minify: true,
  format: 'esm',
  outdir: './dist',
  platform: 'browser',
  loader: {'.js': 'jsx'},
  mainFields: ['module', 'main'],
  logLevel: "info",
  define: {
    "process.env.NODE_ENV": '"production"'
  },
  plugins: [inline(), clear],
})
