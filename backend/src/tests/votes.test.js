/**
 * VOTE TESTS
 * Covers:
 * - Case A (new vote): upvote/downvote increments voteCount correctly
 * - Case B (retract): same-value vote retracts and count returns to baseline
 * - Case C (switch): upvote→downvote switches correctly, delta = ±2
 * - Votes on Comments (not just Threads)
 * - Error cases: non-existent target, invalid targetType, invalid value, no auth
 * - Concurrent voting: 5 simultaneous unique-user votes → all succeed, voteCount exact
 * - User vote map endpoint
 */
import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import app from '../app.js'
import User from '../models/User.js'
import Thread from '../models/Thread.js'
import Comment from '../models/Comment.js'
import { generateAccessToken } from '../utils/tokenUtils.js'

let user, token, thread

beforeEach(async () => {
  user = await User.create({
    username: 'voteuser',
    email: 'vote@example.com',
    password: 'password123',
  })
  token = generateAccessToken(user._id)
  thread = await Thread.create({
    title: 'Thread to vote on',
    body: 'Vote body content here',
    author: user._id,
  })
})

// ── Case A — New Vote ─────────────────────────────────────────────────────────

describe('Votes — Case A: New Vote', () => {
  it('upvoting a thread returns action=created and increments voteCount by 1', async () => {
    const res = await request(app)
      .post('/api/v1/votes')
      .set('Authorization', `Bearer ${token}`)
      .send({ targetId: thread._id, targetType: 'Thread', value: 1 })

    expect(res.status).toBe(201)
    expect(res.body.action).toBe('created')
    expect(res.body.vote.value).toBe(1)

    const updated = await Thread.findById(thread._id)
    expect(updated.voteCount).toBe(1)
  })

  it('downvoting a thread returns action=created and decrements voteCount by 1', async () => {
    const res = await request(app)
      .post('/api/v1/votes')
      .set('Authorization', `Bearer ${token}`)
      .send({ targetId: thread._id, targetType: 'Thread', value: -1 })

    expect(res.status).toBe(201)
    expect(res.body.action).toBe('created')

    const updated = await Thread.findById(thread._id)
    expect(updated.voteCount).toBe(-1)
  })
})

// ── Case B — Retract ──────────────────────────────────────────────────────────

describe('Votes — Case B: Retract (same value voted again)', () => {
  it('upvote → upvote retracts the vote and voteCount returns to 0', async () => {
    await request(app)
      .post('/api/v1/votes')
      .set('Authorization', `Bearer ${token}`)
      .send({ targetId: thread._id, targetType: 'Thread', value: 1 })

    const res = await request(app)
      .post('/api/v1/votes')
      .set('Authorization', `Bearer ${token}`)
      .send({ targetId: thread._id, targetType: 'Thread', value: 1 })

    expect(res.status).toBe(200)
    expect(res.body.action).toBe('retracted')

    const updated = await Thread.findById(thread._id)
    expect(updated.voteCount).toBe(0)
  })

  it('downvote → downvote retracts and voteCount returns to 0', async () => {
    await request(app)
      .post('/api/v1/votes')
      .set('Authorization', `Bearer ${token}`)
      .send({ targetId: thread._id, targetType: 'Thread', value: -1 })

    const res = await request(app)
      .post('/api/v1/votes')
      .set('Authorization', `Bearer ${token}`)
      .send({ targetId: thread._id, targetType: 'Thread', value: -1 })

    expect(res.status).toBe(200)
    expect(res.body.action).toBe('retracted')

    const updated = await Thread.findById(thread._id)
    expect(updated.voteCount).toBe(0)
  })
})

// ── Case C — Switch ───────────────────────────────────────────────────────────

describe('Votes — Case C: Switch Vote Direction', () => {
  it('upvote → downvote switches; voteCount goes from 1 to -1 (delta = -2)', async () => {
    await request(app)
      .post('/api/v1/votes')
      .set('Authorization', `Bearer ${token}`)
      .send({ targetId: thread._id, targetType: 'Thread', value: 1 })

    const res = await request(app)
      .post('/api/v1/votes')
      .set('Authorization', `Bearer ${token}`)
      .send({ targetId: thread._id, targetType: 'Thread', value: -1 })

    expect(res.status).toBe(200)
    expect(res.body.action).toBe('switched')

    const updated = await Thread.findById(thread._id)
    // +1 upvote, then switch: 1 + (-1 * 2) = -1
    expect(updated.voteCount).toBe(-1)
  })

  it('downvote → upvote switches; voteCount goes from -1 to 1 (delta = +2)', async () => {
    await request(app)
      .post('/api/v1/votes')
      .set('Authorization', `Bearer ${token}`)
      .send({ targetId: thread._id, targetType: 'Thread', value: -1 })

    const res = await request(app)
      .post('/api/v1/votes')
      .set('Authorization', `Bearer ${token}`)
      .send({ targetId: thread._id, targetType: 'Thread', value: 1 })

    expect(res.status).toBe(200)
    expect(res.body.action).toBe('switched')

    const updated = await Thread.findById(thread._id)
    // -1 downvote, then switch: -1 + (1 * 2) = 1
    expect(updated.voteCount).toBe(1)
  })
})

