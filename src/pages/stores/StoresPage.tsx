import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Ban, CheckCircle2, Eye } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Table, type Column } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { Pagination } from '@/components/ui/Pagination'
import { Select } from '@/components/ui/Select'
import { Tabs } from '@/components/ui/Tabs'
import { Avatar } from '@/components/shared/Avatar'
import { StatusBadge, StoreTypeBadge } from '@/components/shared/StatusBadge'
import { SearchInput } from '@/components/shared/SearchInput'
import { TableToolbar } from '@/components/shared/TableToolbar'
import { ENTITY_STATUS_OPTIONS, STORE_TYPE_TABS } from '@/components/shared/filterOptions'
import { useListParams } from '@/hooks/useListParams'
import { useGetStoresQuery, useUpdateStoreStatusMutation } from '@/services/endpoints/storesApi'
import { ROUTES } from '@/constants/routes'
import type { Store, StoreType } from '@/types/models'

export default function StoresPage() {
  const navigate = useNavigate()
  const { search, setSearch, status, setStatus, page, setPage, params } = useListParams()
  const [type, setType] = useState<StoreType | 'all'>('all')

  const { data, isFetching } = useGetStoresQuery({ ...params, type })
  const [updateStatus, { isLoading: updating }] = useUpdateStoreStatusMutation()

  const columns: Column<Store>[] = [
    {
      key: 'store',
      header: 'Store',
      render: (s) => (
        <div className="flex items-center gap-3">
          <Avatar name={s.name} src={s.logoUrl} size="sm" />
          <div>
            <p className="font-medium text-ink-900">{s.name}</p>
            <p className="text-xs text-ink-500">{s.ownerName}</p>
          </div>
        </div>
      ),
    },
    { key: 'type', header: 'Type', render: (s) => <StoreTypeBadge type={s.type} /> },
    { key: 'category', header: 'Category', render: (s) => s.category },
    { key: 'plan', header: 'Plan', render: (s) => s.planName ?? '—' },
    { key: 'listings', header: 'Listings', align: 'right', render: (s) => s.listingCount },
    {
      key: 'rating',
      header: 'Rating',
      align: 'right',
      render: (s) => (s.rating > 0 ? `★ ${s.rating}` : <span className="text-ink-300">New</span>),
    },
    { key: 'status', header: 'Status', render: (s) => <StatusBadge status={s.status} /> },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (s) => (
        <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
          <Button size="sm" variant="outline" onClick={() => navigate(ROUTES.storeDetail(s.id))}>
            <Eye className="h-3.5 w-3.5" /> View
          </Button>
          {s.status === 'pending' || s.status === 'under_review' ? (
            <Button size="sm" disabled={updating} onClick={() => updateStatus({ id: s.id, status: 'active' })}>
              <CheckCircle2 className="h-3.5 w-3.5" /> Approve
            </Button>
          ) : s.status === 'suspended' || s.status === 'rejected' ? (
            <Button size="sm" variant="outline" disabled={updating} onClick={() => updateStatus({ id: s.id, status: 'active' })}>
              <CheckCircle2 className="h-3.5 w-3.5" /> Reactivate
            </Button>
          ) : (
            <Button size="sm" variant="danger" disabled={updating} onClick={() => updateStatus({ id: s.id, status: 'suspended' })}>
              <Ban className="h-3.5 w-3.5" /> Suspend
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader title="Stores" description="Product and service stores on the platform." />

      <div className="mb-4">
        <Tabs
          value={type}
          onChange={(v) => {
            setType(v as StoreType | 'all')
            setPage(1)
          }}
          options={STORE_TYPE_TABS}
        />
      </div>

      <Card>
        <TableToolbar>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by store, owner or category…"
            className="w-full sm:max-w-xs"
          />
          <div className="w-full sm:w-44">
            <Select options={ENTITY_STATUS_OPTIONS} value={status} onChange={(e) => setStatus(e.target.value)} />
          </div>
        </TableToolbar>

        <Table
          columns={columns}
          rows={data?.items ?? []}
          rowKey={(s) => s.id}
          loading={isFetching}
          onRowClick={(s) => navigate(ROUTES.storeDetail(s.id))}
          emptyTitle="No stores found"
        />

        {data && (
          <Pagination page={page} pageSize={data.pageSize} total={data.total} onPageChange={setPage} />
        )}
      </Card>
    </div>
  )
}
