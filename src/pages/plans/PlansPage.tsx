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
import type { Plan } from '@/types/models'
import type { Option } from '@/types/common.types'

const DURATION_OPTIONS: Option[] = [
  { label: '7 Days (seven_days)', value: 'seven_days' },
  { label: '1 Month (one_month)', value: 'one_month' },
  { label: '3 Months (three_month)', value: 'three_month' },
  { label: '6 Months (six_month)', value: 'six_month' },
  { label: '1 Year (one_year)', value: 'one_year' },
]

const PACKAGE_TYPE_OPTIONS: Option[] = [
  { label: 'Store Creation (store_creation)', value: 'store_creation' },
  { label: 'Post Add (post_add)', value: 'post_add' },
]

const emptyPackage: PlanInput = {
  name: '',
  price: 29.99,
  duration: 'seven_days',
  packageType: 'store_creation',
  listingLimit: 100,
  isUnlimitedListings: false,
  trialEnabled: false,
  trialPeriodDays: 30,
  features: [],
  status: 'active',
  isActive: true,
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
        title="Subscription Packages"
        description="Manage seller subscription packages, listing limits, trial periods, and pricing tiers."
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" /> New package
          </Button>
        }
      />

      {isLoading || !plans ? (
        <LoadingState />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {plans.map((plan) => (
            <PackageCard
              key={plan.id}
              plan={plan}
              onToggle={(isActive) =>
                togglePlan({
                  id: plan.id,
                  isActive,
                  status: isActive ? 'active' : 'inactive',
                })
              }
              onEdit={() => setEditing(plan)}
              onDelete={() => setToDelete(plan)}
            />
          ))}
        </div>
      )}

      <PackageFormModal
        open={creating || Boolean(editing)}
        plan={editing}
        onClose={() => {
          setCreating(false)
          setEditing(null)
        }}
      />

      <ConfirmDialog
        open={Boolean(toDelete)}
        title={`Delete “${toDelete?.name}” package?`}
        description="Stores currently on this subscription package keep their access, but no new sellers can select it."
        confirmLabel="Delete package"
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

function PackageCard({
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
  const isActive = plan.status === 'active' || plan.isActive

  const durationLabels: Record<string, string> = {
    seven_days: '7 Days',
    one_month: '1 Month',
    three_month: '3 Months',
    six_month: '6 Months',
    one_year: '1 Year',
  }

  const durationText =
    durationLabels[plan.duration || ''] || plan.interval || plan.duration || 'period'

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
              <span className="text-3xl font-semibold text-ink-900">
                {formatCurrency(plan.price)}
              </span>
              <span className="text-sm text-ink-500">/{durationText}</span>
            </div>
          </div>
          <Switch checked={isActive} onChange={onToggle} label={`Toggle ${plan.name}`} />
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          <Badge tone={plan.packageType === 'store_creation' ? 'purple' : 'blue'}>
            {plan.packageType === 'store_creation' ? 'Store Creation' : 'Post Add'}
          </Badge>
          <Badge tone="gray">
            {plan.isUnlimitedListings || plan.listingLimit === null
              ? 'Unlimited listings'
              : `${plan.listingLimit} listings`}
          </Badge>
          {plan.trialEnabled && (
            <Badge tone="amber">{plan.trialPeriodDays ?? 0} Days Trial</Badge>
          )}
        </div>

        <ul className="mt-4 space-y-2 border-t border-ink-100 pt-4">
          {plan.features.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm text-ink-700">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
              {feature}
            </li>
          ))}
        </ul>

        <div className="mt-4 flex items-center justify-between border-t border-ink-100 pt-4">
          <span
            className={cn('text-xs font-medium', isActive ? 'text-brand-600' : 'text-ink-400')}
          >
            {isActive ? '● Active' : '○ Inactive'}
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={onEdit}>
              <Pencil className="h-3.5 w-3.5" /> Edit
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onDelete}
              className="text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  )
}

