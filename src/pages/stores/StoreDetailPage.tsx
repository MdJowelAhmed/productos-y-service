import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Ban, CheckCircle2, Star } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Table, type Column } from '@/components/ui/Table'
import { LoadingState } from '@/components/ui/Spinner'
import { Avatar } from '@/components/shared/Avatar'
import { StatusBadge, StoreTypeBadge } from '@/components/shared/StatusBadge'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { useGetStoreQuery, useUpdateStoreStatusMutation } from '@/services/endpoints/storesApi'
import {
  useGetStoreProductsQuery,
  useGetStoreServicesQuery,
} from '@/services/endpoints/catalogApi'
import { formatCurrency } from '@/lib/utils'
import { formatDate } from '@/lib/format'
import type { Product, Service } from '@/types/models'

export default function StoreDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { data: store, isLoading } = useGetStoreQuery(id)
  const [updateStatus, { isLoading: updating }] = useUpdateStoreStatusMutation()
  const [confirmSuspend, setConfirmSuspend] = useState(false)

  // Fetch the vendor's listings; the irrelevant query is skipped by store type.
  const isProductStore = store?.type === 'product'
  const { data: products, isFetching: loadingProducts } = useGetStoreProductsQuery(id, {
    skip: !store || !isProductStore,
  })
  const { data: services, isFetching: loadingServices } = useGetStoreServicesQuery(id, {
    skip: !store || isProductStore,
  })

  if (isLoading || !store) return <LoadingState />

  const isSuspended = store.status === 'suspended'
  const isPending = store.status === 'pending'

  const setStatus = async (status: 'active' | 'suspended') => {
    await updateStatus({ id: store.id, status })
    setConfirmSuspend(false)
  }

  const productColumns: Column<Product>[] = [
    { key: 'title', header: 'Product', render: (p) => <span className="font-medium text-ink-900">{p.title}</span> },
    { key: 'category', header: 'Category', render: (p) => <Badge tone="blue">{p.category}</Badge> },
    { key: 'price', header: 'Price', align: 'right', render: (p) => formatCurrency(p.price, p.currency) },
    {
      key: 'stock',
      header: 'Stock',
      align: 'right',
      render: (p) => <span className={p.stock === 0 ? 'text-red-600' : 'text-ink-700'}>{p.stock}</span>,
    },
    { key: 'status', header: 'Status', render: (p) => <StatusBadge status={p.status} /> },
  ]

  const serviceColumns: Column<Service>[] = [
    { key: 'title', header: 'Service', render: (s) => <span className="font-medium text-ink-900">{s.title}</span> },
    { key: 'category', header: 'Category', render: (s) => <Badge tone="purple">{s.category}</Badge> },
    {
      key: 'price',
      header: 'Rate',
      align: 'right',
      render: (s) => (
        <span>
          {formatCurrency(s.price, s.currency)}
          <span className="text-ink-400">/{s.pricingUnit}</span>
        </span>
      ),
    },
    { key: 'status', header: 'Status', render: (s) => <StatusBadge status={s.status} /> },
  ]

  return (
    <div>
      <button
        onClick={() => navigate(-1)}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-700"
      >
        <ArrowLeft className="h-4 w-4" /> Back to stores
      </button>

      <PageHeader
        title={store.name}
        description={`Owned by ${store.ownerName} · Created ${formatDate(store.createdAt)}`}
        actions={
          <div className="flex gap-2">
            {isPending && (
              <Button onClick={() => setStatus('active')} loading={updating}>
                <CheckCircle2 className="h-4 w-4" /> Approve
              </Button>
            )}
            {isSuspended ? (
              <Button onClick={() => setStatus('active')} loading={updating}>
                <CheckCircle2 className="h-4 w-4" /> Reactivate
              </Button>
            ) : (
              <Button variant="danger" onClick={() => setConfirmSuspend(true)}>
                <Ban className="h-4 w-4" /> Suspend
              </Button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardBody className="flex flex-col items-center text-center">
            <Avatar name={store.name} src={store.logoUrl} size="lg" className="h-20 w-20 text-xl" />
            <h3 className="mt-3 text-lg font-semibold text-ink-900">{store.name}</h3>
            <div className="mt-2 flex items-center gap-2">
              <StoreTypeBadge type={store.type} />
              <StatusBadge status={store.status} />
            </div>
            <div className="mt-3 flex items-center gap-1 text-sm text-ink-700">
              {store.rating > 0 ? (
                <>
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> {store.rating} rating
                </>
              ) : (
                <span className="text-ink-400">Not rated yet</span>
              )}
            </div>
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Store details" />
          <CardBody className="grid grid-cols-2 gap-y-4">
            <Detail label="Owner" value={store.ownerName} />
            <Detail label="Category" value={store.category} />
            <Detail label="Subscription plan" value={store.planName ?? 'None'} />
            <Detail label="Listings" value={String(store.listingCount)} />
            <Detail label="Store type" value={store.type} />
          </CardBody>
        </Card>
      </div>

      {/* Vendor's listings — admins inspect catalog per store (multi-vendor). */}
      <Card className="mt-4">
        <CardHeader
          title={isProductStore ? 'Products' : 'Services'}
          description={`Listings published by ${store.name}.`}
        />
        {isProductStore ? (
          <Table
            columns={productColumns}
            rows={products ?? []}
            rowKey={(p) => p.id}
            loading={loadingProducts}
            emptyTitle="No products yet"
          />
        ) : (
          <Table
            columns={serviceColumns}
            rows={services ?? []}
            rowKey={(s) => s.id}
            loading={loadingServices}
            emptyTitle="No services yet"
          />
        )}
      </Card>

      <ConfirmDialog
        open={confirmSuspend}
        title="Suspend this store?"
        description="Listings will be hidden from the marketplace until reactivated."
        confirmLabel="Suspend store"
        tone="danger"
        loading={updating}
        onConfirm={() => setStatus('suspended')}
        onClose={() => setConfirmSuspend(false)}
      />
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-ink-500">{label}</p>
      <p className="mt-0.5 text-sm font-medium capitalize text-ink-900">{value}</p>
    </div>
  )
}
