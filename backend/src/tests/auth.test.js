/**
 * AUTH TESTS
 * Covers:
 * - Register: valid data, all missing-field cases, weak password, duplicate email/username
 * - Login: correct credentials, wrong password, non-existent email, missing fields
 * - JWT: httpOnly cookie set, password never exposed
 * - Token refresh & rotation: new pair issued, old token invalidated after rotation
 * - Logout: cookie cleared, token revoked on server
 * - Protected routes: no token, expired token, tampered token
 */
import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import jwt from 'jsonwebtoken'
import app from '../app.js'

const VALID_USER = {
  username: 'testuser',
  email: 'test@example.com',
  password: 'password123',
}

// ── Helpers ──────────────────────────────────────────────────────────────────

async function registerUser(data = VALID_USER) {
  return request(app).post('/api/v1/auth/register').send(data)
}

async function loginUser(email = VALID_USER.email, password = VALID_USER.password) {
  return request(app).post('/api/v1/auth/login').send({ email, password })
}

// ── Register ──────────────────────────────────────────────────────────────────

describe('Auth — Register', () => {
  it('registers a new user with valid data → 201', async () => {
    const res = await registerUser()

    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
    expect(res.body.accessToken).toBeDefined()
    expect(res.body.user.username).toBe('testuser')
    expect(res.body.user.email).toBe('test@example.com')
  })

  it('never exposes password in register response', async () => {
    const res = await registerUser()
    expect(res.body.user.password).toBeUndefined()
  })

  it('sets an httpOnly refreshToken cookie on register', async () => {
    const res = await registerUser()
    const cookies = res.headers['set-cookie'] ?? []

    expect(cookies.some((c) => c.startsWith('refreshToken='))).toBe(true)
    expect(cookies.some((c) => c.toLowerCase().includes('httponly'))).toBe(true)
  })

  it('rejects register — missing username → 400', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'test@example.com', password: 'password123' })

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
    expect(Array.isArray(res.body.errors)).toBe(true)
  })

  it('rejects register — missing email → 400', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ username: 'testuser', password: 'password123' })

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  it('rejects register — missing password → 400', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ username: 'testuser', email: 'test@example.com' })

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  it('rejects register — invalid email format → 400', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ username: 'testuser', email: 'not-an-email', password: 'password123' })

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  it('rejects register — weak password (< 6 chars) → 400', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ username: 'testuser', email: 'test@example.com', password: '123' })

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  it('rejects register — username too short (< 3 chars) → 400', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ username: 'ab', email: 'test@example.com', password: 'password123' })

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  it('rejects register — duplicate email → 400', async () => {
    await registerUser()

    const res = await request(app).post('/api/v1/auth/register').send({
      username: 'differentuser',
      email: 'test@example.com', // same email
      password: 'password123',
    })

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
    expect(res.body.message.toLowerCase()).toContain('email')
  })

  it('rejects register — duplicate username → 400', async () => {
    await registerUser()

    const res = await request(app).post('/api/v1/auth/register').send({
      username: 'testuser', // same username
      email: 'different@example.com',
      password: 'password123',
    })

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
    expect(res.body.message.toLowerCase()).toContain('username')
  })
})

// ── Login ─────────────────────────────────────────────────────────────────────

describe('Auth — Login', () => {
  beforeEach(async () => {
    await registerUser()
  })

  it('logs in with correct credentials → 200', async () => {
    const res = await loginUser()

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.accessToken).toBeDefined()
  })

  it('never exposes password in login response', async () => {
    const res = await loginUser()
    expect(res.body.user.password).toBeUndefined()
  })

  it('rejects login — wrong password → 401', async () => {
    const res = await loginUser(VALID_USER.email, 'wrongpassword')
    expect(res.status).toBe(401)
    expect(res.body.success).toBe(false)
  })

  it('rejects login — non-existent email → 401', async () => {
    const res = await loginUser('nobody@example.com', 'password123')
    expect(res.status).toBe(401)
    expect(res.body.success).toBe(false)
  })

  it('rejects login — missing password → 400', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: VALID_USER.email })

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  it('rejects login — invalid email format → 400', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'not-email', password: 'password123' })

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })
})

