import { useState, useRef } from 'react'
import { Camera, Save, Trash2 } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import Spinner from '@/components/ui/Spinner'
import toast from 'react-hot-toast'

/**
 * Settings page — edit avatar and bio.
 * Uses PATCH /api/v1/users/user to update profile.
 */
export default function SettingsPage() {
  const { user, updateUser } = useAuth()
  const queryClient = useQueryClient()
  const fileInputRef = useRef(null)

  const [bio, setBio] = useState(user?.bio || '')
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar?.url || '')
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarRemoved, setAvatarRemoved] = useState(false)

  // Handle avatar file selection
  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB')
      return
    }

    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
    setAvatarRemoved(false)
  }

  const handleRemoveAvatar = () => {
    setAvatarFile(null)
    setAvatarPreview('')
    setAvatarRemoved(true)
    // Reset file input so re-selecting the same file triggers onChange
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      let avatar = user?.avatar

      // Remove avatar
      if (avatarRemoved) {
        // Delete old image from Cloudinary if it had a publicId
        if (user?.avatar?.publicId) {
          try {
            await api.delete(`/uploads/${user.avatar.publicId}`)
          } catch (err) {
            console.error('Failed to delete old avatar from Cloudinary:', err)
          }
        }
        avatar = { url: '', publicId: '' }
      }

      // Upload new avatar if selected (overrides removal)
      if (avatarFile) {
        const formData = new FormData()
        formData.append('image', avatarFile)
        const uploadRes = await api.post('/uploads', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        avatar = { url: uploadRes.data.url, publicId: uploadRes.data.publicId }
      }

      // Update profile
      const res = await api.patch('/users/user', {
        bio: bio.trim(),
        avatar,
      })
      return res.data.user
    },
    onSuccess: (updatedUser) => {
      updateUser(updatedUser)
      queryClient.invalidateQueries({ queryKey: ['userProfile'] })
      queryClient.invalidateQueries({ queryKey: ['threads'] })
      queryClient.invalidateQueries({ queryKey: ['thread'] })
      queryClient.invalidateQueries({ queryKey: ['comments'] })
      setAvatarFile(null)
      setAvatarRemoved(false)
      toast.success('Settings saved!')
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to save settings')
    },
  })

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
      <p className="mt-1 text-sm text-text-secondary">
        Manage your account settings
      </p>

      <div className="mt-8 space-y-8">
        {/* Avatar section */}
        <div>
          <h2 className="text-sm font-semibold text-text-primary mb-3">Profile Picture</h2>
          <div className="flex items-center gap-4">
            {/* Avatar preview */}
            <div className="relative h-20 w-20 shrink-0 rounded-full bg-primary flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Avatar preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                user?.username?.[0]?.toUpperCase() || '?'
              )}
            </div>

            {/* Upload button */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-secondary
                    hover:bg-neutral transition-colors"
                >
                  <Camera className="h-4 w-4" />
                  Change Photo
                </button>
                {user?.avatar?.url && (
                  <button
                    onClick={handleRemoveAvatar}
                    className="flex items-center gap-2 rounded-lg border border-error/30 px-4 py-2 text-sm font-medium text-error
                      hover:bg-error-light transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove
                  </button>
                )}
              </div>
              <p className="text-xs text-text-muted">
                JPG, PNG or GIF. Max 5MB.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
          </div>
        </div>

        {/* Bio section */}
        <div>
          <h2 className="text-sm font-semibold text-text-primary mb-3">Bio</h2>
          <textarea
            rows={4}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Write a short bio about yourself..."
            maxLength={300}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-text-primary
              placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary
              transition-colors resize-y"
          />
          <p className="mt-1 text-xs text-text-muted">
            {bio.length}/300 characters
          </p>
        </div>

        {/* Account info (read-only) */}
        <div>
          <h2 className="text-sm font-semibold text-text-primary mb-3">Account Info</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">Username</label>
              <input
                type="text"
                value={user?.username || ''}
                readOnly
                className="w-full rounded-lg border border-border bg-neutral px-3 py-2.5 text-sm text-text-secondary cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">Email</label>
              <input
                type="email"
                value={user?.email || ''}
                readOnly
                className="w-full rounded-lg border border-border bg-neutral px-3 py-2.5 text-sm text-text-secondary cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end">
          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white
              hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saveMutation.isPending ? (
              <Spinner size="sm" className="text-white" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saveMutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
