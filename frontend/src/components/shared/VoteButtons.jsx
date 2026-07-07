import { ArrowBigUp, ArrowBigDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function VoteButtons({ count = 0, userVote = null, onUpvote, onDownvote, className }) {
  const isUpvoted = userVote === 1
  const isDownvoted = userVote === -1

  return (
    <div className={cn('flex flex-col items-center gap-0.5', className)}>
      <button
        onClick={onUpvote}
        className={cn(
          'rounded-md p-1.5 transition-colors',
          isUpvoted
            ? 'bg-secondary-light text-secondary'
            : 'text-text-muted hover:bg-tertiary-light hover:text-secondary',
        )}
        aria-label="Upvote"
      >
        <ArrowBigUp className="h-6 w-6" />
      </button>
      <span className="text-sm font-bold text-text-primary min-w-[2ch] text-center">
        {count}
      </span>
      <button
        onClick={onDownvote}
        className={cn(
          'rounded-md p-1.5 transition-colors',
          isDownvoted
            ? 'bg-error-light text-error'
            : 'text-text-muted hover:bg-error-light hover:text-error',
        )}
        aria-label="Downvote"
      >
        <ArrowBigDown className="h-6 w-6" />
      </button>
    </div>
  )
}
