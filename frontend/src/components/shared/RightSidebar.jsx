import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { MessageSquare, Users, FileText } from 'lucide-react'
import api from '@/lib/api'

/**
 * Right sidebar — shown on lg+ breakpoints alongside the main content area.
 * Contains: Ask Question CTA, Community Stats (live from API), Helpful links.
 */
export default function RightSidebar() {
  // Fetch community stats — long staleTime (10 min) to keep it lightweight
  const { data: statsData } = useQuery({
    queryKey: ['communityStats'],
    queryFn: async () => {
      const res = await api.get('/stats')
      return res.data.stats
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: false,
  })

  const stats = statsData || null

  return (
    <aside className="hidden lg:flex w-72 shrink-0 flex-col gap-4 sticky top-[3.75rem] h-fit">

      {/* Ask Question CTA */}
      <div className="rounded-xl border border-border bg-surface p-5">
        <h2 className="text-base font-semibold text-text-primary">Ask a Question</h2>
        <p className="mt-1 text-sm text-text-muted leading-relaxed">
          Share your knowledge, help others, and build your reputation.
        </p>
        <Link
          to="/ask"
          className="mt-4 flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2.5
            text-sm font-semibold text-white hover:bg-primary-hover transition-colors shadow-sm"
        >
          Ask Question
        </Link>

      </div>

      {/* Community Stats */}
      <div className="rounded-xl border border-border bg-surface p-5">
        <h2 className="text-base font-semibold text-text-primary mb-3">Community Stats</h2>
        <div className="space-y-2.5">
          <StatRow
            icon={FileText}
            label="Questions"
            value={stats?.questions}
          />
          <StatRow
            icon={MessageSquare}
            label="Answers"
            value={stats?.answers}
          />
          <StatRow
            icon={Users}
            label="Users"
            value={stats?.users}
          />
        </div>
      </div>

    </aside>
  )
}

/** Individual stat row inside the Community Stats card */
function StatRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm text-text-secondary">
        <Icon className="h-4 w-4 text-text-muted shrink-0" />
        {label}
      </div>
      <span className="text-sm font-semibold text-text-primary">
        {value != null
          ? value.toLocaleString()
          : <span className="inline-block h-4 w-12 rounded bg-neutral animate-pulse" />
        }
      </span>
    </div>
  )
}
