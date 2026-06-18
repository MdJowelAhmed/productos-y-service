import { useEffect, useState, type FormEvent } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Switch } from '@/components/ui/Switch'
import { Modal } from '@/components/ui/Modal'
import { LoadingState } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import {
  useGetFaqsQuery,
  useToggleFaqMutation,
  useCreateFaqMutation,
  useUpdateFaqMutation,
  useDeleteFaqMutation,
  type FaqInput,
} from '@/services/endpoints/cmsApi'
import type { Faq } from '@/types/models'

const emptyFaq: FaqInput = {
  question: '',
  answer: '',
  category: 'General',
  order: 99,
  isPublished: true,
}

export default function FaqsPage() {
  const { data: faqs, isLoading } = useGetFaqsQuery()
  const [toggleFaq] = useToggleFaqMutation()
  const [deleteFaq, { isLoading: deleting }] = useDeleteFaqMutation()

  const [editing, setEditing] = useState<Faq | null>(null)
  const [creating, setCreating] = useState(false)
  const [toDelete, setToDelete] = useState<Faq | null>(null)

  return (
    <div>
      <PageHeader
        title="FAQs"
        description="Help-center questions shown in the app."
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" /> New FAQ
          </Button>
        }
      />

      {isLoading || !faqs ? (
        <LoadingState />
      ) : faqs.length === 0 ? (
        <Card>
          <EmptyState
            title="No FAQs yet"
            description="Add your first help-center question."
            action={
              <Button onClick={() => setCreating(true)}>
                <Plus className="h-4 w-4" /> New FAQ
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {[...faqs]
            .sort((a, b) => a.order - b.order)
            .map((faq) => (
              <FaqRow
                key={faq.id}
                faq={faq}
                onToggle={(v) => toggleFaq({ id: faq.id, isPublished: v })}
                onEdit={() => setEditing(faq)}
                onDelete={() => setToDelete(faq)}
              />
            ))}
        </div>
      )}

      <FaqFormModal
        open={creating || Boolean(editing)}
        faq={editing}
        onClose={() => {
          setCreating(false)
          setEditing(null)
        }}
      />

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete this FAQ?"
        description={toDelete?.question}
        confirmLabel="Delete FAQ"
        tone="danger"
        loading={deleting}
        onConfirm={async () => {
          if (toDelete) await deleteFaq(toDelete.id)
          setToDelete(null)
        }}
        onClose={() => setToDelete(null)}
      />
    </div>
  )
}

function FaqRow({
  faq,
  onToggle,
  onEdit,
  onDelete,
}: {
  faq: Faq
  onToggle: (v: boolean) => void
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <Card>
      <CardBody className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-ink-900">{faq.question}</h3>
            <Badge tone="gray">{faq.category}</Badge>
          </div>
          <p className="mt-1.5 text-sm text-ink-500">{faq.answer}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Switch checked={faq.isPublished} onChange={onToggle} label={`Toggle ${faq.question}`} />
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

function FaqFormModal({ open, faq, onClose }: { open: boolean; faq: Faq | null; onClose: () => void }) {
  const [createFaq, { isLoading: creating }] = useCreateFaqMutation()
  const [updateFaq, { isLoading: updating }] = useUpdateFaqMutation()
  const [form, setForm] = useState<FaqInput>(emptyFaq)

  useEffect(() => {
    if (open) setForm({ ...(faq ?? emptyFaq) })
  }, [open, faq])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (faq) await updateFaq({ id: faq.id, ...form }).unwrap()
    else await createFaq(form).unwrap()
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={faq ? 'Edit FAQ' : 'New FAQ'}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={creating || updating}>
            Cancel
          </Button>
          <Button type="submit" form="faq-form" loading={creating || updating}>
            {faq ? 'Save changes' : 'Create FAQ'}
          </Button>
        </>
      }
    >
      <form id="faq-form" onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Question"
          value={form.question}
          onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))}
          required
        />
        <Textarea
          label="Answer"
          value={form.answer}
          onChange={(e) => setForm((f) => ({ ...f, answer: e.target.value }))}
          rows={4}
          required
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Category"
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
          />
          <Input
            label="Order"
            type="number"
            min={1}
            value={form.order}
            onChange={(e) => setForm((f) => ({ ...f, order: Number(e.target.value) }))}
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-ink-700">
          <Switch checked={form.isPublished} onChange={(v) => setForm((f) => ({ ...f, isPublished: v }))} label="Published" />
          Published
        </label>
      </form>
    </Modal>
  )
}
