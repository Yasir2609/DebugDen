/**
 * USER ROUTE TESTS
 * Covers:
 * - Public profile: accessible without auth (Bug #1 fix verified)
 * - Sensitive fields never exposed (password, refreshTokens, role removed per Bug #2)
 * - Public thread list for a user
 * - Private /user route: auth required for GET and PATCH
 * - Profile update: bio, username change
 */
import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import app from '../app.js'
import User from '../models/User.js'
import Thread from '../models/Thread.js'
import { generateAccessToken } from '../utils/tokenUtils.js'

let user, token

beforeEach(async () => {
  user = await User.create({
    username: 'profileuser',
    email: 'profile@example.com',
    password: 'password123',
  })
  token = generateAccessToken(user._id)
})

// ── Public Profile ────────────────────────────────────────────────────────────

describe('Users — Public Profile (no auth required)', () => {
  it('returns user profile WITHOUT authentication → 200 (Bug #1 fix)', async () => {
    const res = await request(app).get(`/api/v1/users/${user.username}`)

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.user.username).toBe('profileuser')
  })

  it('returns 404 for a non-existent username', async () => {
    const res = await request(app).get('/api/v1/users/nobody_here')

    expect(res.status).toBe(404)
    expect(res.body.success).toBe(false)
  })

  it('does not expose sensitive fields (password, refreshTokens, role)', async () => {
    const res = await request(app).get(`/api/v1/users/${user.username}`)

    expect(res.body.user.password).toBeUndefined()
    expect(res.body.user.refreshTokens).toBeUndefined()
    // Bug #2 fix: role was always undefined because it's not on the schema
    expect(res.body.user.role).toBeUndefined()
  })

  it("returns the user's public thread list without auth → 200", async () => {
    await Thread.create([
      { title: 'Thread 1', body: 'Body 1', author: user._id },
      { title: 'Thread 2', body: 'Body 2', author: user._id },
    ])

    const res = await request(app).get(`/api/v1/users/${user.username}/threads`)

    expect(res.status).toBe(200)
    expect(res.body.threads).toHaveLength(2)
  })

  it('thread list only includes non-deleted threads', async () => {
    await Thread.create([
      { title: 'Active', body: 'Body', author: user._id },
      { title: 'Deleted', body: 'Body', author: user._id, isDeleted: true },
    ])

    const res = await request(app).get(`/api/v1/users/${user.username}/threads`)

    expect(res.body.threads).toHaveLength(1)
    expect(res.body.threads[0].title).toBe('Active')
  })
})

// ── Private Routes ────────────────────────────────────────────────────────────

describe('Users — Private Routes (auth required)', () => {
  it('GET /users/user returns current user data with valid token → 200', async () => {
    const res = await request(app)
      .get('/api/v1/users/user')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.user.username).toBe('profileuser')
    expect(res.body.user.email).toBe('profile@example.com')
  })

  it('GET /users/user without token → 401', async () => {
    const res = await request(app).get('/api/v1/users/user')
    expect(res.status).toBe(401)
    expect(res.body.success).toBe(false)
  })

  it('PATCH /users/user updates bio successfully → 200', async () => {
    const res = await request(app)
      .patch('/api/v1/users/user')
      .set('Authorization', `Bearer ${token}`)
      .send({ bio: 'My updated bio about myself' })

    expect(res.status).toBe(200)
    expect(res.body.user.bio).toBe('My updated bio about myself')
  })

  it('PATCH /users/user without token → 401', async () => {
    const res = await request(app).patch('/api/v1/users/user').send({ bio: 'Hack' })

    expect(res.status).toBe(401)
    expect(res.body.success).toBe(false)
  })

  it('PATCH /users/user ignores non-allowed fields (username is read-only) → 200', async () => {
    const res = await request(app)
      .patch('/api/v1/users/user')
      .set('Authorization', `Bearer ${token}`)
      .send({ username: 'hacker', bio: 'legitimate bio update' })

    // Username must not change; bio should update; no error
    expect(res.status).toBe(200)
    expect(res.body.user.username).toBe('profileuser') // unchanged
    expect(res.body.user.bio).toBe('legitimate bio update')
  })
})
