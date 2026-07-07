import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merges Tailwind CSS class names conditionally.
 * Combines clsx (conditional classes) with tailwind-merge (deduplication).
 * Usage: cn('base-class', isActive && 'active-class', className)
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
