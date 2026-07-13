import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { X } from 'lucide-react'
import api from '@/lib/api'
import Spinner from '@/components/ui/Spinner'
import toast from 'react-hot-toast'

/**
 * Ask Question page — form to create a new thread.
 * POSTs to /api/v1/threads with title, body, tags.
 */
export default function AskQuestionPage() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState([])

  // Create thread mutation
  const createThread = useMutation({
    mutationFn: async (data) => {
      const res = await api.post('/threads', data)
      return res.data.thread
    },
    onSuccess: (thread) => {
      toast.success('Question posted!')
      navigate(`/threads/${thread._id}`)
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to post question')
    },
  })

  // Add tag (max 5)
  const addTag = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const tag = tagInput.trim().toLowerCase()
      if (tag && !tags.includes(tag) && tags.length < 5) {
        setTags((prev) => [...prev, tag])
        setTagInput('')
      }
    }
  }

  // Remove tag
  const removeTag = (tagToRemove) => {
    setTags((prev) => prev.filter((t) => t !== tagToRemove))
  }

  // Submit form
  const handleSubmit = (e) => {
    e.preventDefault()
    if (!title.trim() || !body.trim()) {
      toast.error('Please fill in both title and body')
      return
    }
    createThread.mutate({ title: title.trim(), body: body.trim(), tags })
  }

  return (
    <div className="max-w-3xl">
      {/* Page heading */}
      <h1 className="text-2xl font-bold text-text-primary">Ask a Question</h1>
      <p className="mt-1 text-sm text-text-secondary">
        Get help from the DebugDen community
      </p>

      {/* Form */}
      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-text-primary mb-1">
            Title
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., How to implement JWT refresh token rotation?"
            required
            className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-text-primary
              placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary
              transition-colors"
          />
          <p className="mt-1 text-xs text-text-muted">
            Be specific and imagine you're asking a question to another person.
          </p>
        </div>

        {/* Body */}
        <div>
          <label htmlFor="body" className="block text-sm font-medium text-text-primary mb-1">
            Body
          </label>
          <textarea
            id="body"
            rows={10}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Describe your problem in detail. Include what you've tried and what you expect."
            required
            className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-text-primary
              placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary
              transition-colors resize-y"
          />
          <p className="mt-1 text-xs text-text-muted">
            Include all the information someone would need to answer your question.
          </p>
        </div>

        {/* Tags */}
        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-text-primary mb-1">
            Tags <span className="text-text-muted font-normal">(up to 5, press Enter to add)</span>
          </label>
          <div className="flex flex-wrap gap-2 rounded-lg border border-border bg-surface px-3 py-2 min-h-[42px]">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-full bg-primary-light px-2.5 py-0.5 text-xs font-medium text-primary"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="rounded-full p-0.5 hover:bg-tertiary hover:text-white transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            {tags.length < 5 && (
              <input
                id="tags"
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={addTag}
                placeholder={tags.length === 0 ? 'e.g., javascript, jwt, authentication' : ''}
                className="flex-1 min-w-[120px] bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none"
              />
            )}
          </div>
          <p className="mt-1 text-xs text-text-muted">
            Add up to 5 tags to describe what your question is about.
          </p>
        </div>

        {/* Submit */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={createThread.isPending || !title.trim() || !body.trim()}
            className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white
              hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createThread.isPending && <Spinner size="sm" className="text-white" />}
            {createThread.isPending ? 'Posting...' : 'Post Question'}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-lg border border-border px-6 py-2.5 text-sm font-medium text-text-secondary
              hover:bg-neutral transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
