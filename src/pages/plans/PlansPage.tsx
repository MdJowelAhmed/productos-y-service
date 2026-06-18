import { useEffect, useState, type FormEvent } from 'react'
import { Check, Pencil, Plus, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { Switch } from '@/components/ui/Switch'
import { Modal } from '@/components/ui/Modal'
import { LoadingState } from '@/components/ui/Spinner'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import {
  useGetPlansQuery,
  useTogglePlanMutation,
  useCreatePlanMutation,
  useUpdatePlanMutation,
  useDeletePlanMutation,
  type PlanInput,
} from '@/services/endpoints/billingApi'
import { formatCurrency, cn } from '@/lib/utils'
import type { BillingInterval, Plan, StoreType } from '@/types/models'
import type { Option } from '@/types/common.types'

const APPLIES_OPTIONS: Option[] = [
  { label: 'Product & Service stores', value: 'both' },
  { label: 'Product stores only', value: 'product' },
  { label: 'Service stores only', value: 'service' },
]

const INTERVAL_OPTIONS: Option<BillingInterval>[] = [
  { label: 'Monthly', value: 'monthly' },
  { label: 'Yearly', value: 'yearly' },
]

const emptyPlan: PlanInput = {
  name: '',
  price: 0,
  currency: 'USD',
  interval: 'monthly',
  appliesTo: ['product', 'service'],
  listingLimit: 10,
  features: [],
  isActive: true,
  popular: false,
}

export default function PlansPage() {
  const { data: plans, isLoading } = useGetPlansQuery()
  const [togglePlan] = useTogglePlanMutation()
  const [deletePlan, { isLoading: deleting }] = useDeletePlanMutation()

  const [editing, setEditing] = useState<Plan | null>(null)
  const [creating, setCreating] = useState(false)
  const [toDelete, setToDelete] = useState<Plan | null>(null)

  return (
    <div>
      <PageHeader
        title="Subscription Plans"
        description="Plans sellers subscribe to in order to open a store."
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" /> New plan
          </Button>
        }
      />

      {isLoading || !plans ? (
        <LoadingState />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              onToggle={(isActive) => togglePlan({ id: plan.id, isActive })}
              onEdit={() => setEditing(plan)}
              onDelete={() => setToDelete(plan)}
            />
          ))}
        </div>
      )}

      <PlanFormModal
        open={creating || Boolean(editing)}
        plan={editing}
        onClose={() => {
          setCreating(false)
          setEditing(null)
        }}
      />

      <ConfirmDialog
        open={Boolean(toDelete)}
        title={`Delete “${toDelete?.name}” plan?`}
        description="Stores already on this plan keep their subscription, but no new stores can choose it."
        confirmLabel="Delete plan"
        tone="danger"
        loading={deleting}
        onConfirm={async () => {
          if (toDelete) await deletePlan(toDelete.id)
          setToDelete(null)
        }}
        onClose={() => setToDelete(null)}
      />
    </div>
  )
}

function PlanCard({
  plan,
  onToggle,
  onEdit,
  onDelete,
}: {
  plan: Plan
  onToggle: (isActive: boolean) => void
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <Card className={cn('relative', plan.popular && 'ring-2 ring-brand-600')}>
      {plan.popular && (
        <span className="absolute -top-2.5 left-5 rounded-full bg-brand-600 px-2.5 py-0.5 text-xs font-medium text-white">
          Most popular
        </span>
      )}
      <CardBody>
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-ink-900">{plan.name}</h3>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-3xl font-semibold text-ink-900">{formatCurrency(plan.price)}</span>
              <span className="text-sm text-ink-500">/{plan.interval === 'monthly' ? 'mo' : 'yr'}</span>
            </div>
          </div>
          <Switch checked={plan.isActive} onChange={onToggle} label={`Toggle ${plan.name}`} />
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {plan.appliesTo.map((t) => (
            <Badge key={t} tone={t === 'product' ? 'blue' : 'purple'}>
              {t}
            </Badge>
          ))}
          <Badge tone="gray">
            {plan.listingLimit === null ? 'Unlimited listings' : `${plan.listingLimit} listings`}
          </Badge>
        </div>

        <ul className="mt-4 space-y-2 border-t border-ink-100 pt-4">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-start gap-2 text-sm text-ink-700">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
              {feature}
            </li>
          ))}
        </ul>

        <div className="mt-4 flex items-center justify-between border-t border-ink-100 pt-4">
          <span className={cn('text-xs font-medium', plan.isActive ? 'text-brand-600' : 'text-ink-400')}>
            {plan.isActive ? '● Available to sellers' : '○ Hidden from sellers'}
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={onEdit}>
              <Pencil className="h-3.5 w-3.5" /> Edit
            </Button>
            <Button size="sm" variant="ghost" onClick={onDelete} className="text-red-600 hover:bg-red-50">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  )
}

