import { Outlet, useLocation } from 'react-router-dom'
import Navbar from '@/components/shared/Navbar'
import RightSidebar from '@/components/shared/RightSidebar'
import MobileNav from '@/components/shared/MobileNav'

export default function MainLayout() {
  const location = useLocation()

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <div className="mx-auto w-full max-w-7xl flex-1 px-4 lg:px-6">
        <div className="flex gap-6 py-6">
          {/* Primary content with page transition */}
          <main className="flex-1 min-w-0 pb-20 md:pb-0">
            <div key={location.pathname} className="animate-page-enter">
              <Outlet />
            </div>
          </main>
          {/* Right sidebar — Ask CTA + Community Stats */}
          <RightSidebar />
        </div>
      </div>
      {/* Mobile bottom nav */}
      <MobileNav />
    </div>
  )
}
