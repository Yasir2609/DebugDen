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

/**
 * Format a date as a relative time string (e.g. "3m ago", "2d ago").
 */
export function timeAgo(date) {
  const seconds = Math.floor((Date.now() - new Date(date)) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return new Date(date).toLocaleDateString()
}

/**
 * Calculate the vote count delta for optimistic UI updates.
 * Mirrors the server's 3-case logic:
 *   A) new vote    → delta = +value
 *   B) retract     → delta = -value
 *   C) switch vote → delta = value * 2
 *
 * @param {number|null} prevVote - The user's current vote (1, -1, or null)
 * @param {number} newValue      - The new vote value (1 or -1)
 * @returns {number} The delta to apply to voteCount
 */
export function calculateVoteDelta(prevVote, newValue) {
  if (prevVote === null) return newValue           // Case A: new vote
  if (prevVote === newValue) return -newValue      // Case B: retract
  return newValue * 2                              // Case C: switch
}
