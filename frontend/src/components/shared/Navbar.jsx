import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { Search, ChevronDown, LogOut, User, Settings, X } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const mobileSearchRef = useRef(null)
  const desktopSearchRef = useRef(null)

  // Focus mobile search input when opened
  useEffect(() => {
    if (mobileSearchOpen && mobileSearchRef.current) {
      mobileSearchRef.current.focus()
    }
  }, [mobileSearchOpen])

  // Keyboard shortcut "/" to focus search
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault()
        desktopSearchRef.current?.focus()
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [])

  const handleSearch = (e, isMobile = false) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
      if (isMobile) setMobileSearchOpen(false)
    }
  }

  const isHomeActive = location.pathname === '/' && !location.search.includes('author')
  const isMyQuestionsActive = location.pathname === '/' && location.search.includes('author')

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface shadow-sm">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 lg:px-6">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white font-bold text-sm shadow-sm group-hover:bg-primary-hover transition-colors">
            D
          </div>
          <span className="text-lg font-bold text-text-primary hidden sm:block tracking-tight">
            Debug<span className="text-primary">Den</span>
          </span>
        </Link>

        {/* Nav links — desktop */}
        <nav className="hidden md:flex items-center gap-1 ml-2">
          <NavLink
            to="/"
            className={cn(
              'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
              isHomeActive
                ? 'text-primary bg-primary-light'
                : 'text-text-secondary hover:text-text-primary hover:bg-neutral',
            )}
          >
            Home
          </NavLink>
          {isAuthenticated && user && (
            <NavLink
              to={`/?author=${user.id}`}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                isMyQuestionsActive
                  ? 'text-primary bg-primary-light'
                  : 'text-text-secondary hover:text-text-primary hover:bg-neutral',
              )}
            >
              My Questions
            </NavLink>
          )}
        </nav>

        {/* Search bar — desktop */}
        <form onSubmit={(e) => handleSearch(e)} className="relative mx-auto hidden flex-1 max-w-lg md:flex items-center">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted pointer-events-none" />
          <input
            ref={desktopSearchRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search questions, tags, users..."
            className="w-full rounded-lg border border-border bg-neutral py-2 pl-9 pr-12 text-sm
              text-text-primary placeholder:text-text-muted
              focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20
              transition-all"
          />
          {/* Keyboard shortcut hint */}
          <span className="absolute right-3 top-1/2 -translate-y-1/2 hidden lg:flex items-center justify-center rounded border border-border bg-surface px-1.5 py-0.5 text-[10px] font-medium text-text-muted pointer-events-none">
            /
          </span>
        </form>

        {/* Mobile search icon */}
        <button
          onClick={() => setMobileSearchOpen(true)}
          className="flex md:hidden items-center justify-center rounded-lg p-2 text-text-muted hover:bg-neutral hover:text-text-secondary transition-colors ml-auto"
          aria-label="Search"
        >
          <Search className="h-5 w-5" />
        </button>

        {/* Right side — auth */}
        <div className="flex items-center gap-2 shrink-0">
          {isAuthenticated ? (
            <>
              {/* Ask Question button — desktop */}
              <Link
                to="/ask"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white
                  hover:bg-primary-hover transition-colors hidden sm:block shadow-sm"
              >
                Ask Question
              </Link>

              {/* User menu */}
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-neutral transition-colors"
                >
                  <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-semibold overflow-hidden ring-2 ring-primary-light">
                    {user?.avatar?.url ? (
                      <img src={user.avatar.url} alt={user.username} className="h-full w-full object-cover" />
                    ) : (
                      user?.username?.[0]?.toUpperCase() || 'U'
                    )}
                  </div>
                  <ChevronDown className="hidden sm:block h-4 w-4 text-text-muted" />
                </button>

                {/* Dropdown menu */}
                {menuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setMenuOpen(false)}
                    />
                    <div className="absolute right-0 top-full z-50 mt-2 w-52 rounded-xl border border-border bg-surface py-1 shadow-lg">
                      <div className="px-4 py-3 border-b border-border">
                        <p className="text-sm font-semibold text-text-primary">{user?.username}</p>
                        <p className="text-xs text-text-muted truncate mt-0.5">{user?.email}</p>
                      </div>
                      <Link
                        to={`/u/${user?.username}`}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-text-secondary hover:bg-neutral hover:text-text-primary transition-colors"
                        onClick={() => setMenuOpen(false)}
                      >
                        <User className="h-4 w-4 text-text-muted" /> Profile
                      </Link>
                      <Link
                        to="/settings"
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-text-secondary hover:bg-neutral hover:text-text-primary transition-colors"
                        onClick={() => setMenuOpen(false)}
                      >
                        <Settings className="h-4 w-4 text-text-muted" /> Settings
                      </Link>
                      <div className="border-t border-border mt-1 pt-1">
                        <button
                          onClick={() => { setMenuOpen(false); logout() }}
                          className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-error hover:bg-error-light transition-colors"
                        >
                          <LogOut className="h-4 w-4" /> Logout
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-secondary hover:bg-neutral hover:text-text-primary transition-colors"
              >
                Log In
              </Link>
              <Link
                to="/register"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover transition-colors shadow-sm"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Mobile search overlay */}
      {mobileSearchOpen && (
        <div className="fixed inset-0 z-[100] bg-surface md:hidden">
          <div className="flex h-14 items-center gap-2 border-b border-border px-3">
            <form onSubmit={(e) => handleSearch(e, true)} className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input
                ref={mobileSearchRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search questions, tags, users..."
                className="w-full rounded-lg border border-border bg-neutral py-2 pl-9 pr-4 text-sm
                  text-text-primary placeholder:text-text-muted
                  focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20
                  transition-all"
              />
            </form>
            <button
              onClick={() => { setMobileSearchOpen(false); setSearchQuery('') }}
              className="rounded-lg p-2 text-text-muted hover:bg-neutral hover:text-text-secondary transition-colors"
              aria-label="Close search"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div
            className="h-full bg-black/20"
            onClick={() => { setMobileSearchOpen(false); setSearchQuery('') }}
          />
        </div>
      )}
    </header>
  )
}