// ── Refresh Token Rotation ────────────────────────────────────────────────────

describe('Auth — Refresh Token Rotation', () => {
  it('issues a NEW token pair on refresh → 200', async () => {
    const loginRes = await registerUser()
    const cookie = loginRes.headers['set-cookie']

    const refreshRes = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', cookie)

    expect(refreshRes.status).toBe(200)
    expect(refreshRes.body.accessToken).toBeDefined()
    // New access token must differ from the one issued at register
    expect(refreshRes.body.accessToken).not.toBe(loginRes.body.accessToken)
  })

  it('old refresh token is invalidated after rotation (reuse → 401)', async () => {
    const loginRes = await registerUser()
    const oldCookie = loginRes.headers['set-cookie']

    // First use rotates the token
    await request(app).post('/api/v1/auth/refresh').set('Cookie', oldCookie)

    // Reusing the old cookie must now fail
    const reuseRes = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', oldCookie)

    expect(reuseRes.status).toBe(401)
    expect(reuseRes.body.success).toBe(false)
  })

  it('rejects refresh — no cookie → 401', async () => {
    const res = await request(app).post('/api/v1/auth/refresh')
    expect(res.status).toBe(401)
    expect(res.body.success).toBe(false)
  })

  it('rejects refresh — tampered token → 401', async () => {
    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', 'refreshToken=tampered.invalid.token')

    expect(res.status).toBe(401)
    expect(res.body.success).toBe(false)
  })
})

// ── Logout ────────────────────────────────────────────────────────────────────

describe('Auth — Logout', () => {
  it('logout clears the refreshToken cookie → 200', async () => {
    const loginRes = await registerUser()
    const cookie = loginRes.headers['set-cookie']

    const logoutRes = await request(app)
      .post('/api/v1/auth/logout')
      .set('Cookie', cookie)

    expect(logoutRes.status).toBe(200)
    expect(logoutRes.body.success).toBe(true)

    const setCookie = logoutRes.headers['set-cookie'] ?? []
    const refreshCookie = setCookie.find((c) => c.startsWith('refreshToken='))
    // Cookie is cleared: empty value OR expires in the past
    expect(refreshCookie).toMatch(/refreshToken=($|;)|expires=Thu, 01 Jan 1970|Max-Age=0/i)
  })

  it('logout invalidates refresh token on server (post-logout refresh → 401)', async () => {
    const loginRes = await registerUser()
    const cookie = loginRes.headers['set-cookie']

    await request(app).post('/api/v1/auth/logout').set('Cookie', cookie)

    const refreshRes = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', cookie)

    expect(refreshRes.status).toBe(401)
  })
})

// ── Protected Route Guards ────────────────────────────────────────────────────

describe('Auth — Protected Route Guards', () => {
  it('rejects request with NO token → 401', async () => {
    const res = await request(app).get('/api/v1/auth/user')
    expect(res.status).toBe(401)
    expect(res.body.success).toBe(false)
  })

  it('rejects request with EXPIRED access token → 401', async () => {
    // Sign a token with a past expiry
    const expiredToken = jwt.sign(
      { id: 'deadbeefdeadbeefdeadbeef' },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: -1 }, // already expired
    )

    const res = await request(app)
      .get('/api/v1/auth/user')
      .set('Authorization', `Bearer ${expiredToken}`)

    expect(res.status).toBe(401)
    expect(res.body.success).toBe(false)
  })

  it('rejects request with TAMPERED access token → 401', async () => {
    const loginRes = await registerUser()
    const token = loginRes.body.accessToken
    const tampered = token.slice(0, -5) + 'XXXXX'

    const res = await request(app)
      .get('/api/v1/auth/user')
      .set('Authorization', `Bearer ${tampered}`)

    expect(res.status).toBe(401)
    expect(res.body.success).toBe(false)
  })

  it('returns current user with a VALID token → 200', async () => {
    const loginRes = await registerUser()
    const token = loginRes.body.accessToken

    const res = await request(app)
      .get('/api/v1/auth/user')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.user.username).toBe('testuser')
    expect(res.body.user.password).toBeUndefined()
  })
})