// ── Vote on Comment ───────────────────────────────────────────────────────────

describe('Votes — Voting on Comments', () => {
  it('upvotes a comment and increments its voteCount', async () => {
    const comment = await Comment.create({
      body: 'Voteable comment',
      author: user._id,
      thread: thread._id,
    })

    const res = await request(app)
      .post('/api/v1/votes')
      .set('Authorization', `Bearer ${token}`)
      .send({ targetId: comment._id, targetType: 'Comment', value: 1 })

    expect(res.status).toBe(201)
    expect(res.body.action).toBe('created')

    const updated = await Comment.findById(comment._id)
    expect(updated.voteCount).toBe(1)
  })
})

// ── Error Cases ───────────────────────────────────────────────────────────────

describe('Votes — Error Cases', () => {
  it('returns 404 when voting on a non-existent target', async () => {
    const res = await request(app)
      .post('/api/v1/votes')
      .set('Authorization', `Bearer ${token}`)
      .send({ targetId: '64a1b2c3d4e5f6a7b8c9d0e1', targetType: 'Thread', value: 1 })

    expect(res.status).toBe(404)
    expect(res.body.success).toBe(false)
  })

  it('returns 400 for invalid targetType', async () => {
    const res = await request(app)
      .post('/api/v1/votes')
      .set('Authorization', `Bearer ${token}`)
      .send({ targetId: thread._id, targetType: 'Post', value: 1 })

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  it('returns 400 for invalid vote value (not 1 or -1)', async () => {
    const res = await request(app)
      .post('/api/v1/votes')
      .set('Authorization', `Bearer ${token}`)
      .send({ targetId: thread._id, targetType: 'Thread', value: 5 })

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  it('returns 400 for invalid targetId format', async () => {
    const res = await request(app)
      .post('/api/v1/votes')
      .set('Authorization', `Bearer ${token}`)
      .send({ targetId: 'not-a-valid-objectid', targetType: 'Thread', value: 1 })

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  it('requires authentication to vote → 401', async () => {
    const res = await request(app)
      .post('/api/v1/votes')
      .send({ targetId: thread._id, targetType: 'Thread', value: 1 })

    expect(res.status).toBe(401)
  })
})

// ── Concurrent Voting (Race Condition / Atomicity) ────────────────────────────

describe('Votes — Concurrent Voting (Atomicity via Mongoose Transactions)', () => {
  it('5 simultaneous votes from different users all succeed and voteCount is exactly 5', async () => {
    // Create 5 unique voters
    const voters = await User.create(
      Array.from({ length: 5 }, (_, i) => ({
        username: `concurrent_voter_${i}`,
        email: `concurrent${i}@example.com`,
        password: 'password123',
      })),
    )

    const voterTokens = voters.map((v) => generateAccessToken(v._id))

    // Fire all 5 votes simultaneously
    const results = await Promise.allSettled(
      voterTokens.map((vtoken) =>
        request(app)
          .post('/api/v1/votes')
          .set('Authorization', `Bearer ${vtoken}`)
          .send({ targetId: thread._id, targetType: 'Thread', value: 1 }),
      ),
    )

    const successful = results.filter(
      (r) => r.status === 'fulfilled' && r.value.status === 201,
    )

    // Final voteCount must exactly match the number of successful votes
    const updatedThread = await Thread.findById(thread._id)
    expect(updatedThread.voteCount).toBe(successful.length)

    // All 5 should have succeeded (each user voted once on a unique thread)
    expect(successful.length).toBe(5)
  })
})

// ── User Vote Map ─────────────────────────────────────────────────────────────

describe('Votes — Get User Vote Map', () => {
  it('returns the user vote value for a target they voted on', async () => {
    await request(app)
      .post('/api/v1/votes')
      .set('Authorization', `Bearer ${token}`)
      .send({ targetId: thread._id, targetType: 'Thread', value: 1 })

    const res = await request(app)
      .get(`/api/v1/votes/user-votes?targetIds=${thread._id}&targetType=Thread`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.votes[thread._id.toString()]).toBe(1)
  })

  it('returns an empty object when user has no votes on specified targets', async () => {
    const res = await request(app)
      .get(`/api/v1/votes/user-votes?targetIds=${thread._id}&targetType=Thread`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.votes).toEqual({})
  })

  it('requires authentication for vote map → 401', async () => {
    const res = await request(app).get(
      `/api/v1/votes/user-votes?targetIds=${thread._id}&targetType=Thread`,
    )
    expect(res.status).toBe(401)
  })
})
