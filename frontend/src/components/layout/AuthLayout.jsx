import { cn } from '@/lib/utils'

export default function AuthLayout({ children, className }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral px-4">
      <div
        className={cn(
          'w-full max-w-md rounded-2xl bg-surface p-8 shadow-lg border border-border',
          className,
        )}
      >
        {children}
      </div>
    </div>
  )
}
