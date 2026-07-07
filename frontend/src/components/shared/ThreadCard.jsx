import { Link, useNavigate } from 'react-router-dom'
import TagChip from '@/components/shared/TagChip'


/**
 * Reusable thread card — displays vote count, answer count, title, body excerpt,
 * tags, author, and timestamp. Used on Home feed and Search results.
 */
export default function ThreadCard({ thread }) {
  const navigate = useNavigate()
  const timeAgo = (date) => {
    const seconds = Math.floor((Date.now() - new Date(date)) / 1000)
    if (seconds < 60) return 'just now'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days < 30) return `${days}d ago`
    return new Date(date).toLocaleDateString()
  }

  return (
    <Link
      to={`/threads/${thread._id}`}
      className="flex gap-4 rounded-xl border border-border bg-surface p-4 hover:border-tertiary hover:shadow-sm transition-all"
    >
      {/* Stats column */}
      <div className="flex shrink-0 flex-col items-center gap-1.5 text-center min-w-[60px]">
        <div className="text-sm font-semibold text-text-primary">
          {thread.voteCount || 0}
        </div>
        <div className="text-xs text-text-muted">votes</div>
        <div
          className={`rounded border px-2 py-0.5 text-xs font-semibold ${
            (thread.commentCount || 0) > 0
              ? 'border-secondary bg-secondary-light text-secondary'
              : 'border-border text-text-muted'
          }`}
        >
          {thread.commentCount || 0}
        </div>
        <div className="text-xs text-text-muted">answers</div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h2 className="text-base font-semibold text-secondary hover:underline line-clamp-1">
          {thread.title}
        </h2>
        <p className="mt-1 text-sm text-text-secondary line-clamp-2">
          {thread.body}
        </p>

        {/* Tags */}
        {thread.tags && thread.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {thread.tags.map((tag) => (
              <TagChip key={tag} tag={tag} />
            ))}
          </div>
        )}

        {/* Author + timestamp */}
        <div className="mt-2 flex items-center gap-2 text-xs text-text-muted">
          <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center text-white text-[10px] font-semibold">
            {thread.author?.username?.[0]?.toUpperCase() || '?'}
          </div>
          <span
            onClick={(e) => {
              e.stopPropagation()
              navigate(`/u/${thread.author?.username}`)
            }}
            className="font-medium text-secondary hover:underline cursor-pointer"
          >
            {thread.author?.username}
          </span>

          <span>asked {timeAgo(thread.createdAt)}</span>
        </div>
      </div>
    </Link>
  )
}
