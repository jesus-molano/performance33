import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

// Unit tests of the pure code (utils, config). Screens and hooks are checked in the browser.
export default defineConfig({
  resolve: {
    alias: {
      '@shared': fileURLToPath(new URL('../shared', import.meta.url)),
      '@accounts': fileURLToPath(new URL('../supabase/functions/_shared/accounts.ts', import.meta.url)),
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    include: ['src/**/*.test.ts'],
  },
})
