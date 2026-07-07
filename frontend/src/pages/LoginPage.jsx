import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import AuthLayout from '@/components/layout/AuthLayout'
import FormError from '@/components/ui/FormError'
import Spinner from '@/components/ui/Spinner'
import toast from 'react-hot-toast'

/**
 * Login page — standalone auth form inside AuthLayout.
 * Calls authApi.login, redirects on success.
 */
export default function LoginPage() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

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
      {/* Logo + title */}
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-white font-bold text-lg">
          D
        </div>
        <h1 className="text-xl font-bold text-text-primary">
          Welcome back to Debug<span className="text-secondary">Den</span>
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
              placeholder:text-text-muted focus:border-secondary focus:outline-none focus:ring-1 focus:ring-secondary
              transition-colors"
          />
          <FormError message={errors.email} />
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-text-primary mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-text-primary
              placeholder:text-text-muted focus:border-secondary focus:outline-none focus:ring-1 focus:ring-secondary
              transition-colors"
          />
          <FormError message={errors.password} />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-secondary px-4 py-2.5 text-sm font-medium text-white
            hover:bg-secondary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading && <Spinner size="sm" className="text-white" />}
          {loading ? 'Signing in...' : 'Login'}
        </button>
      </form>

      {/* Register link */}
      <p className="mt-4 text-center text-sm text-text-secondary">
        Don&apos;t have an account?{' '}
        <Link to="/register" className="font-medium text-secondary hover:underline">
          Register
        </Link>
      </p>
    </AuthLayout>
  )
}
