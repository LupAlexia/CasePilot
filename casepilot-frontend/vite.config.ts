import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { defineConfig as defineVitestConfig } from 'vitest/config';

export default defineVitestConfig(
  defineConfig({
    server: {
      host: true,
      proxy: {
        '/api': {
          target: 'https://localhost:7154',
          secure: false,
          changeOrigin: true
        },
      }
    },
    plugins: [react()],
    test: {
      environment: 'jsdom',
      setupFiles: './src/test/setup.ts',
      globals: true,
      // Use forked processes for test-file isolation; limit to 2 concurrent workers
      // to avoid OOM on machines with constrained memory (pdfjs-dist is heavy).
      pool: 'forks',
      poolOptions: {
        forks: {
          maxForks: 2,
          minForks: 1
        }
      },
      exclude: ['e2e/**', 'node_modules/**', 'dist/**'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html'],
        include: ['src/**/*.{ts,tsx}'],
        exclude: ['src/**/*.test.{ts,tsx}', 'src/main.tsx', 'src/features/cases/types/case.ts']
      }
    }
  })
);
