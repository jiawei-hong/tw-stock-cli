import { builtinModules } from 'node:module'
import path from 'node:path'

import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      fs: 'node:fs',
      path: 'node:path',
    },
  },
  test: {
    server: {
      deps: {
        external: [
          ...builtinModules,
          ...builtinModules.map((m) => `node:${m}`),
        ],
      },
    },
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/index.ts'],
    },
  },
})
