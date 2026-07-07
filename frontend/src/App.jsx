import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import QueryProvider from '@/providers/QueryProvider'
import { AuthProvider } from '@/contexts/AuthContext'
import MainLayout from '@/components/layout/MainLayout'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import GuestRoute from '@/components/auth/GuestRoute'
import HomePage from '@/pages/HomePage'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import ThreadDetailPage from '@/pages/ThreadDetailPage'
import AskQuestionPage from '@/pages/AskQuestionPage'
import SearchPage from '@/pages/SearchPage'
import UserProfilePage from '@/pages/UserProfilePage'
import SettingsPage from '@/pages/SettingsPage'
import NotFoundPage from '@/pages/NotFoundPage'

export default function App() {
  return (
    <QueryProvider>
      <AuthProvider>
        <BrowserRouter>
          {/* Global toast notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                borderRadius: '12px',
                background: '#fff',
                color: '#1e293b',
                fontSize: '14px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              },
            }}
          />

          <Routes>
            {/* Auth pages — standalone layout, no navbar/sidebar */}
            <Route
              path="/login"
              element={
                <GuestRoute>
                  <LoginPage />
                </GuestRoute>
              }
            />
            <Route
              path="/register"
              element={
                <GuestRoute>
                  <RegisterPage />
                </GuestRoute>
              }
            />

            {/* Main app pages — navbar + sidebar layout */}
            <Route element={<MainLayout />}>
              {/* Public pages */}
              <Route path="/" element={<HomePage />} />
              <Route path="/threads/:id" element={<ThreadDetailPage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/u/:username" element={<UserProfilePage />} />

              {/* Protected pages */}
              <Route
                path="/ask"
                element={
                  <ProtectedRoute>
                    <AskQuestionPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <SettingsPage />
                  </ProtectedRoute>
                }
              />

              {/* 404 catch-all */}
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryProvider>
  )
}
