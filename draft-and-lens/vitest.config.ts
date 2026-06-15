import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Test-only: neutralise the server-only / client-only guards so the suite can
      // import server modules to inspect them. See tests/stubs/server-only.ts —
      // this does not weaken any real protection (checks read files as text / scan
      // the built bundle).
      'server-only': path.resolve(__dirname, './tests/stubs/server-only.ts'),
      'client-only': path.resolve(__dirname, './tests/stubs/server-only.ts'),
    },
  },
});
