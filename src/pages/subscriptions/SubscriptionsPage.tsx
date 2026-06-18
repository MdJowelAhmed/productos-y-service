import { useState } from 'react'
import { XCircle } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Table, type Column } from '@/components/ui/Table'
import { Pagination } from '@/components/ui/Pagination'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/shared/Avatar'
import { SubscriptionStatusBadge, StoreTypeBadge } from '@/components/shared/StatusBadge'
import { SearchInput } from '@/components/shared/SearchInput'
import { TableToolbar } from '@/components/shared/TableToolbar'
import { SUBSCRIPTION_STATUS_OPTIONS } from '@/components/shared/filterOptions'
import { useListParams } from '@/hooks/useListParams'
import { useGetSubscriptionsQuery, useCancelSubscriptionMutation, useGetPlansQuery } from '@/services/endpoints/billingApi'
import { formatCurrency } from '@/lib/utils'
import { formatDate } from '@/lib/format'
import type { Subscription } from '@/types/models'
import type { Option } from '@/types/common.types'

export default function SubscriptionsPage() {
  const { search, setSearch, status, setStatus, page, setPage, params } = useListParams()
  const [plan, setPlan] = useState('all')
  const { data, isFetching } = useGetSubscriptionsQuery({ ...params, plan })
  const { data: plans } = useGetPlansQuery()
  const [cancel, { isLoading: canceling }] = useCancelSubscriptionMutation()

  const planOptions: Option[] = [
    { label: 'All plans', value: 'all' },
    ...(plans ?? []).map((p) => ({ label: p.name, value: p.name })),
  ]

  const columns: Column<Subscription>[] = [
    {
      key: 'store',
      header: 'Store (subscriber)',
      render: (s) => (
        <div className="flex items-center gap-3">
          <Avatar name={s.storeName} size="sm" />
          <div>
            <p className="font-medium text-ink-900">{s.storeName}</p>
            <p className="text-xs text-ink-500">Owner: {s.ownerName}</p>
          </div>
        </div>
      ),
    },
    { key: 'type', header: 'Type', render: (s) => <StoreTypeBadge type={s.storeType} /> },
    { key: 'plan', header: 'Plan', render: (s) => s.planName },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      render: (s) => (
        <span>
          {formatCurrency(s.amount)}
          <span className="text-ink-400">/{s.interval === 'monthly' ? 'mo' : 'yr'}</span>
        </span>
      ),
    },
    { key: 'renews', header: 'Renews', render: (s) => formatDate(s.currentPeriodEnd) },
    { key: 'status', header: 'Status', render: (s) => <SubscriptionStatusBadge status={s.status} /> },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (s) =>
        s.status === 'active' || s.status === 'trialing' ? (
          <Button size="sm" variant="outline" disabled={canceling} onClick={() => cancel(s.id)}>
            <XCircle className="h-3.5 w-3.5" /> Cancel
          </Button>
        ) : (
          <span className="text-xs text-ink-400">—</span>
        ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Subscriptions"
        description="Each subscription belongs to a store (the seller who opened it). Filter by plan or status to see who is subscribed."
      />

      <Card>
        <TableToolbar>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by store or owner…"
            className="w-full sm:max-w-xs"
          />
          <div className="flex w-full gap-2 sm:w-auto">
            <div className="w-full sm:w-44">
              <Select options={planOptions} value={plan} onChange={(e) => setPlan(e.target.value)} />
            </div>
            <div className="w-full sm:w-44">
              <Select
                options={SUBSCRIPTION_STATUS_OPTIONS}
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              />
            </div>
          </div>
        </TableToolbar>

        <Table
          columns={columns}
          rows={data?.items ?? []}
          rowKey={(s) => s.id}
          loading={isFetching}
          emptyTitle="No subscriptions found"
        />

        {data && (
          <Pagination page={page} pageSize={data.pageSize} total={data.total} onPageChange={setPage} />
        )}
      </Card>
    </div>
  )
}
