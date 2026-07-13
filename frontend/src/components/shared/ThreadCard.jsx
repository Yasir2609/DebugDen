import { Link, useNavigate } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import TagChip from '@/components/shared/TagChip'
import { timeAgo } from '@/lib/utils'

/**
 * Reusable thread card — displays vote count, answer count, title, body excerpt,
 * tags, author, and timestamp. Matches the reference screenshot layout:
 * [votes | answers] [title, excerpt, tags] [time • author]
 * Used on Home feed, Search results, and User Profile.
 */
export default function ThreadCard({ thread }) {
  const navigate = useNavigate()

  const hasAccepted = !!thread.acceptedComment
  const answerCount = thread.commentCount || 0
  const voteCount = thread.voteCount || 0

  return (
    <article className="flex gap-4 border-b border-border py-5 last:border-b-0 hover:bg-surface-hover/50 transition-colors px-1 rounded-sm">

      {/* Stats column */}
      <div className="flex shrink-0 flex-col items-center gap-3 text-center w-[52px]">
        {/* Votes */}
        <div>
          <div className="text-base font-semibold text-text-primary leading-none">{voteCount}</div>
          <div className="text-[11px] text-text-muted mt-0.5">votes</div>
        </div>

        {/* Answers */}
        <div>
          <div
            className={`rounded-md px-2 py-1 text-sm font-semibold leading-none ${
              hasAccepted
                ? 'bg-success text-white'
                : answerCount > 0
                  ? 'border border-primary/40 text-primary bg-primary-light'
                  : 'border border-border text-text-muted'
            }`}
          >
            {hasAccepted && <CheckCircle2 className="inline h-3 w-3 mr-0.5 -mt-0.5" />}
            {answerCount}
          </div>
          <div className="text-[11px] text-text-muted mt-1">
            {answerCount === 1 ? 'answer' : 'answers'}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Title */}
        <Link
          to={`/threads/${thread._id}`}
          className="text-base font-semibold text-primary hover:text-primary-hover hover:underline line-clamp-1 leading-snug transition-colors"
        >
          {thread.title}
        </Link>

        {/* Body excerpt */}
        <p className="mt-1 text-sm text-text-secondary line-clamp-2 leading-relaxed">
          {thread.body}
        </p>

        {/* Tags + meta row */}
        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-y-2 gap-x-3">
          {/* Tags */}
          <div className="flex flex-wrap gap-1.5">
            {thread.tags?.map((tag) => (
              <TagChip key={tag} tag={tag} />
            ))}
          </div>

          {/* Author + time — aligned right */}
          <div className="flex items-center gap-1.5 text-xs text-text-muted ml-auto shrink-0">
            <span>{timeAgo(thread.createdAt)}</span>
            <span>•</span>
            <div className="h-4 w-4 rounded-full bg-primary flex items-center justify-center text-white text-[9px] font-semibold overflow-hidden shrink-0">
              {thread.author?.avatar?.url ? (
                <img src={thread.author.avatar.url} alt={thread.author.username} className="h-full w-full object-cover" />
              ) : (
                thread.author?.username?.[0]?.toUpperCase() || '?'
              )}
            </div>
            <span
              onClick={(e) => {
                e.stopPropagation()
                navigate(`/u/${thread.author?.username}`)
              }}
              className="font-medium text-primary hover:underline cursor-pointer"
            >
              {thread.author?.username}
            </span>
          </div>
        </div>
      </div>
    </article>
  )
}
