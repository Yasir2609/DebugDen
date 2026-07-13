import { cn } from '@/lib/utils'

export default function AuthLayout({ children, className }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      {/* Subtle background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary-light/40 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-tertiary-light/60 blur-3xl" />
      </div>

      <div
        className={cn(
          'relative w-full max-w-md rounded-2xl bg-surface p-8 shadow-xl border border-border',
          className,
        )}
      >
        {children}
      </div>
    </div>
  )
}
