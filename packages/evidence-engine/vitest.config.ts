import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'evidence-engine',
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
