import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Calendar, MessageSquare, FileText } from 'lucide-react'
import api from '@/lib/api'
import Spinner from '@/components/ui/Spinner'
import EmptyState from '@/components/ui/EmptyState'
import ThreadCard from '@/components/shared/ThreadCard'

/**
 * User profile page — displays user info, stats, and their threads.
 * Fetches from GET /api/v1/users/:username and GET /api/v1/users/:username/threads
 */
export default function UserProfilePage() {
  const { username } = useParams()

  // Fetch user profile
  const { data, isLoading, error } = useQuery({
    queryKey: ['userProfile', username],
    queryFn: async () => {
      const res = await api.get(`/users/${username}`)
      return res.data.user
    },
    enabled: !!username,
  })

  // Fetch user's threads
  const { data: threadsData, isLoading: threadsLoading } = useQuery({
    queryKey: ['userThreads', username],
    queryFn: async () => {
      const res = await api.get(`/users/${username}/threads`)
      return res.data.threads
    },
    enabled: !!username,
  })

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="User not found"
        description="This user doesn't exist or has been removed."
      />
    )
  }

  const user = data
  const threads = threadsData || []
  const memberSince = new Date(user.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="max-w-3xl">
      {/* Profile header */}
      <div className="rounded-xl border border-border bg-surface p-6">
        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div className="h-24 w-24 shrink-0 rounded-full bg-primary flex items-center justify-center text-white text-3xl font-bold ring-4 ring-surface">
            {user.avatar?.url ? (
              <img
                src={user.avatar.url}
                alt={user.username}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              user.username?.[0]?.toUpperCase() || '?'
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-text-primary">{user.username}</h1>
            </div>

            {/* Stats row */}
            <div className="mt-3 flex items-center gap-4 text-sm text-text-muted">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                Joined {memberSince}
              </span>
            </div>
          </div>
        </div>

        {/* Bio */}
        {user.bio && (
          <div className="mt-5">
            <h2 className="text-sm font-semibold text-text-primary mb-1">About</h2>
            <p className="text-sm text-text-secondary leading-relaxed">{user.bio}</p>
          </div>
        )}
        {!user.bio && (
          <div className="mt-5">
            <p className="text-sm text-text-muted italic">No bio yet.</p>
          </div>
        )}
      </div>

      {/* Stats cards */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-surface p-4 text-center">
          <FileText className="mx-auto h-5 w-5 text-primary" />
          <p className="mt-2 text-2xl font-bold text-text-primary">{user.threadCount || 0}</p>
          <p className="text-xs text-text-muted">Questions</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4 text-center">
          <MessageSquare className="mx-auto h-5 w-5 text-primary-light" />
          <p className="mt-2 text-2xl font-bold text-text-primary">{user.commentCount || 0}</p>
          <p className="text-xs text-text-muted">Answers</p>
        </div>
      </div>

      {/* User's threads */}
      <div className="mt-8">
        <h2 className="text-lg font-bold text-text-primary mb-4">Questions</h2>

        {threadsLoading && (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        )}

        {!threadsLoading && threads.length === 0 && (
          <EmptyState
            icon={FileText}
            title="No questions yet"
            description="This user hasn't asked any questions yet."
          />
        )}

        {!threadsLoading && threads.length > 0 && (
          <div className="flex flex-col gap-3">
            {threads.map((thread) => (
              <ThreadCard key={thread._id} thread={thread} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
