import { builtinModules } from 'node:module'

import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    target: 'node24',
    outDir: 'build',
    lib: {
      entry: 'src/index.ts',
      formats: ['cjs'],
      fileName: () => 'index.js',
    },
    rollupOptions: {
      external: [...builtinModules, ...builtinModules.map((m) => `node:${m}`)],
    },
  },
  plugins: [
    {
      name: 'shebang',
      renderChunk(code) {
        return '#!/usr/bin/env node\n' + code
      },
    },
  ],
})
