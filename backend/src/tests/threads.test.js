/**
 * THREAD TESTS
 * Covers:
 * - Create: valid data, missing fields, auth guard, tag normalisation
 * - Read: single thread, 404 for missing/deleted, list
 * - Update: author can edit, non-author gets 403
 * - Delete: author soft-deletes, non-author gets 403, thread disappears from GET
 * - Search: results returned, empty query → 400, no matches → empty array, special chars safe
 * - Cursor pagination: first page, second page, no duplicates, combined = total
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
    username: 'threaduser',
    email: 'thread@example.com',
    password: 'password123',
  })
  token = generateAccessToken(user._id)
})

// ── Create ────────────────────────────────────────────────────────────────────

describe('Threads — Create', () => {
  it('creates a thread with valid data → 201', async () => {
    const res = await request(app)
      .post('/api/v1/threads')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'How to do X?', body: 'I need help with X in depth.' })

    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
    expect(res.body.thread.title).toBe('How to do X?')
    expect(res.body.thread.author.username).toBe('threaduser')
  })

  it('requires auth to create a thread → 401', async () => {
    const res = await request(app)
      .post('/api/v1/threads')
      .send({ title: 'Unauthorized', body: 'No token provided.' })

    expect(res.status).toBe(401)
  })

  it('rejects thread — missing title → 400', async () => {
    const res = await request(app)
      .post('/api/v1/threads')
      .set('Authorization', `Bearer ${token}`)
      .send({ body: 'Just a body, no title.' })

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  it('rejects thread — missing body → 400', async () => {
    const res = await request(app)
      .post('/api/v1/threads')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Just a title' })

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  it('normalises tags to lowercase and caps at 5', async () => {
    const res = await request(app)
      .post('/api/v1/threads')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Tagged question',
        body: 'Body content here.',
        tags: ['JAVASCRIPT', 'React', 'node', 'extra1', 'extra2', 'extra3'],
      })

    expect(res.status).toBe(201)
    expect(res.body.thread.tags).toHaveLength(5)
    expect(res.body.thread.tags.every((t) => t === t.toLowerCase())).toBe(true)
  })
})

// ── Read ──────────────────────────────────────────────────────────────────────

describe('Threads — Read', () => {
  let thread

  beforeEach(async () => {
    thread = await Thread.create({
      title: 'Test Thread',
      body: 'Test body content',
      author: user._id,
    })
  })

  it('returns a list of threads → 200', async () => {
    const res = await request(app).get('/api/v1/threads')

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(Array.isArray(res.body.threads)).toBe(true)
    expect(res.body.threads.length).toBeGreaterThan(0)
  })

  it('gets a specific thread by id → 200', async () => {
    const res = await request(app).get(`/api/v1/threads/${thread._id}`)

    expect(res.status).toBe(200)
    expect(res.body.thread.title).toBe('Test Thread')
    expect(res.body.thread.author.username).toBe('threaduser')
  })

  it('returns 404 for non-existent thread id', async () => {
    const res = await request(app).get('/api/v1/threads/64a1b2c3d4e5f6a7b8c9d0e1')
    expect(res.status).toBe(404)
    expect(res.body.success).toBe(false)
  })

  it('returns 400 for invalid ObjectId format', async () => {
    const res = await request(app).get('/api/v1/threads/not-a-valid-id')
    expect(res.status).toBe(400)
  })

  it('returns 404 for soft-deleted threads', async () => {
    await Thread.findByIdAndUpdate(thread._id, { isDeleted: true })

    const res = await request(app).get(`/api/v1/threads/${thread._id}`)
    expect(res.status).toBe(404)
  })
})

// ── Update ────────────────────────────────────────────────────────────────────

describe('Threads — Update', () => {
  let thread

  beforeEach(async () => {
    thread = await Thread.create({
      title: 'Original title',
      body: 'Original body',
      author: user._id,
    })
  })

  it('author can update their thread → 200', async () => {
    const res = await request(app)
      .patch(`/api/v1/threads/${thread._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Updated title' })

    expect(res.status).toBe(200)
    expect(res.body.thread.title).toBe('Updated title')
  })

  it('non-author cannot update thread → 403', async () => {
    const other = await User.create({
      username: 'other',
      email: 'other@example.com',
      password: 'password123',
    })
    const otherToken = generateAccessToken(other._id)

    const res = await request(app)
      .patch(`/api/v1/threads/${thread._id}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ title: 'Hijacked title' })

    expect(res.status).toBe(403)
    expect(res.body.success).toBe(false)
  })
})

// ── Delete ────────────────────────────────────────────────────────────────────

describe('Threads — Delete', () => {
  let thread

  beforeEach(async () => {
    thread = await Thread.create({
      title: 'Delete me',
      body: 'To be deleted',
      author: user._id,
    })
  })

  it('author can soft-delete their thread → 200', async () => {
    const res = await request(app)
      .delete(`/api/v1/threads/${thread._id}`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
  })

  it('deleted thread is no longer accessible via GET → 404', async () => {
    await request(app)
      .delete(`/api/v1/threads/${thread._id}`)
      .set('Authorization', `Bearer ${token}`)

    const getRes = await request(app).get(`/api/v1/threads/${thread._id}`)
    expect(getRes.status).toBe(404)
  })

  it('non-author cannot delete thread → 403', async () => {
    const other = await User.create({
      username: 'other2',
      email: 'other2@example.com',
      password: 'password123',
    })
    const otherToken = generateAccessToken(other._id)

    const res = await request(app)
      .delete(`/api/v1/threads/${thread._id}`)
      .set('Authorization', `Bearer ${otherToken}`)

    expect(res.status).toBe(403)
  })
})

// ── Search ────────────────────────────────────────────────────────────────────

describe('Threads — Full-Text Search', () => {
  beforeEach(async () => {
    await Thread.create([
      { title: 'How to use React hooks properly?', body: 'useState and useEffect guide', author: user._id },
      { title: 'Node.js Express middleware setup', body: 'Building robust Express apps', author: user._id },
      { title: 'MongoDB aggregation pipeline tutorial', body: 'Advanced query patterns', author: user._id },
    ])
    // Brief delay to let text indexes update
    await new Promise((r) => setTimeout(r, 150))
  })

  it('returns relevant results for a valid query → 200', async () => {
    const res = await request(app).get('/api/v1/threads/search?q=React+hooks')

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(Array.isArray(res.body.threads)).toBe(true)
    expect(res.body.threads.length).toBeGreaterThan(0)
  })

  it('returns 400 for empty search query', async () => {
    const res = await request(app).get('/api/v1/threads/search?q=')
    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  it('returns 400 when q param is missing entirely', async () => {
    const res = await request(app).get('/api/v1/threads/search')
    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  it('returns empty array gracefully for no-match query → 200', async () => {
    const res = await request(app).get(
      '/api/v1/threads/search?q=xyznonexistentterm98765',
    )

    expect(res.status).toBe(200)
    expect(res.body.threads).toHaveLength(0)
  })

  it('handles special characters without crashing → not 500', async () => {
    const res = await request(app).get(
      `/api/v1/threads/search?q=${encodeURIComponent('SELECT * FROM users; --')}`,
    )

    // Should not crash (500). May return 200 or 400.
    expect(res.status).not.toBe(500)
    expect(res.body.success).toBeDefined()
  })
})

// ── Cursor Pagination ─────────────────────────────────────────────────────────

describe('Threads — Cursor Pagination', () => {
  beforeEach(async () => {
    await Thread.create(
      Array.from({ length: 15 }, (_, i) => ({
        title: `Thread number ${String(i + 1).padStart(2, '0')}`,
        body: `Body for thread ${i + 1}`,
        author: user._id,
      })),
    )
  })

  it('first page returns the requested limit and a nextCursor', async () => {
    const res = await request(app).get('/api/v1/threads?limit=10')

    expect(res.status).toBe(200)
    expect(res.body.threads).toHaveLength(10)
    expect(res.body.nextCursor).not.toBeNull()
  })

  it('second page returns remaining items with no nextCursor', async () => {
    const first = await request(app).get('/api/v1/threads?limit=10')
    const cursor = first.body.nextCursor

    const second = await request(app).get(`/api/v1/threads?limit=10&cursor=${cursor}`)

    expect(second.status).toBe(200)
    expect(second.body.threads).toHaveLength(5)
    expect(second.body.nextCursor).toBeNull()
  })

  it('no duplicate items appear across two consecutive pages', async () => {
    const first = await request(app).get('/api/v1/threads?limit=10')
    const second = await request(app).get(
      `/api/v1/threads?limit=10&cursor=${first.body.nextCursor}`,
    )

    const firstIds = new Set(first.body.threads.map((t) => t._id))
    const overlap = second.body.threads.filter((t) => firstIds.has(t._id))
    expect(overlap).toHaveLength(0)
  })

  it('two pages combined cover all 15 threads', async () => {
    const first = await request(app).get('/api/v1/threads?limit=10')
    const second = await request(app).get(
      `/api/v1/threads?limit=10&cursor=${first.body.nextCursor}`,
    )

    expect(first.body.threads.length + second.body.threads.length).toBe(15)
  })
})
