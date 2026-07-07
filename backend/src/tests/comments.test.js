/**
 * COMMENT TESTS
 * Covers:
 * - Create: valid, empty body, auth guard, posting on deleted thread
 * - threadCount increment on create
 * - Read: list comments, empty thread, soft-deleted comments hidden
 * - Update: author can edit, non-author → 403
 * - Delete: soft-delete, commentCount decrement, non-author → 403
 * - Accept Answer: owner accepts, unaccepts, non-owner → 403
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
    username: 'commentuser',
    email: 'comment@example.com',
    password: 'password123',
  })
  token = generateAccessToken(user._id)
  thread = await Thread.create({
    title: 'Thread for Comments',
    body: 'Thread body here',
    author: user._id,
  })
})

// ── Create ────────────────────────────────────────────────────────────────────

describe('Comments — Create', () => {
  it('creates a comment on an existing thread → 201', async () => {
    const res = await request(app)
      .post(`/api/v1/threads/${thread._id}/comments`)
      .set('Authorization', `Bearer ${token}`)
      .send({ body: 'This is a helpful answer.' })

    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
    expect(res.body.comment.body).toBe('This is a helpful answer.')
    expect(res.body.comment.author.username).toBe('commentuser')
  })

  it('increments thread.commentCount when a comment is created', async () => {
    await request(app)
      .post(`/api/v1/threads/${thread._id}/comments`)
      .set('Authorization', `Bearer ${token}`)
      .send({ body: 'First answer.' })

    const updated = await Thread.findById(thread._id)
    expect(updated.commentCount).toBe(1)
  })

  it('rejects comment with empty / whitespace-only body → 400', async () => {
    const res = await request(app)
      .post(`/api/v1/threads/${thread._id}/comments`)
      .set('Authorization', `Bearer ${token}`)
      .send({ body: '   ' })

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  it('requires authentication to post a comment → 401', async () => {
    const res = await request(app)
      .post(`/api/v1/threads/${thread._id}/comments`)
      .send({ body: 'Unauthorized comment.' })

    expect(res.status).toBe(401)
  })

  it('returns 404 when posting to a soft-deleted thread', async () => {
    await Thread.findByIdAndUpdate(thread._id, { isDeleted: true })

    const res = await request(app)
      .post(`/api/v1/threads/${thread._id}/comments`)
      .set('Authorization', `Bearer ${token}`)
      .send({ body: 'Comment on deleted thread.' })

    expect(res.status).toBe(404)
    expect(res.body.success).toBe(false)
  })
})

// ── Read ──────────────────────────────────────────────────────────────────────

describe('Comments — Read', () => {
  it('returns all comments for a thread → 200', async () => {
    await Comment.create([
      { body: 'First answer', author: user._id, thread: thread._id },
      { body: 'Second answer', author: user._id, thread: thread._id },
    ])

    const res = await request(app).get(`/api/v1/threads/${thread._id}/comments`)

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.comments).toHaveLength(2)
  })

  it('returns empty array when thread has no comments', async () => {
    const res = await request(app).get(`/api/v1/threads/${thread._id}/comments`)

    expect(res.status).toBe(200)
    expect(res.body.comments).toHaveLength(0)
  })

  it('does not return soft-deleted comments in the list', async () => {
    await Comment.create([
      { body: 'Active comment', author: user._id, thread: thread._id },
      { body: 'Deleted comment', author: user._id, thread: thread._id, isDeleted: true },
    ])

    const res = await request(app).get(`/api/v1/threads/${thread._id}/comments`)

    expect(res.body.comments).toHaveLength(1)
    expect(res.body.comments[0].body).toBe('Active comment')
  })
})

// ── Update ────────────────────────────────────────────────────────────────────

describe('Comments — Update', () => {
  let comment

  beforeEach(async () => {
    comment = await Comment.create({
      body: 'Original comment',
      author: user._id,
      thread: thread._id,
    })
  })

  it('author can update their comment → 200', async () => {
    const res = await request(app)
      .patch(`/api/v1/threads/${thread._id}/comments/${comment._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ body: 'Updated comment body' })

    expect(res.status).toBe(200)
    expect(res.body.comment.body).toBe('Updated comment body')
  })

  it('non-author cannot update comment → 403', async () => {
    const other = await User.create({
      username: 'other',
      email: 'other@example.com',
      password: 'password123',
    })
    const otherToken = generateAccessToken(other._id)

    const res = await request(app)
      .patch(`/api/v1/threads/${thread._id}/comments/${comment._id}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ body: 'Hijacked body' })

    expect(res.status).toBe(403)
    expect(res.body.success).toBe(false)
  })
})

// ── Delete ────────────────────────────────────────────────────────────────────

describe('Comments — Delete', () => {
  let comment

  beforeEach(async () => {
    comment = await Comment.create({
      body: 'Comment to delete',
      author: user._id,
      thread: thread._id,
    })
    await Thread.findByIdAndUpdate(thread._id, { $inc: { commentCount: 1 } })
  })

  it('author can soft-delete their comment → 200', async () => {
    const res = await request(app)
      .delete(`/api/v1/threads/${thread._id}/comments/${comment._id}`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)

    // isDeleted flag should be set in DB
    const deleted = await Comment.findById(comment._id)
    expect(deleted.isDeleted).toBe(true)
  })

  it('deleting a comment decrements thread.commentCount', async () => {
    await request(app)
      .delete(`/api/v1/threads/${thread._id}/comments/${comment._id}`)
      .set('Authorization', `Bearer ${token}`)

    const updated = await Thread.findById(thread._id)
    expect(updated.commentCount).toBe(0)
  })

  it('non-author cannot delete comment → 403', async () => {
    const other = await User.create({
      username: 'other3',
      email: 'other3@example.com',
      password: 'password123',
    })
    const otherToken = generateAccessToken(other._id)

    const res = await request(app)
      .delete(`/api/v1/threads/${thread._id}/comments/${comment._id}`)
      .set('Authorization', `Bearer ${otherToken}`)

    expect(res.status).toBe(403)
  })
})

// ── Accept Answer ─────────────────────────────────────────────────────────────

describe('Comments — Accept Answer', () => {
  let comment

  beforeEach(async () => {
    comment = await Comment.create({
      body: 'This is the correct answer',
      author: user._id,
      thread: thread._id,
    })
  })

  it('thread owner can accept a comment as the answer → 200', async () => {
    const res = await request(app)
      .patch(`/api/v1/threads/${thread._id}/accept/${comment._id}`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.action).toBe('accepted')
    expect(res.body.thread.acceptedComment).toBe(comment._id.toString())
  })

  it('accepting an already-accepted comment unaccepts it (toggle → removed)', async () => {
    // Accept first
    await request(app)
      .patch(`/api/v1/threads/${thread._id}/accept/${comment._id}`)
      .set('Authorization', `Bearer ${token}`)

    // Accept again → toggle off
    const res = await request(app)
      .patch(`/api/v1/threads/${thread._id}/accept/${comment._id}`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.action).toBe('removed')
    expect(res.body.thread.acceptedComment).toBeNull()
  })

  it('non-owner cannot accept an answer → 403', async () => {
    const other = await User.create({
      username: 'nonowner',
      email: 'nonowner@example.com',
      password: 'password123',
    })
    const otherToken = generateAccessToken(other._id)

    const res = await request(app)
      .patch(`/api/v1/threads/${thread._id}/accept/${comment._id}`)
      .set('Authorization', `Bearer ${otherToken}`)

    expect(res.status).toBe(403)
  })

  it('requires auth to accept an answer → 401', async () => {
    const res = await request(app).patch(
      `/api/v1/threads/${thread._id}/accept/${comment._id}`,
    )

    expect(res.status).toBe(401)
  })
})
