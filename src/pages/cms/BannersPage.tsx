import { useEffect, useState, type FormEvent } from 'react'
import { Image as ImageIcon, Pencil, Plus, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Switch } from '@/components/ui/Switch'
import { Modal } from '@/components/ui/Modal'
import { LoadingState } from '@/components/ui/Spinner'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import {
  useGetBannersQuery,
  useToggleBannerMutation,
  useCreateBannerMutation,
  useUpdateBannerMutation,
  useDeleteBannerMutation,
  type BannerInput,
} from '@/services/endpoints/cmsApi'
import { formatDate } from '@/lib/format'
import type { Banner, BannerPlacement } from '@/types/models'
import type { Option } from '@/types/common.types'

const placementLabel: Record<BannerPlacement, string> = {
  home_top: 'Home · Top',
  explore: 'Explore',
  product_store: 'Product Store',
  service_store: 'Service Store',
}

const PLACEMENT_OPTIONS: Option<BannerPlacement>[] = (
  Object.keys(placementLabel) as BannerPlacement[]
).map((value) => ({ value, label: placementLabel[value] }))

const toInputDate = (iso: string) => iso.slice(0, 10)
const fromInputDate = (d: string) => new Date(d).toISOString()

const emptyBanner: BannerInput = {
  title: '',
  placement: 'home_top',
  isActive: true,
  startsAt: new Date('2026-06-18T00:00:00Z').toISOString(),
  endsAt: new Date('2026-07-18T00:00:00Z').toISOString(),
}

export default function BannersPage() {
  const { data: banners, isLoading } = useGetBannersQuery()
  const [toggleBanner] = useToggleBannerMutation()
  const [deleteBanner, { isLoading: deleting }] = useDeleteBannerMutation()

  const [editing, setEditing] = useState<Banner | null>(null)
  const [creating, setCreating] = useState(false)
  const [toDelete, setToDelete] = useState<Banner | null>(null)

  return (
    <div>
      <PageHeader
        title="Banners"
        description="Promotional banners shown across the mobile app."
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" /> New banner
          </Button>
        }
      />

      {isLoading || !banners ? (
        <LoadingState />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {banners.map((banner) => (
            <BannerCard
              key={banner.id}
              banner={banner}
              onToggle={(v) => toggleBanner({ id: banner.id, isActive: v })}
              onEdit={() => setEditing(banner)}
              onDelete={() => setToDelete(banner)}
            />
          ))}
        </div>
      )}

      <BannerFormModal
        open={creating || Boolean(editing)}
        banner={editing}
        onClose={() => {
          setCreating(false)
          setEditing(null)
        }}
      />

      <ConfirmDialog
        open={Boolean(toDelete)}
        title={`Delete “${toDelete?.title}” banner?`}
        confirmLabel="Delete banner"
        tone="danger"
        loading={deleting}
        onConfirm={async () => {
          if (toDelete) await deleteBanner(toDelete.id)
          setToDelete(null)
        }}
        onClose={() => setToDelete(null)}
      />
    </div>
  )
}

import { imageUrl } from '@/components/shared/getImageUrl'

function BannerCard({
  banner,
  onToggle,
  onEdit,
  onDelete,
}: {
  banner: Banner
  onToggle: (v: boolean) => void
  onEdit: () => void
  onDelete: () => void
}) {
  const bannerSrc = imageUrl(banner.imageUrl)
  return (
    <Card className="overflow-hidden">
      <div className="flex h-32 items-center justify-center bg-gradient-to-br from-brand-500 to-brand-700 text-white">
        {bannerSrc ? (
          <img src={bannerSrc} alt={banner.title} className="h-full w-full object-cover" />
        ) : (
          <ImageIcon className="h-8 w-8 opacity-70" />
        )}
      </div>
      <CardBody>
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold text-ink-900">{banner.title}</h3>
            <Badge tone="blue" className="mt-1">
              {placementLabel[banner.placement]}
            </Badge>
          </div>
          <Switch checked={banner.isActive} onChange={onToggle} label={`Toggle ${banner.title}`} />
        </div>
        <p className="mt-3 text-xs text-ink-500">
          {formatDate(banner.startsAt)} → {formatDate(banner.endsAt)}
        </p>
        <div className="mt-3 flex justify-end gap-2 border-t border-ink-100 pt-3">
          <Button size="sm" variant="outline" onClick={onEdit}>
            <Pencil className="h-3.5 w-3.5" /> Edit
          </Button>
          <Button size="sm" variant="ghost" onClick={onDelete} className="text-red-600 hover:bg-red-50">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardBody>
    </Card>
  )
}

function BannerFormModal({ open, banner, onClose }: { open: boolean; banner: Banner | null; onClose: () => void }) {
  const [createBanner, { isLoading: creating }] = useCreateBannerMutation()
  const [updateBanner, { isLoading: updating }] = useUpdateBannerMutation()
  const [form, setForm] = useState<BannerInput>(emptyBanner)

  useEffect(() => {
    if (open) setForm({ ...(banner ?? emptyBanner) })
  }, [open, banner])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (banner) await updateBanner({ id: banner.id, ...form }).unwrap()
    else await createBanner(form).unwrap()
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={banner ? `Edit · ${banner.title}` : 'New banner'}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={creating || updating}>
            Cancel
          </Button>
          <Button type="submit" form="banner-form" loading={creating || updating}>
            {banner ? 'Save changes' : 'Create banner'}
          </Button>
        </>
      }
    >
      <form id="banner-form" onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Title"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          required
        />
        <Input
          label="Image URL (optional)"
          value={form.imageUrl ?? ''}
          onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value || undefined }))}
          placeholder="https://…"
        />
        <Select
          label="Placement"
          options={PLACEMENT_OPTIONS}
          value={form.placement}
          onChange={(e) => setForm((f) => ({ ...f, placement: e.target.value as BannerPlacement }))}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Starts"
            type="date"
            value={toInputDate(form.startsAt)}
            onChange={(e) => setForm((f) => ({ ...f, startsAt: fromInputDate(e.target.value) }))}
          />
          <Input
            label="Ends"
            type="date"
            value={toInputDate(form.endsAt)}
            onChange={(e) => setForm((f) => ({ ...f, endsAt: fromInputDate(e.target.value) }))}
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-ink-700">
          <Switch checked={form.isActive} onChange={(v) => setForm((f) => ({ ...f, isActive: v }))} label="Active" />
          Active
        </label>
      </form>
    </Modal>
  )
}
