import { cn } from '@/lib/utils'

export default function SkeletonCard({ className }) {
  return (
    <div
      className={cn(
        'flex gap-4 border-b border-border py-5 px-1',
        'animate-pulse',
        className,
      )}
    >
      {/* Stats column skeleton */}
      <div className="flex flex-col items-center gap-3 w-[52px] shrink-0">
        <div className="flex flex-col items-center gap-1">
          <div className="h-5 w-8 rounded bg-neutral" />
          <div className="h-3 w-7 rounded bg-neutral" />
        </div>
        <div className="flex flex-col items-center gap-1">
          <div className="h-7 w-10 rounded-md bg-neutral" />
          <div className="h-3 w-9 rounded bg-neutral" />
        </div>
      </div>

      {/* Content skeleton */}
      <div className="flex-1 space-y-2.5">
        <div className="h-5 w-3/4 rounded bg-neutral" />
        <div className="h-4 w-full rounded bg-neutral" />
        <div className="h-4 w-2/3 rounded bg-neutral" />

        {/* Tags + meta row */}
        <div className="flex items-center justify-between pt-0.5">
          <div className="flex gap-1.5">
            <div className="h-5 w-16 rounded-full bg-neutral" />
            <div className="h-5 w-20 rounded-full bg-neutral" />
            <div className="h-5 w-14 rounded-full bg-neutral" />
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-16 rounded bg-neutral" />
            <div className="h-4 w-4 rounded-full bg-neutral" />
            <div className="h-3 w-20 rounded bg-neutral" />
          </div>
        </div>
      </div>
    </div>
  )
}
