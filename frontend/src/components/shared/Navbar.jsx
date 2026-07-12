import { Link, useNavigate } from 'react-router-dom'
import { Search, ChevronDown, LogOut, User, Settings, X } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
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

  const handleSearch = (e, isMobile = false) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
      if (isMobile) setMobileSearchOpen(false)
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-2 px-3 sm:gap-4 sm:px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-white font-bold text-sm">
            D
          </div>
          <span className="text-lg font-bold text-text-primary hidden sm:block">
            Debug<span className="text-secondary">Den</span>
          </span>
        </Link>

        {/* Search bar — desktop */}
        <form onSubmit={(e) => handleSearch(e)} className="relative mx-4 hidden flex-1 max-w-xl md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            ref={desktopSearchRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search questions, tags, users..."
            className="w-full rounded-lg border border-border bg-neutral py-2 pl-9 pr-4 text-sm
              text-text-primary placeholder:text-text-muted
              focus:border-secondary focus:outline-none focus:ring-1 focus:ring-secondary
              transition-colors"
          />
        </form>

        {/* Mobile search icon */}
        <button
          onClick={() => setMobileSearchOpen(true)}
          className="flex md:hidden items-center justify-center rounded-lg p-2 text-text-muted hover:bg-neutral hover:text-text-secondary transition-colors"
          aria-label="Search"
        >
          <Search className="h-5 w-5" />
        </button>

        {/* Spacer */}
        <div className="flex-1 sm:flex-1" />

        {/* Right side — icons + auth */}
        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <>
              {/* Ask Question button — desktop */}
              <Link
                to="/ask"
                className="rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-white
                  hover:bg-secondary-hover transition-colors hidden sm:block"
              >
                Ask Question
              </Link>

              {/* User menu */}
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2 rounded-md p-1.5 hover:bg-neutral transition-colors"
                >
                  <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-semibold overflow-hidden">
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
                    <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-xl border border-border bg-surface py-1 shadow-lg">
                      <div className="px-3 py-2 border-b border-border">
                        <p className="text-sm font-medium text-text-primary">{user?.username}</p>
                        <p className="text-xs text-text-muted truncate">{user?.email}</p>
                      </div>
                      <Link
                        to={`/u/${user?.username}`}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:bg-neutral transition-colors"
                        onClick={() => setMenuOpen(false)}
                      >
                        <User className="h-4 w-4" /> Profile
                      </Link>
                      <Link
                        to="/settings"
                        className="flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:bg-neutral transition-colors"
                        onClick={() => setMenuOpen(false)}
                      >
                        <Settings className="h-4 w-4" /> Settings
                      </Link>
                      <button
                        onClick={() => { setMenuOpen(false); logout() }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-error hover:bg-error-light transition-colors"
                      >
                        <LogOut className="h-4 w-4" /> Logout
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-secondary hover:bg-neutral transition-colors"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-white hover:bg-secondary-hover transition-colors"
              >
                Register
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
                  focus:border-secondary focus:outline-none focus:ring-1 focus:ring-secondary
                  transition-colors"
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
          {/* Backdrop to close on tap outside */}
          <div
            className="h-full bg-black/20"
            onClick={() => { setMobileSearchOpen(false); setSearchQuery('') }}
          />
        </div>
      )}
    </header>
  )
}
