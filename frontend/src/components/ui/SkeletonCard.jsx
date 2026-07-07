import { cn } from '@/lib/utils'

export default function SkeletonCard({ className }) {
  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-surface p-4',
        'animate-pulse',
        className,
      )}
    >
      {/* Vote / answer / view stats skeleton */}
      <div className="flex gap-4">
        <div className="flex flex-col gap-2">
          <div className="h-5 w-10 rounded bg-neutral" />
          <div className="h-5 w-10 rounded bg-neutral" />
          <div className="h-5 w-10 rounded bg-neutral" />
        </div>

        {/* Content skeleton */}
        <div className="flex-1 space-y-3">
          <div className="h-5 w-3/4 rounded bg-neutral" />
          <div className="h-4 w-full rounded bg-neutral" />
          <div className="h-4 w-2/3 rounded bg-neutral" />

          {/* Tags skeleton */}
          <div className="flex gap-2 pt-1">
            <div className="h-6 w-16 rounded-full bg-neutral" />
            <div className="h-6 w-20 rounded-full bg-neutral" />
            <div className="h-6 w-14 rounded-full bg-neutral" />
          </div>

          {/* Author skeleton */}
          <div className="flex items-center gap-2 pt-1">
            <div className="h-6 w-6 rounded-full bg-neutral" />
            <div className="h-4 w-24 rounded bg-neutral" />
          </div>
        </div>
      </div>
    </div>
  )
}
