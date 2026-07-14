import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Eye, EyeOff, Lock } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import AuthLayout from '@/components/layout/AuthLayout'
import FormError from '@/components/ui/FormError'
import Spinner from '@/components/ui/Spinner'
import toast from 'react-hot-toast'

/**
 * Login page — standalone auth form inside AuthLayout.
 * Calls authApi.login, redirects on success.
 * Shows a banner if redirected from a protected page.
 */
export default function LoginPage() {
  const { login } = useAuth()
  const location = useLocation()
  const redirectedFrom = location.state?.from

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})
    setLoading(true)

    try {
      await login(email, password)
      toast.success('Welcome back!')
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed. Please try again.'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      {/* Redirect banner */}
      {redirectedFrom && (
        <div className="mb-4 flex items-center gap-2.5 rounded-lg border border-primary/20 bg-primary-light p-3 text-sm text-primary animate-page-enter">
          <Lock className="h-4 w-4 shrink-0" />
          <span>Please log in to access <span className="font-semibold">{redirectedFrom}</span></span>
        </div>
      )}

      {/* Logo + title */}
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white font-bold text-lg">
          D
        </div>
        <h1 className="text-xl font-bold text-text-primary">
          Welcome back to Debug<span className="text-primary">Den</span>
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Sign in to your account
        </p>
      </div>

      {/* Login form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-text-primary
              placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary
              transition-colors"
          />
          <FormError message={errors.email} />
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-text-primary mb-1">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 pr-10 text-sm text-text-primary
                placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary
                transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <FormError message={errors.password} />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white
            hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading && <Spinner size="sm" className="text-white" />}
          {loading ? 'Signing in...' : 'Login'}
        </button>
      </form>

      {/* Register link */}
      <p className="mt-4 text-center text-sm text-text-secondary">
        Don&apos;t have an account?{' '}
        <Link to="/register" className="font-medium text-primary hover:underline">
          Register
        </Link>
      </p>
    </AuthLayout>
  )
}
