import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    globalSetup: './src/tests/global-setup.js',
    setupFiles: ['./src/tests/setup.js'],
    testTimeout: 30000,
    hookTimeout: 60000,
    // Vitest 4: singleFork is a top-level option
    singleFork: true,
    // Run test files sequentially — prevents afterEach cleanup in one file
    // from deleting data needed by another file's in-flight HTTP requests
    fileParallelism: false,
    reporters: ['verbose'],
  },
})
