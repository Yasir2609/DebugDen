import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { MessageSquare } from 'lucide-react'
import { useInfiniteQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import SkeletonCard from '@/components/ui/SkeletonCard'
import EmptyState from '@/components/ui/EmptyState'
import TagChip from '@/components/shared/TagChip'
import ThreadCard from '@/components/shared/ThreadCard'

/**
 * Home page — displays the thread feed with sorting and tag filtering.
 * Uses useInfiniteQuery for cursor-based pagination so all loaded pages
 * stay in the React Query cache and survive navigation.
 */
export default function HomePage() {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const tagFilter = searchParams.get('tag')
  const authorFilter = searchParams.get('author')
  const [sort, setSort] = useState('all')

  const {
    data,
    isLoading,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['threads', sort, tagFilter, authorFilter],
    queryFn: async ({ pageParam }) => {
      const params = { sort, limit: 10 }
      if (pageParam) params.cursor = pageParam
      if (tagFilter) params.tag = tagFilter
      if (authorFilter) params.author = authorFilter
      const res = await api.get('/threads', { params })
      return res.data
    },
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? null,
  })

  // Flatten all pages into a single threads array
  const threads = data?.pages.flatMap((page) => page.threads) ?? []

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
          {hasNextPage && (
            <div className="flex justify-center py-4">
              <button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="rounded-lg border border-border px-6 py-2.5 text-sm font-medium text-text-secondary
                  hover:bg-neutral transition-colors disabled:opacity-50"
              >
                {isFetchingNextPage ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
