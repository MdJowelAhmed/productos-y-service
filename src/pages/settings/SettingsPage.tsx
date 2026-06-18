import { useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { Camera, Check, Lock, ShieldCheck, SlidersHorizontal, Trash2, UserCog } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Switch } from '@/components/ui/Switch'
import { Avatar } from '@/components/shared/Avatar'
import { useAuth } from '@/hooks/useAuth'
import { useAppDispatch } from '@/store/hooks'
import { updateProfile } from '@/components/auth/authSlice'
import { useChangePasswordMutation } from '@/services/endpoints/authApi'

const MAX_AVATAR_BYTES = 2 * 1024 * 1024 // 2 MB

export default function SettingsPage() {
  const { user } = useAuth()
  const dispatch = useAppDispatch()
  const fileRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState(user?.name ?? '')
  const [avatar, setAvatar] = useState<string | undefined>(user?.avatarUrl)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const [autoApprove, setAutoApprove] = useState(false)
  const [requireSubscription, setRequireSubscription] = useState(true)

  const handlePhoto = (e: ChangeEvent<HTMLInputElement>) => {
    setPhotoError(null)
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-selecting the same file
    if (!file) return
    if (!file.type.startsWith('image/')) return setPhotoError('Please choose an image file.')
    if (file.size > MAX_AVATAR_BYTES) return setPhotoError('Image must be under 2 MB.')
    const reader = new FileReader()
    reader.onload = () => setAvatar(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleSave = (e: FormEvent) => {
    e.preventDefault()
    dispatch(updateProfile({ name, avatarUrl: avatar ?? null }))
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div>
      <PageHeader title="Settings" description="Platform configuration and your admin profile." />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Profile */}
        <Card className="lg:col-span-2">
          <CardHeader
            title={
              <span className="flex items-center gap-2">
                <UserCog className="h-4 w-4 text-brand-600" /> Admin profile
              </span>
            }
            description="Your account information and photo."
          />
          <CardBody>
            <form onSubmit={handleSave} className="space-y-6">
              {/* Avatar */}
              <div className="flex flex-col items-center gap-4 rounded-xl bg-ink-50 p-5 sm:flex-row sm:items-center">
                <div className="group relative h-20 w-20 shrink-0">
                  <Avatar name={name || 'Admin'} src={avatar} size="lg" className="h-20 w-20 text-2xl" />
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="absolute inset-0 flex items-center justify-center rounded-full bg-ink-900/55 text-white opacity-0 transition group-hover:opacity-100"
                    aria-label="Change photo"
                  >
                    <Camera className="h-5 w-5" />
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" hidden onChange={handlePhoto} />
                </div>
                <div className="text-center sm:text-left">
                  <p className="text-sm font-medium text-ink-900">Profile photo</p>
                  <p className="mt-0.5 text-xs text-ink-500">PNG or JPG, up to 2 MB.</p>
                  <div className="mt-2 flex justify-center gap-2 sm:justify-start">
                    <Button type="button" size="sm" variant="outline" onClick={() => fileRef.current?.click()}>
                      <Camera className="h-3.5 w-3.5" /> Change
                    </Button>
                    {avatar && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => setAvatar(undefined)}
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Remove
                      </Button>
                    )}
                  </div>
                  {photoError && <p className="mt-1.5 text-xs text-red-600">{photoError}</p>}
                </div>
              </div>

              {/* Fields */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input label="Full name" value={name} onChange={(e) => setName(e.target.value)} />
                <Input
                  label="Email"
                  type="email"
                  value={user?.email ?? ''}
                  disabled
                  leftIcon={<Lock className="h-4 w-4" />}
                  hint="Super-admin email can’t be changed."
                />
              </div>

              <div className="flex items-center gap-3 border-t border-ink-100 pt-4">
                <Button type="submit">Save changes</Button>
                {saved && (
                  <span className="inline-flex items-center gap-1 text-sm text-brand-600">
                    <Check className="h-4 w-4" /> Saved
                  </span>
                )}
              </div>
            </form>
          </CardBody>
        </Card>

        {/* Marketplace rules */}
        <Card>
          <CardHeader
            title={
              <span className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-brand-600" /> Marketplace rules
              </span>
            }
            description="Control how stores are onboarded."
          />
          <CardBody className="space-y-5">
            <SettingToggle
              title="Auto-approve new stores"
              description="Skip manual review when a store is created."
              checked={autoApprove}
              onChange={setAutoApprove}
            />
            <div className="border-t border-ink-100" />
            <SettingToggle
              title="Require subscription to open a store"
              description="Sellers must hold an active plan before listing."
              checked={requireSubscription}
              onChange={setRequireSubscription}
            />
          </CardBody>
        </Card>

        {/* Change password */}
        <Card className="lg:col-span-3">
          <CardHeader
            title={
              <span className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-brand-600" /> Change password
              </span>
            }
            description="Update the password used to sign in."
          />
          <CardBody>
            <ChangePasswordForm />
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

function ChangePasswordForm() {
  const [changePassword, { isLoading }] = useChangePasswordMutation()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (newPassword.length < 6) return setError('New password must be at least 6 characters.')
    if (newPassword !== confirm) return setError('New password and confirmation don’t match.')

    try {
      await changePassword({ currentPassword, newPassword }).unwrap()
      setSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirm('')
    } catch (err) {
      setError((err as { data?: string })?.data ?? 'Could not change password.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700 ring-1 ring-red-600/20">{error}</div>
      )}
      {success && (
        <div className="inline-flex items-center gap-1.5 rounded-lg bg-brand-50 px-4 py-2.5 text-sm text-brand-700 ring-1 ring-brand-600/20">
          <Check className="h-4 w-4" /> Password updated successfully.
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Input
          label="Current password"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          leftIcon={<Lock className="h-4 w-4" />}
          required
        />
        <Input
          label="New password"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          leftIcon={<Lock className="h-4 w-4" />}
          required
        />
        <Input
          label="Confirm new password"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          leftIcon={<Lock className="h-4 w-4" />}
          required
        />
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" loading={isLoading}>
          Update password
        </Button>
        <span className="text-xs text-ink-400">Demo current password: admin123</span>
      </div>
    </form>
  )
}

function SettingToggle({
  title,
  description,
  checked,
  onChange,
}: {
  title: string
  description: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-ink-900">{title}</p>
        <p className="mt-0.5 text-xs text-ink-500">{description}</p>
      </div>
      <Switch checked={checked} onChange={onChange} label={title} />
    </div>
  )
}
