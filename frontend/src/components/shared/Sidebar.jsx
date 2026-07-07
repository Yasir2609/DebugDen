import { NavLink, useLocation } from 'react-router-dom'
import { Home, HelpCircle, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'

export default function Sidebar() {
  const { user } = useAuth()
  const location = useLocation()

  const searchParams = new URLSearchParams(location.search)
  const isHomeActive = location.pathname === '/' && !searchParams.has('author')
  const isMyQuestionsActive = location.pathname === '/' && searchParams.has('author')

  return (
    <aside className="hidden md:flex w-48 shrink-0 flex-col border-r border-border bg-surface py-4">
      <nav className="flex flex-col gap-1 px-2">
        <NavLink
          to="/"
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
            isHomeActive
              ? 'bg-secondary-light text-secondary'
              : 'text-text-secondary hover:bg-neutral hover:text-text-primary',
          )}
        >
          <Home className="h-5 w-5" />
          Home
        </NavLink>
        {user && (
          <NavLink
            to={`/?author=${user.id}`}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              isMyQuestionsActive
                ? 'bg-secondary-light text-secondary'
                : 'text-text-secondary hover:bg-neutral hover:text-text-primary',
            )}
          >
            <MessageSquare className="h-5 w-5" />
            My Questions
          </NavLink>
        )}
      </nav>

      {/* Bottom section */}
      <div className="mt-auto px-2">
        <a
          href="mailto:support@debugden.com"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-text-muted hover:bg-neutral hover:text-text-secondary transition-colors"
        >
          <HelpCircle className="h-5 w-5" />
          Help
        </a>
      </div>
    </aside>
  )
}
