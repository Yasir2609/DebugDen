/**
 * SECURITY & API QUALITY TESTS
 * Covers:
 * - Error response shape consistency (all errors: { success, message } or { success, message, errors })
 * - Input validation returns field-specific errors from express-validator
 * - NoSQL injection prevention via express-mongo-sanitize
 * - Unknown routes return 404
 * - CORS: allowed origin gets ACAO header
 * - Health check endpoint
 */
import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../app.js'

// ── Error Response Shape ──────────────────────────────────────────────────────

describe('API — Error Response Shape Consistency', () => {
  it('400 validation errors → { success: false, message, errors[] }', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({})

    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('success', false)
    expect(res.body).toHaveProperty('message')
    expect(res.body).toHaveProperty('errors')
    expect(Array.isArray(res.body.errors)).toBe(true)
  })

  it('401 unauthorized → { success: false, message }', async () => {
    const res = await request(app).get('/api/v1/auth/user')

    expect(res.status).toBe(401)
    expect(res.body).toHaveProperty('success', false)
    expect(res.body).toHaveProperty('message')
    expect(typeof res.body.message).toBe('string')
  })

  it('404 not found → { success: false, message }', async () => {
    const res = await request(app).get('/api/v1/threads/64a1b2c3d4e5f6a7b8c9d0e1')

    expect(res.status).toBe(404)
    expect(res.body).toHaveProperty('success', false)
    expect(res.body).toHaveProperty('message')
  })

  it('unknown routes → 404 with descriptive message', async () => {
    const res = await request(app).get('/api/v1/this-route-absolutely-does-not-exist')

    expect(res.status).toBe(404)
    expect(res.body.success).toBe(false)
    expect(res.body.message.toLowerCase()).toMatch(/not found|cannot find/i)
  })

  it('validation errors include field-specific error objects', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      username: 'ab', // too short
      email: 'bad-email',
      password: '12', // too short
    })

    expect(res.status).toBe(400)
    expect(res.body.errors.length).toBeGreaterThan(0)

    const firstError = res.body.errors[0]
    expect(firstError).toHaveProperty('field')
    expect(firstError).toHaveProperty('message')
  })
})

// ── Input Validation ──────────────────────────────────────────────────────────

describe('API — Input Validation (POST/PATCH routes)', () => {
  it('POST /auth/register with empty body → 400 with errors array', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({})
    expect(res.status).toBe(400)
    expect(res.body.errors.length).toBeGreaterThan(0)
  })

  it('POST /auth/login with empty body → 400', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({})
    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  it('vote with value=0 (not 1 or -1) → 400', async () => {
    // Register and login to get token
    const authRes = await request(app).post('/api/v1/auth/register').send({
      username: 'valuser',
      email: 'val@example.com',
      password: 'password123',
    })
    const token = authRes.body.accessToken

    const res = await request(app)
      .post('/api/v1/votes')
      .set('Authorization', `Bearer ${token}`)
      .send({ targetId: '64a1b2c3d4e5f6a7b8c9d0e1', targetType: 'Thread', value: 0 })

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  it('vote with targetType not in enum → 400', async () => {
    const authRes = await request(app).post('/api/v1/auth/register').send({
      username: 'valuser2',
      email: 'val2@example.com',
      password: 'password123',
    })
    const token = authRes.body.accessToken

    const res = await request(app)
      .post('/api/v1/votes')
      .set('Authorization', `Bearer ${token}`)
      .send({ targetId: '64a1b2c3d4e5f6a7b8c9d0e1', targetType: 'InvalidType', value: 1 })

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })
})

// ── NoSQL Injection Prevention ────────────────────────────────────────────────

describe('API — NoSQL Injection Prevention (express-mongo-sanitize)', () => {
  it('NoSQL operator in login email does NOT bypass authentication', async () => {
    // If injection worked, this would match ANY document and log us in
    const res = await request(app).post('/api/v1/auth/login').send({
      email: { $gt: '' },
      password: { $gt: '' },
    })

    // Must NOT be 200 — injection must not succeed
    expect(res.status).not.toBe(200)
    expect(res.body.success).toBe(false)
  })

  it('NoSQL operator injection in register fields is blocked', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      username: { $where: 'this.username.length > 0' },
      email: 'test@test.com',
      password: 'password123',
    })

    // Validation or sanitization must reject this
    expect(res.status).not.toBe(201)
    expect(res.body.success).toBe(false)
  })
})

// ── CORS ──────────────────────────────────────────────────────────────────────

describe('API — CORS', () => {
  it('requests from the configured FRONTEND_URL origin get ACAO header', async () => {
    const res = await request(app)
      .get('/api/v1/health')
      .set('Origin', 'http://localhost:5173')

    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173')
  })

  it('health check endpoint returns 200 with status info', async () => {
    const res = await request(app).get('/api/v1/health')

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(typeof res.body.message).toBe('string')
  })
})
