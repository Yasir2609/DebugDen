import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'

export default function TagChip({ tag, onClick, className }) {
  const navigate = useNavigate()

  const handleClick = (e) => {
    if (onClick) {
      onClick(e)
    } else {
      e.stopPropagation()
      navigate(`/?tag=${encodeURIComponent(tag)}`)
    }
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        'bg-primary-light text-primary hover:bg-primary hover:text-white',
        'transition-colors cursor-pointer',
        className,
      )}
      onClick={handleClick}
    >
      {tag}
    </span>
  )
}
