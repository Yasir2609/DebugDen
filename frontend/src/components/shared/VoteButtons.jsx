import { ArrowBigUp, ArrowBigDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function VoteButtons({ count = 0, userVote = null, onUpvote, onDownvote, disabled = false, className }) {
  const isUpvoted = userVote === 1
  const isDownvoted = userVote === -1

  return (
    <div className={cn('flex flex-col items-center gap-0.5', className)}>
      <button
        onClick={disabled ? undefined : onUpvote}
        disabled={disabled}
        className={cn(
          'rounded-md p-1.5 transition-colors',
          disabled
            ? 'text-text-muted/40 cursor-not-allowed'
            : isUpvoted
              ? 'bg-secondary-light text-secondary'
              : 'text-text-muted hover:bg-tertiary-light hover:text-secondary',
        )}
        aria-label="Upvote"
        title={disabled ? 'You cannot vote on your own content' : 'Upvote'}
      >
        <ArrowBigUp className="h-6 w-6" />
      </button>
      <span className="text-sm font-bold text-text-primary min-w-[2ch] text-center">
        {count}
      </span>
      <button
        onClick={disabled ? undefined : onDownvote}
        disabled={disabled}
        className={cn(
          'rounded-md p-1.5 transition-colors',
          disabled
            ? 'text-text-muted/40 cursor-not-allowed'
            : isDownvoted
              ? 'bg-error-light text-error'
              : 'text-text-muted hover:bg-error-light hover:text-error',
        )}
        aria-label="Downvote"
        title={disabled ? 'You cannot vote on your own content' : 'Downvote'}
      >
        <ArrowBigDown className="h-6 w-6" />
      </button>
    </div>
  )
}
