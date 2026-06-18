import { Undo2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Table, type Column } from '@/components/ui/Table'
import { Pagination } from '@/components/ui/Pagination'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { TransactionStatusBadge } from '@/components/shared/StatusBadge'
import { SearchInput } from '@/components/shared/SearchInput'
import { TableToolbar } from '@/components/shared/TableToolbar'
import { TRANSACTION_STATUS_OPTIONS } from '@/components/shared/filterOptions'
import { useListParams } from '@/hooks/useListParams'
import { useGetTransactionsQuery, useRefundTransactionMutation } from '@/services/endpoints/billingApi'
import { formatCurrency } from '@/lib/utils'
import { formatDate } from '@/lib/format'
import type { Transaction } from '@/types/models'

const methodLabel: Record<Transaction['method'], string> = {
  card: 'Card',
  mobile_banking: 'Mobile Banking',
  wallet: 'Wallet',
}

export default function TransactionsPage() {
  const { search, setSearch, status, setStatus, page, setPage, params } = useListParams()
  const { data, isFetching } = useGetTransactionsQuery(params)
  const [refund, { isLoading: refunding }] = useRefundTransactionMutation()

  const columns: Column<Transaction>[] = [
    { key: 'invoice', header: 'Invoice', render: (t) => <code className="text-xs text-ink-700">{t.invoiceNo}</code> },
    { key: 'store', header: 'Store', render: (t) => <span className="font-medium text-ink-900">{t.storeName}</span> },
    { key: 'plan', header: 'Plan', render: (t) => t.planName },
    { key: 'method', header: 'Method', render: (t) => <Badge tone="gray">{methodLabel[t.method]}</Badge> },
    { key: 'amount', header: 'Amount', align: 'right', render: (t) => formatCurrency(t.amount, t.currency) },
    { key: 'date', header: 'Date', render: (t) => formatDate(t.createdAt) },
    { key: 'status', header: 'Status', render: (t) => <TransactionStatusBadge status={t.status} /> },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (t) =>
        t.status === 'paid' ? (
          <Button size="sm" variant="outline" disabled={refunding} onClick={() => refund(t.id)}>
            <Undo2 className="h-3.5 w-3.5" /> Refund
          </Button>
        ) : (
          <span className="text-xs text-ink-400">—</span>
        ),
    },
  ]

  return (
    <div>
      <PageHeader title="Transactions" description="Subscription payments and refunds." />

      <Card>
        <TableToolbar>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by store, plan or invoice…"
            className="w-full sm:max-w-xs"
          />
          <div className="w-full sm:w-44">
            <Select options={TRANSACTION_STATUS_OPTIONS} value={status} onChange={(e) => setStatus(e.target.value)} />
          </div>
        </TableToolbar>

        <Table
          columns={columns}
          rows={data?.items ?? []}
          rowKey={(t) => t.id}
          loading={isFetching}
          emptyTitle="No transactions found"
        />

        {data && <Pagination page={page} pageSize={data.pageSize} total={data.total} onPageChange={setPage} />}
      </Card>
    </div>
  )
}
