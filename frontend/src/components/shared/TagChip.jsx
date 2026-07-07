import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'

export default function TagChip({ tag, onClick, className }) {
  const navigate = useNavigate()

  const content = (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        'bg-tertiary-light text-secondary hover:bg-tertiary hover:text-white',
        'transition-colors cursor-pointer',
        className,
      )}
      onClick={onClick}
    >
      {tag}
    </span>
  )

  if (!onClick) {
    return (
      <span
        onClick={(e) => {
          e.stopPropagation()
          navigate(`/?tag=${encodeURIComponent(tag)}`)
        }}
      >
        {content}
      </span>
    )
  }

  return content
}
