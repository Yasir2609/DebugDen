import { Link } from 'react-router-dom'

/**
 * 404 page — catches all unmatched routes.
 * Shows a large "404" and a "Go Home" button.
 */
export default function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <h1 className="text-8xl font-bold text-primary">404</h1>
      <p className="mt-2 text-lg text-text-secondary">Page not found</p>
      <p className="mt-1 text-sm text-text-muted">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        to="/"
        className="mt-6 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-primary-hover transition-colors"
      >
        Go Home
      </Link>
    </div>
  )
}
