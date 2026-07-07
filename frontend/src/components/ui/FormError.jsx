import { cn } from '@/lib/utils'

export default function FormError({ message, className }) {
  if (!message) return null

  return (
    <p className={cn('text-xs text-error mt-1', className)} role="alert">
      {message}
    </p>
  )
}
