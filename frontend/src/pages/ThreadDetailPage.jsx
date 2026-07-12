import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Clock, Pencil, Trash2, MessageSquare, Send, CheckCircle2, Check } from 'lucide-react'
import api from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { timeAgo, calculateVoteDelta } from '@/lib/utils'
import Spinner from '@/components/ui/Spinner'
import VoteButtons from '@/components/shared/VoteButtons'
import TagChip from '@/components/shared/TagChip'
import ConfirmModal from '@/components/shared/ConfirmModal'
import toast from 'react-hot-toast'

/**
 * Thread detail page — shows question body, comments, and answer form.
 * Fetches from GET /api/v1/threads/:id and GET /api/v1/threads/:id/comments
 */
export default function ThreadDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [answerBody, setAnswerBody] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  // Fetch thread
  const { data: threadData, isLoading: threadLoading, error: threadError } = useQuery({
    queryKey: ['thread', id],
    queryFn: async () => {
      const res = await api.get(`/threads/${id}`)
      return res.data.thread
    },
  })

  // Fetch comments
  const { data: commentsData, isLoading: commentsLoading } = useQuery({
    queryKey: ['comments', id],
    queryFn: async () => {
      const res = await api.get(`/threads/${id}/comments`)
      return res.data.comments
    },
    enabled: !!id,
  })

  const comments = commentsData || []

  // Fetch user's votes for the thread (targetType=Thread)
  const { data: threadVotesData } = useQuery({
    queryKey: ['userVotes', 'thread', id],
    queryFn: async () => {
      const res = await api.get(`/votes/user-votes?targetIds=${id}&targetType=Thread`)
      return res.data.votes
    },
    enabled: !!id && !!user,
  })

  // Fetch user's votes for all comments (targetType=Comment)
  const commentIds = comments.map((c) => c._id).join(',')
  const { data: commentVotesData } = useQuery({
    queryKey: ['userVotes', 'comment', id],
    queryFn: async () => {
      const res = await api.get(`/votes/user-votes?targetIds=${commentIds}&targetType=Comment`)
      return res.data.votes
    },
    enabled: !!commentIds && !!user,
  })

  // Vote on a comment — OPTIMISTIC UPDATE
  const voteComment = useMutation({
    mutationFn: async ({ targetId, value }) => {
      await api.post('/votes', { targetId, targetType: 'Comment', value })
    },
    onMutate: async ({ targetId, value }) => {
      // Cancel outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ['comments', id] })
      await queryClient.cancelQueries({ queryKey: ['userVotes', 'comment', id] })

      // Save snapshots for rollback
      const previousComments = queryClient.getQueryData(['comments', id])
      const previousVotes = queryClient.getQueryData(['userVotes', 'comment', id])

      // Optimistically update the comment's voteCount
      queryClient.setQueryData(['comments', id], (old) => {
        if (!old) return old
        const prevVote = previousVotes?.[targetId] ?? null
        const delta = calculateVoteDelta(prevVote, value)
        return old.map((c) =>
          c._id === targetId ? { ...c, voteCount: (c.voteCount || 0) + delta } : c,
        )
      })

      // Optimistically update the user's vote state
      queryClient.setQueryData(['userVotes', 'comment', id], (old) => {
        if (!old) return { [targetId]: value }
        const prev = old[targetId]
        // If same vote again, retract. Otherwise, set new value.
        return { ...old, [targetId]: prev === value ? null : value }
      })

      return { previousComments, previousVotes }
    },
    onError: (err, vars, context) => {
      // Roll back on error
      if (context?.previousComments) {
        queryClient.setQueryData(['comments', id], context.previousComments)
      }
      if (context?.previousVotes) {
        queryClient.setQueryData(['userVotes', 'comment', id], context.previousVotes)
      }
      toast.error(err.response?.data?.message || 'Failed to vote')
    },
    onSettled: () => {
      // Always refetch to sync with server truth
      queryClient.invalidateQueries({ queryKey: ['comments', id] })
      queryClient.invalidateQueries({ queryKey: ['userVotes', 'comment', id] })
    },
  })

  // Accept answer mutation
  const acceptAnswer = useMutation({
    mutationFn: async (commentId) => {
      const res = await api.patch(`/threads/${id}/accept/${commentId}`)
      return res.data
    },
    onSuccess: (data) => {
      toast.success(data.action === 'accepted' ? 'Answer accepted!' : 'Answer unaccepted')
      // Invalidate both thread (for acceptedComment field) and comments (for badge rendering)
      queryClient.invalidateQueries({ queryKey: ['thread', id] })
      queryClient.invalidateQueries({ queryKey: ['comments', id] })
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to accept answer')
    },
  })

  // Post answer mutation
  const postAnswer = useMutation({
    mutationFn: async (body) => {
      const res = await api.post(`/threads/${id}/comments`, { body })
      return res.data.comment
    },
    onSuccess: () => {
      toast.success('Answer posted!')
      setAnswerBody('')
      queryClient.invalidateQueries({ queryKey: ['comments', id] })
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to post answer')
    },
  })

  // Delete thread mutation
  const deleteThread = useMutation({
    mutationFn: async () => {
      await api.delete(`/threads/${id}`)
    },
    onSuccess: () => {
      toast.success('Thread deleted')
      navigate('/')
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to delete thread')
    },
  })

  // Vote on thread — OPTIMISTIC UPDATE
  const voteThread = useMutation({
    mutationFn: async ({ value }) => {
      await api.post('/votes', { targetId: id, targetType: 'Thread', value })
    },
    onMutate: async ({ value }) => {
      // Cancel outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ['thread', id] })
      await queryClient.cancelQueries({ queryKey: ['userVotes', 'thread', id] })

      // Save snapshots for rollback
      const previousThread = queryClient.getQueryData(['thread', id])
      const previousVotes = queryClient.getQueryData(['userVotes', 'thread', id])

      // Optimistically update the thread's voteCount
      queryClient.setQueryData(['thread', id], (old) => {
        if (!old) return old
        const prevVote = previousVotes?.[id] ?? null
        const delta = calculateVoteDelta(prevVote, value)
        return { ...old, voteCount: (old.voteCount || 0) + delta }
      })

      // Optimistically update the user's vote state
      queryClient.setQueryData(['userVotes', 'thread', id], (old) => {
        if (!old) return { [id]: value }
        const prev = old[id]
        // If same vote again, retract. Otherwise, set new value.
        return { ...old, [id]: prev === value ? null : value }
      })

      return { previousThread, previousVotes }
    },
    onError: (err, vars, context) => {
      // Roll back on error
      if (context?.previousThread) {
        queryClient.setQueryData(['thread', id], context.previousThread)
      }
      if (context?.previousVotes) {
        queryClient.setQueryData(['userVotes', 'thread', id], context.previousVotes)
      }
      toast.error(err.response?.data?.message || 'Failed to vote')
    },
    onSettled: () => {
      // Always refetch to sync with server truth
      queryClient.invalidateQueries({ queryKey: ['thread', id] })
      queryClient.invalidateQueries({ queryKey: ['userVotes', 'thread', id] })
    },
  })

  // Loading state
  if (threadLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    )
  }

  // Error state
  if (threadError) {
    return (
      <div className="rounded-xl border border-error/20 bg-error-light p-8 text-center">
        <p className="text-lg font-semibold text-error">Thread not found</p>
        <p className="mt-1 text-sm text-text-secondary">
          The question you're looking for doesn't exist or has been removed.
        </p>
      </div>
    )
  }

  const thread = threadData
  const isOwner = user && thread?.author?._id === user.id
  const threadVote = threadVotesData?.[id] ?? null

  return (
    <div>
      {/* Thread header */}
      <h1 className="text-xl sm:text-2xl font-bold text-text-primary">{thread?.title}</h1>

      {/* Meta info */}
      <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-text-muted">
        <span className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          Asked {timeAgo(thread?.createdAt)}
        </span>
      </div>

      {/* Thread body */}
      <div className="mt-6 flex gap-3 sm:gap-4">
        {/* Vote widget */}
        <VoteButtons
          count={thread?.voteCount || 0}
          userVote={threadVote}
          onUpvote={() => user && !isOwner && voteThread.mutate({ value: 1 })}
          onDownvote={() => user && !isOwner && voteThread.mutate({ value: -1 })}
          disabled={isOwner}
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="whitespace-pre-wrap text-sm text-text-secondary leading-relaxed">
            {thread?.body}
          </div>

          {/* Tags */}
          {thread?.tags && thread.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {thread.tags.map((tag) => (
                <TagChip key={tag} tag={tag} />
              ))}
            </div>
          )}

          {/* Author card + actions */}
          <div className="mt-4 flex items-center justify-between">
            {isOwner && (
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-text-muted hover:bg-neutral hover:text-secondary transition-colors">
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </button>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-text-muted hover:bg-error-light hover:text-error transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </div>
            )}

            <div className="flex items-center gap-2 rounded-lg bg-neutral p-3 text-sm ml-auto">
              <div className="text-right">
                <Link
                  to={`/u/${thread?.author?.username}`}
                  className="font-medium text-secondary hover:underline"
                >
                  {thread?.author?.username}
                </Link>
              </div>
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-semibold">
                {thread?.author?.username?.[0]?.toUpperCase() || '?'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <hr className="my-8 border-border" />

      {/* Answers section */}
      <h2 className="text-lg font-bold text-text-primary">
        {comments.length} {comments.length === 1 ? 'Answer' : 'Answers'}
      </h2>

      {/* Loading comments */}
      {commentsLoading && (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      )}

      {/* Comments list */}
      {!commentsLoading && (
        <div className="mt-4 space-y-4">
          {comments.map((comment) => (
            <div key={comment._id} className={`rounded-xl border bg-surface p-4 sm:p-5 transition-colors ${
              thread?.acceptedComment === comment._id
                ? 'border-success/30 bg-success-light/30'
                : 'border-border'
            }`}>
            <div className="flex gap-3 sm:gap-4">
              <VoteButtons
                count={comment.voteCount || 0}
                userVote={commentVotesData?.[comment._id] ?? null}
                onUpvote={() => user && comment.author?._id !== user.id && voteComment.mutate({ targetId: comment._id, value: 1 })}
                onDownvote={() => user && comment.author?._id !== user.id && voteComment.mutate({ targetId: comment._id, value: -1 })}
                disabled={user && comment.author?._id === user.id}
                className="mt-1"
              />
              <div className="flex-1 min-w-0">
                <div className="whitespace-pre-wrap text-sm text-text-secondary leading-relaxed">
                  {comment.body}
                </div>

                {/* Accepted answer badge */}
                {thread?.acceptedComment === comment._id && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-success">
                    <CheckCircle2 className="h-4 w-4" />
                    Accepted Answer
                  </div>
                )}

                <div className="mt-3 flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-tertiary flex items-center justify-center text-white text-[10px] font-semibold shrink-0">
                    {comment.author?.username?.[0]?.toUpperCase() || '?'}
                  </div>
                  <Link
                    to={`/u/${comment.author?.username}`}
                    className="text-xs font-medium text-secondary hover:underline"
                  >
                    {comment.author?.username}
                  </Link>
                  <span className="text-xs text-text-muted">·</span>
                  <span className="text-xs text-text-muted">{timeAgo(comment.createdAt)}</span>

                  {/* Accept answer button — only for thread owner */}
                  {isOwner && (
                    <button
                      onClick={() => acceptAnswer.mutate(comment._id)}
                      disabled={acceptAnswer.isPending}
                      className={`ml-auto flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                        thread?.acceptedComment === comment._id
                          ? 'bg-success-light text-success hover:bg-success hover:text-white'
                          : 'text-text-muted hover:bg-success-light hover:text-success'
                      }`}
                      title={thread?.acceptedComment === comment._id ? 'Unaccept answer' : 'Accept this answer'}
                    >
                      <Check className="h-3.5 w-3.5" />
                      {thread?.acceptedComment === comment._id ? 'Accepted' : 'Accept'}
                    </button>
                  )}
                </div>
              </div>
            </div>
            </div>
          ))}

          {comments.length === 0 && (
            <div className="py-8 text-center">
              <MessageSquare className="mx-auto h-10 w-10 text-text-muted/40" />
              <p className="mt-2 text-sm text-text-muted">
                No answers yet. Be the first to help!
              </p>
            </div>
          )}
        </div>
      )}

      {/* Answer form */}
      {user && (
        <>
          <hr className="my-8 border-border" />
          <h2 className="text-lg font-bold text-text-primary mb-4">Your Answer</h2>
          <div className="rounded-xl border border-border bg-surface p-4">
            <div className="flex gap-3">
              <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-white text-xs font-semibold shrink-0 mt-1">
                {user?.username?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="flex-1">
                <textarea
                  rows={6}
                  value={answerBody}
                  onChange={(e) => setAnswerBody(e.target.value)}
                  placeholder="Write your answer here..."
                  className="w-full rounded-lg border border-border bg-neutral px-3 py-2.5 text-sm text-text-primary
                    placeholder:text-text-muted focus:border-secondary focus:outline-none focus:ring-1 focus:ring-secondary
                    transition-colors resize-y"
                />
                <div className="mt-3 flex justify-end">
                  <button
                    onClick={() => postAnswer.mutate(answerBody)}
                    disabled={!answerBody.trim() || postAnswer.isPending}
                    className="flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-white hover:bg-secondary-hover
                      transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="h-4 w-4" />
                    {postAnswer.isPending ? 'Posting...' : 'Post Your Answer'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {!user && (
        <div className="mt-6 rounded-xl border border-border bg-neutral p-4 text-center">
          <p className="text-sm text-text-secondary">
            Please <a href="/login" className="font-medium text-secondary hover:underline">login</a> to post an answer.
          </p>
        </div>
      )}

      {/* Delete confirmation modal */}
      <ConfirmModal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={() => deleteThread.mutate()}
        title="Delete this question?"
        message="This action cannot be undone. All answers will also be removed."
        confirmText="Delete"
        danger
        loading={deleteThread.isPending}
      />
    </div>
  )
}