function PackageFormModal({
  open,
  plan,
  onClose,
}: {
  open: boolean
  plan: Plan | null
  onClose: () => void
}) {
  const [createPlan, { isLoading: creating }] = useCreatePlanMutation()
  const [updatePlan, { isLoading: updating }] = useUpdatePlanMutation()

  const [form, setForm] = useState<PlanInput>(emptyPackage)
  const [unlimited, setUnlimited] = useState(false)
  const [featuresText, setFeaturesText] = useState('')

  useEffect(() => {
    if (!open) return
    if (plan) {
      setForm({
        name: plan.name || '',
        price: plan.price ?? 0,
        duration: plan.duration || 'seven_days',
        packageType: plan.packageType || 'store_creation',
        listingLimit: plan.listingLimit ?? 100,
        isUnlimitedListings: Boolean(plan.isUnlimitedListings || plan.listingLimit === null),
        trialEnabled: Boolean(plan.trialEnabled),
        trialPeriodDays: plan.trialPeriodDays ?? 30,
        features: plan.features || [],
        status: plan.status || (plan.isActive ? 'active' : 'inactive'),
        isActive: plan.status === 'active' || plan.isActive,
      })
      setUnlimited(Boolean(plan.isUnlimitedListings || plan.listingLimit === null))
      setFeaturesText((plan.features || []).join('\n'))
    } else {
      setForm(emptyPackage)
      setUnlimited(false)
      setFeaturesText('')
    }
  }, [open, plan])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const payload: PlanInput = {
      name: form.name,
      price: Number(form.price),
      duration: form.duration || 'seven_days',
      packageType: form.packageType || 'store_creation',
      listingLimit: unlimited ? 0 : Number(form.listingLimit ?? 0),
      isUnlimitedListings: unlimited,
      trialEnabled: Boolean(form.trialEnabled),
      trialPeriodDays: form.trialEnabled ? Number(form.trialPeriodDays ?? 0) : 0,
      features: featuresText
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean),
      status: form.isActive ? 'active' : 'inactive',
      isActive: Boolean(form.isActive),
    }

    if (plan) {
      await updatePlan({ id: plan.id, ...payload }).unwrap()
    } else {
      await createPlan(payload).unwrap()
    }
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={plan ? `Edit Package · ${plan.name}` : 'New Subscription Package'}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={creating || updating}>
            Cancel
          </Button>
          <Button type="submit" form="package-form" loading={creating || updating}>
            {plan ? 'Save Changes' : 'Create Package'}
          </Button>
        </>
      }
    >
      <form id="package-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Package Name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Store Creation Premium"
            required
          />
          <Input
            label="Price ($)"
            type="number"
            step="0.01"
            min={0}
            value={form.price}
            onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))}
            required
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="Duration"
            options={DURATION_OPTIONS}
            value={form.duration}
            onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))}
          />
          <Select
            label="Package Type"
            options={PACKAGE_TYPE_OPTIONS}
            value={form.packageType}
            onChange={(e) => setForm((f) => ({ ...f, packageType: e.target.value }))}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 items-end">
          <Input
            label="Listing Limit"
            type="number"
            min={0}
            disabled={unlimited}
            value={unlimited ? '' : (form.listingLimit ?? 0)}
            onChange={(e) => setForm((f) => ({ ...f, listingLimit: Number(e.target.value) }))}
          />
          <div className="mb-2.5 flex items-center gap-2">
            <Switch checked={unlimited} onChange={setUnlimited} label="Unlimited Listings" />
            <span className="text-sm font-medium text-ink-700">Unlimited Listings</span>
          </div>
        </div>

        <div className="rounded-lg border border-ink-100 bg-ink-50 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-ink-900">Trial Period Settings</span>
            <Switch
              checked={Boolean(form.trialEnabled)}
              onChange={(val) => setForm((f) => ({ ...f, trialEnabled: val }))}
              label="Enable Trial"
            />
          </div>
          {form.trialEnabled && (
            <Input
              label="Trial Period (Days)"
              type="number"
              min={1}
              value={form.trialPeriodDays ?? 30}
              onChange={(e) =>
                setForm((f) => ({ ...f, trialPeriodDays: Number(e.target.value) }))
              }
              placeholder="30"
            />
          )}
        </div>

        <Textarea
          label="Features (one per line)"
          value={featuresText}
          onChange={(e) => setFeaturesText(e.target.value)}
          rows={4}
          placeholder={'Create store\nUp to 100 listings\nPremium store visibility\nPriority support'}
        />

        <div className="flex items-center justify-between border-t border-ink-100 pt-3">
          <label className="flex items-center gap-2 text-sm font-medium text-ink-700">
            <Switch
              checked={Boolean(form.isActive)}
              onChange={(v) => setForm((f) => ({ ...f, isActive: v, status: v ? 'active' : 'inactive' }))}
              label="Active Status"
            />
            Package Active Status ({form.isActive ? 'Active' : 'Inactive'})
          </label>
        </div>
      </form>
    </Modal>
  )
}
