import { NavLink, useLocation } from 'react-router-dom'
import { Home, Search, PlusCircle, User, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'

/**
 * Fixed bottom navigation bar for mobile devices.
 * Replaces the sidebar on screens < md breakpoint.
 */
export default function MobileNav() {
  const { user, isAuthenticated } = useAuth()
  const location = useLocation()

  const navItems = [
    {
      to: '/',
      icon: Home,
      label: 'Home',
      active: location.pathname === '/' && !location.search.includes('author'),
    },
    {
      to: '/search',
      icon: Search,
      label: 'Search',
      active: location.pathname === '/search',
    },
    ...(isAuthenticated
      ? [
          {
            to: '/ask',
            icon: PlusCircle,
            label: 'Ask',
            active: false,
            primary: true,
          },
        ]
      : []),
    ...(isAuthenticated && user
      ? [
          {
            to: `/u/${user.username}`,
            icon: User,
            label: 'Profile',
            active: location.pathname.startsWith('/u/'),
          },
          {
            to: '/settings',
            icon: Settings,
            label: 'Settings',
            active: location.pathname === '/settings',
          },
        ]
      : []),
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-surface/95 backdrop-blur-md md:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="flex items-center justify-around px-2 py-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={cn(
              'flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-[10px] font-medium transition-colors min-w-[48px]',
              item.active ? 'text-secondary' : 'text-text-muted hover:text-text-secondary',
            )}
          >
            <item.icon
              className={cn(
                'h-5 w-5',
                item.primary && 'h-6 w-6',
              )}
            />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
