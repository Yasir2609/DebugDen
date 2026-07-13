import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  danger = false,
  loading = false,
}) {
  const dialogRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  const handleBackdropClick = (e) => {
    if (e.target === dialogRef.current) onClose()
  }

  if (!open) return null

  return (
    <div
      ref={dialogRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <div className="w-full max-w-sm rounded-2xl bg-surface p-6 shadow-xl border border-border">
        {/* Header */}
        <div className="flex items-start justify-between">
          <h3 id="confirm-modal-title" className="text-lg font-semibold text-text-primary">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-text-muted hover:bg-neutral hover:text-text-secondary transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Message */}
        <p className="mt-2 text-sm text-text-secondary">{message}</p>

        {/* Actions */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-secondary
              hover:bg-neutral transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              'rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              danger
                ? 'bg-error hover:bg-error/90'
                : 'bg-primary hover:bg-primary-hover',
            )}
          >
            {loading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
