import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import api from '@/lib/api'
import Spinner from '@/components/ui/Spinner'
import EmptyState from '@/components/ui/EmptyState'
import ThreadCard from '@/components/shared/ThreadCard'

/**
 * Search results page — shows threads matching a search query.
 * Fetches from GET /api/v1/threads/search?q=
 */
export default function SearchPage() {
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q') || ''

  const { data, isLoading, error } = useQuery({
    queryKey: ['search', query],
    queryFn: async () => {
      const res = await api.get(`/threads/search?q=${encodeURIComponent(query)}`)
      return res.data
    },
    enabled: !!query.trim(),
  })

  if (!query.trim()) {
    return (
      <EmptyState
        icon={Search}
        title="Search DebugDen"
        description="Enter a search query to find questions, tags, and users."
      />
    )
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-error/20 bg-error-light p-8 text-center">
        <p className="text-lg font-semibold text-error">Search failed</p>
        <p className="mt-1 text-sm text-text-secondary">
          Please try again with a different query.
        </p>
      </div>
    )
  }

  const threads = data?.threads || []

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary">
        Results for &ldquo;{query}&rdquo;
      </h1>
      <p className="mt-1 text-sm text-text-secondary">
        {threads.length} {threads.length === 1 ? 'result' : 'results'} found
      </p>

      {threads.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No results found"
          description={`No questions match "${query}". Try different keywords.`}
        />
      ) : (
        <div className="mt-6 space-y-4">
          {threads.map((thread) => (
            <ThreadCard key={thread._id} thread={thread} />
          ))}
        </div>
      )}
    </div>
  )
}
