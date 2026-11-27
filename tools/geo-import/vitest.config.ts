import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'geo-import',
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
