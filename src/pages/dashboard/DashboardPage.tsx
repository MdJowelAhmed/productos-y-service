import { useNavigate } from 'react-router-dom'
import { CreditCard, DollarSign, Store, Users } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { StatCard } from '@/components/shared/StatCard'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingState } from '@/components/ui/Spinner'
import { Table, type Column } from '@/components/ui/Table'
import { SubscriptionStatusBadge, StoreTypeBadge } from '@/components/shared/StatusBadge'
import { RevenueChart } from '@/components/dashboard/components/RevenueChart'
import { StoreTypeChart } from '@/components/dashboard/components/StoreTypeChart'
import {
  useGetDashboardStatsQuery,
  useGetRevenueSeriesQuery,
  useGetStoreTypeBreakdownQuery,
} from '@/services/endpoints/statsApi'
import { useGetSubscriptionsQuery } from '@/services/endpoints/billingApi'
import { formatCurrency, formatNumber } from '@/lib/utils'
import { ROUTES } from '@/constants/routes'
import type { Subscription } from '@/types/models'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { data: stats, isLoading: statsLoading } = useGetDashboardStatsQuery()
  const { data: revenue, isLoading: revenueLoading } = useGetRevenueSeriesQuery()
  const { data: breakdown, isLoading: breakdownLoading } = useGetStoreTypeBreakdownQuery()
  const { data: subs } = useGetSubscriptionsQuery({ page: 1 })

  const recentColumns: Column<Subscription>[] = [
    { key: 'store', header: 'Store', render: (s) => <span className="font-medium text-ink-900">{s.storeName}</span> },
    { key: 'type', header: 'Type', render: (s) => <StoreTypeBadge type={s.storeType} /> },
    { key: 'plan', header: 'Plan', render: (s) => s.planName },
    { key: 'amount', header: 'Amount', align: 'right', render: (s) => formatCurrency(s.amount) },
    { key: 'status', header: 'Status', render: (s) => <SubscriptionStatusBadge status={s.status} /> },
  ]

  return (
    <div>
      <PageHeader title="Dashboard" description="Marketplace performance at a glance." />

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Users"
          value={stats ? formatNumber(stats.totalUsers) : '—'}
          icon={Users}
          delta={stats?.deltas.users}
          loading={statsLoading}
        />
        <StatCard
          label="Total Stores"
          value={stats ? formatNumber(stats.totalStores) : '—'}
          icon={Store}
          delta={stats?.deltas.stores}
          loading={statsLoading}
        />
        <StatCard
          label="Active Subscriptions"
          value={stats ? formatNumber(stats.activeSubscriptions) : '—'}
          icon={CreditCard}
          delta={stats?.deltas.subscriptions}
          loading={statsLoading}
        />
        <StatCard
          label="MRR"
          value={stats ? formatCurrency(stats.mrr) : '—'}
          icon={DollarSign}
          delta={stats?.deltas.mrr}
          loading={statsLoading}
        />
      </div>

      {/* Charts */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Revenue" description="Subscription revenue over the last 6 months" />
          <CardBody>
            {revenueLoading || !revenue ? <LoadingState /> : <RevenueChart data={revenue} />}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Store Types" description="Product vs service split" />
          <CardBody>
            {breakdownLoading || !breakdown ? <LoadingState /> : <StoreTypeChart data={breakdown} />}
          </CardBody>
        </Card>
      </div>

      {/* Recent subscriptions */}
      <Card className="mt-6">
        <CardHeader
          title="Recent Subscriptions"
          description="Latest store subscriptions"
          action={
            <Button variant="ghost" size="sm" onClick={() => navigate(ROUTES.subscriptions)}>
              View all
            </Button>
          }
        />
        <Table
          columns={recentColumns}
          rows={subs?.items.slice(0, 6) ?? []}
          rowKey={(s) => s.id}
          loading={!subs}
        />
      </Card>
    </div>
  )
}