function PlanFormModal({ open, plan, onClose }: { open: boolean; plan: Plan | null; onClose: () => void }) {
  const [createPlan, { isLoading: creating }] = useCreatePlanMutation()
  const [updatePlan, { isLoading: updating }] = useUpdatePlanMutation()

  const [form, setForm] = useState<PlanInput>(emptyPlan)
  const [unlimited, setUnlimited] = useState(false)
  const [featuresText, setFeaturesText] = useState('')

  useEffect(() => {
    if (!open) return
    const base = plan ?? emptyPlan
    setForm({ ...base })
    setUnlimited(base.listingLimit === null)
    setFeaturesText(base.features.join('\n'))
  }, [open, plan])

  const appliesValue =
    form.appliesTo.length === 2 ? 'both' : form.appliesTo[0] ?? 'both'

  const setApplies = (value: string) => {
    const next: StoreType[] = value === 'both' ? ['product', 'service'] : [value as StoreType]
    setForm((f) => ({ ...f, appliesTo: next }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const payload: PlanInput = {
      ...form,
      listingLimit: unlimited ? null : Number(form.listingLimit ?? 0),
      features: featuresText
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean),
    }
    if (plan) await updatePlan({ id: plan.id, ...payload }).unwrap()
    else await createPlan(payload).unwrap()
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={plan ? `Edit · ${plan.name}` : 'New subscription plan'}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={creating || updating}>
            Cancel
          </Button>
          <Button type="submit" form="plan-form" loading={creating || updating}>
            {plan ? 'Save changes' : 'Create plan'}
          </Button>
        </>
      }
    >
      <form id="plan-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Plan name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
          />
          <Input
            label="Price (USD)"
            type="number"
            min={0}
            value={form.price}
            onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))}
            required
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="Billing interval"
            options={INTERVAL_OPTIONS}
            value={form.interval}
            onChange={(e) => setForm((f) => ({ ...f, interval: e.target.value as BillingInterval }))}
          />
          <Select label="Applies to" options={APPLIES_OPTIONS} value={appliesValue} onChange={(e) => setApplies(e.target.value)} />
        </div>

        <div className="flex items-end gap-3">
          <Input
            label="Listing limit"
            type="number"
            min={1}
            disabled={unlimited}
            value={unlimited ? '' : (form.listingLimit ?? 0)}
            onChange={(e) => setForm((f) => ({ ...f, listingLimit: Number(e.target.value) }))}
            className="max-w-[180px]"
          />
          <label className="mb-2.5 flex items-center gap-2 text-sm text-ink-700">
            <Switch checked={unlimited} onChange={setUnlimited} label="Unlimited listings" />
            Unlimited
          </label>
        </div>

        <Textarea
          label="Features (one per line)"
          value={featuresText}
          onChange={(e) => setFeaturesText(e.target.value)}
          rows={5}
          placeholder={'Up to 50 listings\nFeatured in Explore\nPriority support'}
        />

        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 text-sm text-ink-700">
            <Switch checked={form.isActive} onChange={(v) => setForm((f) => ({ ...f, isActive: v }))} label="Active" />
            Available to sellers
          </label>
          <label className="flex items-center gap-2 text-sm text-ink-700">
            <Switch checked={Boolean(form.popular)} onChange={(v) => setForm((f) => ({ ...f, popular: v }))} label="Popular" />
            Mark as popular
          </label>
        </div>
      </form>
    </Modal>
  )
}
