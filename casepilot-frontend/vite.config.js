import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { defineConfig as defineVitestConfig } from 'vitest/config';
export default defineVitestConfig(defineConfig({
    server: {
        host: true,
        proxy: {
            '/api': {
                target: 'https://localhost:7154',
                secure: false,
                changeOrigin: true
            },
            '/hubs': {
                target: 'https://localhost:7154',
                secure: false,
                ws: true
            }
        }
    },
    plugins: [react()],
    test: {
        environment: 'jsdom',
        setupFiles: './src/test/setup.ts',
        globals: true,
        exclude: ['e2e/**', 'node_modules/**', 'dist/**'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html'],
            include: ['src/**/*.{ts,tsx}'],
            exclude: ['src/**/*.test.{ts,tsx}', 'src/main.tsx', 'src/features/cases/types/case.ts']
        }
    }
}));
