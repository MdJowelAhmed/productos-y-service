import { useState, type FormEvent } from 'react'
import { Megaphone, Plus, Send } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardBody } from '@/components/ui/Card'
import { Badge, type BadgeTone } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { RichTextEditor } from '@/components/ui/RichTextEditor'
import { Modal } from '@/components/ui/Modal'
import { LoadingState } from '@/components/ui/Spinner'
import {
  useGetAnnouncementsQuery,
  useCreateAnnouncementMutation,
} from '@/services/endpoints/engagementApi'
import { formatNumber, stripHtml } from '@/lib/utils'
import type { Announcement, AnnouncementAudience, AnnouncementStatus } from '@/types/models'
import type { Option } from '@/types/common.types'

const AUDIENCE_OPTIONS: Option<AnnouncementAudience>[] = [
  { label: 'Everyone', value: 'all' },
  { label: 'Buyers', value: 'buyers' },
  { label: 'All sellers', value: 'sellers' },
  { label: 'Product sellers', value: 'product_sellers' },
  { label: 'Service sellers', value: 'service_sellers' },
]

const CHANNEL_OPTIONS: Option<Announcement['channel']>[] = [
  { label: 'Push notification', value: 'push' },
  { label: 'Email', value: 'email' },
  { label: 'In-app', value: 'in_app' },
]

const statusTone: Record<AnnouncementStatus, BadgeTone> = {
  sent: 'green',
  scheduled: 'blue',
  draft: 'gray',
}

const audienceLabel: Record<AnnouncementAudience, string> = {
  all: 'Everyone',
  buyers: 'Buyers',
  sellers: 'All sellers',
  product_sellers: 'Product sellers',
  service_sellers: 'Service sellers',
}

export default function AnnouncementsPage() {
  const { data: announcements, isLoading } = useGetAnnouncementsQuery()
  const [createAnnouncement, { isLoading: sending }] = useCreateAnnouncementMutation()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    title: '',
    body: '',
    audience: 'all' as AnnouncementAudience,
    channel: 'push' as Announcement['channel'],
  })

  const handleSend = async (e: FormEvent) => {
    e.preventDefault()
    await createAnnouncement(form).unwrap()
    setOpen(false)
    setForm({ title: '', body: '', audience: 'all', channel: 'push' })
  }

  return (
    <div>
      <PageHeader
        title="Announcements"
        description="Broadcast push, email and in-app messages to your audience."
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> New announcement
          </Button>
        }
      />

      {isLoading || !announcements ? (
        <LoadingState />
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => (
            <Card key={a.id}>
              <CardBody className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                  <Megaphone className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-medium text-ink-900">{a.title}</h3>
                    <Badge tone={statusTone[a.status]}>{a.status}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-ink-500">{stripHtml(a.body)}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-ink-400">
                    <span>{audienceLabel[a.audience]}</span>
                    <span>· {a.channel}</span>
                    {a.status === 'sent' && <span>· {formatNumber(a.recipients)} recipients</span>}
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="New announcement"
        description="Compose and send a message to your selected audience."
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={sending}>
              Cancel
            </Button>
            <Button type="submit" form="announcement-form" loading={sending}>
              <Send className="h-4 w-4" /> Send now
            </Button>
          </>
        }
      >
        <form id="announcement-form" onSubmit={handleSend} className="space-y-4">
          <Input
            label="Title"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            required
          />
          <RichTextEditor
            label="Message"
            value={form.body}
            onChange={(body) => setForm((f) => ({ ...f, body }))}
            placeholder="Write your announcement…"
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Audience"
              options={AUDIENCE_OPTIONS}
              value={form.audience}
              onChange={(e) => setForm((f) => ({ ...f, audience: e.target.value as AnnouncementAudience }))}
            />
            <Select
              label="Channel"
              options={CHANNEL_OPTIONS}
              value={form.channel}
              onChange={(e) => setForm((f) => ({ ...f, channel: e.target.value as Announcement['channel'] }))}
            />
          </div>
        </form>
      </Modal>
    </div>
  )
}
