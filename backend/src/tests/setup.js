/**
 * Per-worker test setup.
 * - Sets environment variables needed by app.js BEFORE imports are resolved.
 * - Connects Mongoose to the in-memory replica set once per worker.
 * - Clears all collections after each individual test.
 */
import mongoose from 'mongoose'
import { beforeAll, afterAll, afterEach } from 'vitest'

// ── Env vars (module-level so they're set before any test file imports app.js) ──
process.env.NODE_ENV = 'test'
process.env.ACCESS_TOKEN_SECRET = 'test-access-token-secret-at-least-32-chars'
process.env.REFRESH_TOKEN_SECRET = 'test-refresh-token-secret-at-least-32-chars'
process.env.JWT_EXPIRES_IN = '15m'
process.env.JWT_REFRESH_EXPIRES_IN = '7d'
process.env.FRONTEND_URL = 'http://localhost:5173'
process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud'
process.env.CLOUDINARY_API_KEY = 'test-key'
process.env.CLOUDINARY_API_SECRET = 'test-secret'

beforeAll(async () => {
  // Guard: don't reconnect if another test file already connected
  if (mongoose.connection.readyState !== 0) return
  await mongoose.connect(process.env.MONGODB_TEST_URI)
}, 30000)

afterAll(async () => {
  if (mongoose.connection.readyState === 0) return
  await mongoose.disconnect()
})

afterEach(async () => {
  if (mongoose.connection.readyState === 0) return
  const { collections } = mongoose.connection
  await Promise.all(Object.values(collections).map((col) => col.deleteMany({})))
})
