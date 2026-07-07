import { Outlet } from 'react-router-dom'
import Navbar from '@/components/shared/Navbar'
import Sidebar from '@/components/shared/Sidebar'
import MobileNav from '@/components/shared/MobileNav'

export default function MainLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <div className="mx-auto max-w-5xl px-4 py-6 pb-20 md:pb-6">
            <Outlet />
          </div>
        </main>
      </div>
      {/* Mobile bottom nav — hidden on md+ */}
      <MobileNav />
    </div>
  )
}
