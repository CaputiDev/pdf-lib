/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@core': path.resolve(__dirname, './src/core'),
      '@app': path.resolve(__dirname, './src/application'),
      '@infra': path.resolve(__dirname, './src/infrastructure'),
      '@ui': path.resolve(__dirname, './src/ui'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.spec.{ts,tsx}'],
  },
})

