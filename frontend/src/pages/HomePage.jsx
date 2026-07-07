import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { MessageSquare } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import SkeletonCard from '@/components/ui/SkeletonCard'
import EmptyState from '@/components/ui/EmptyState'
import TagChip from '@/components/shared/TagChip'
import ThreadCard from '@/components/shared/ThreadCard'

/**
 * Home page — displays the thread feed with sorting and tag filtering.
 * Fetches threads from GET /api/v1/threads with cursor pagination.
 */
export default function HomePage() {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const tagFilter = searchParams.get('tag')
  const authorFilter = searchParams.get('author')
  const [sort, setSort] = useState('all')
  const [threads, setThreads] = useState([])
  const [nextCursor, setNextCursor] = useState(null)
  const [loadingMore, setLoadingMore] = useState(false)

  // Fetch threads from API
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['threads', sort, tagFilter, authorFilter],
    queryFn: async () => {
      const params = { sort, limit: 10 }
      if (tagFilter) params.tag = tagFilter
      if (authorFilter) params.author = authorFilter
      const res = await api.get('/threads', { params })
      return res.data
    },
  })

  // Reset cursor whenever sort or filters change so Load More uses the correct starting point
  useEffect(() => {
    setNextCursor(null)
  }, [sort, tagFilter, authorFilter])

  // Update local state when data changes
  useEffect(() => {
    if (data) {
      setThreads(data.threads || [])
      setNextCursor(data.nextCursor || null)
    }
  }, [data])

  // Load more threads (cursor pagination)
  const loadMore = async () => {
    if (!nextCursor || loadingMore) return
    setLoadingMore(true)
    try {
      const params = { sort, limit: 10, cursor: nextCursor }
      if (tagFilter) params.tag = tagFilter
      if (authorFilter) params.author = authorFilter
      const res = await api.get('/threads', { params })
      setThreads((prev) => {
        const existingIds = new Set(prev.map((t) => t._id))
        const newThreads = (res.data.threads || []).filter((t) => !existingIds.has(t._id))
        return [...prev, ...newThreads]
      })
      setNextCursor(res.data.nextCursor || null)
    } catch {
      // Silently fail — user can retry
    } finally {
      setLoadingMore(false)
    }
  }

  return (
    <div>
      {/* Page heading */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            {authorFilter ? 'My Questions' : (
              sort === 'newest' ? 'Newest Questions' :
              sort === 'unanswered' ? 'Unanswered Questions' :
              sort === 'votes' ? 'Most Voted Questions' :
              'All Questions'
            )}
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            {authorFilter ? (
              'Questions you have asked'
            ) : tagFilter ? (
              <>Filtered by tag: <TagChip tag={tagFilter} /></>
            ) : (
              'Browse questions from the DebugDen community'
            )}
          </p>
        </div>
        {user && (
          <Link
            to="/ask"
            className="rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-white
              hover:bg-secondary-hover transition-colors hidden sm:block"
          >
            Ask Question
          </Link>
        )}
      </div>

      {/* Sort tabs */}
      <div className="mb-4 flex gap-1 border-b border-border">
        {[
          { key: 'all', label: 'All' },
          { key: 'newest', label: 'Newest' },
          { key: 'unanswered', label: 'Unanswered' },
          { key: 'votes', label: 'Most Voted' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setSort(key)}
            className={`border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              sort === key
                ? 'border-secondary text-secondary'
                : 'border-transparent text-text-muted hover:text-text-secondary'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex flex-col gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="rounded-xl border border-error/20 bg-error-light p-4 text-center">
          <p className="text-sm text-error">Failed to load questions. Please try again.</p>
          <button
            onClick={() => refetch()}
            className="mt-2 text-sm font-medium text-secondary hover:underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && threads.length === 0 && (
        <EmptyState
          icon={MessageSquare}
          title="No questions yet"
          description="Be the first to ask a question!"
          action={
            user && (
              <Link
                to="/ask"
                className="rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-white hover:bg-secondary-hover transition-colors"
              >
                Ask a Question
              </Link>
            )
          }
        />
      )}

      {/* Thread list */}
      {!isLoading && !error && threads.length > 0 && (
        <div className="flex flex-col gap-3">
          {threads.map((thread) => (
            <ThreadCard key={thread._id} thread={thread} />
          ))}

          {/* Load more button */}
          {nextCursor && (
            <div className="flex justify-center py-4">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="rounded-lg border border-border px-6 py-2.5 text-sm font-medium text-text-secondary
                  hover:bg-neutral transition-colors disabled:opacity-50"
              >
                {loadingMore ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
