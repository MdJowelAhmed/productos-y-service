import { Check, X } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Table, type Column } from '@/components/ui/Table'
import { Pagination } from '@/components/ui/Pagination'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { ReportStatusBadge, SeverityBadge } from '@/components/shared/StatusBadge'
import { SearchInput } from '@/components/shared/SearchInput'
import { TableToolbar } from '@/components/shared/TableToolbar'
import { REPORT_STATUS_OPTIONS } from '@/components/shared/filterOptions'
import { useListParams } from '@/hooks/useListParams'
import { useGetReportsQuery, useResolveReportMutation } from '@/services/endpoints/moderationApi'
import type { Report } from '@/types/models'

export default function ReportsPage() {
  const { search, setSearch, status, setStatus, page, setPage, params } = useListParams({ status: 'open' })
  const { data, isFetching } = useGetReportsQuery(params)
  const [resolve, { isLoading: resolving }] = useResolveReportMutation()

  const columns: Column<Report>[] = [
    {
      key: 'target',
      header: 'Reported',
      render: (r) => <span className="font-medium text-ink-900">{r.targetName}</span>,
    },
    {
      key: 'type',
      header: 'Type',
      render: (r) => (
        <Badge tone="gray" className="capitalize">
          {r.targetType}
        </Badge>
      ),
    },
    {
      key: 'reason',
      header: 'Reason',
      wrap: true,
      className: 'max-w-[220px]',
      render: (r) => <span className="text-ink-700">{r.reason}</span>,
    },
    { key: 'reporter', header: 'Reporter', render: (r) => r.reporterName },
    { key: 'severity', header: 'Severity', render: (r) => <SeverityBadge severity={r.severity} /> },
    { key: 'status', header: 'Status', render: (r) => <ReportStatusBadge status={r.status} /> },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (r) =>
        r.status === 'open' ? (
          <div className="flex justify-end gap-1.5">
            <button
              title="Dismiss report"
              aria-label="Dismiss report"
              disabled={resolving}
              onClick={() => resolve({ id: r.id, status: 'dismissed' })}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-ink-200 text-ink-600 hover:bg-ink-50 disabled:opacity-50"
            >
              <X className="h-4 w-4" />
            </button>
            <button
              title="Resolve report"
              aria-label="Resolve report"
              disabled={resolving}
              onClick={() => resolve({ id: r.id, status: 'resolved' })}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50"
            >
              <Check className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <span className="text-xs text-ink-400">—</span>
        ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Moderation queue for reported users, stores, listings and chats."
      />

      <Card>
        <TableToolbar>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search reports…"
            className="w-full sm:max-w-xs"
          />
          <div className="w-full sm:w-44">
            <Select options={REPORT_STATUS_OPTIONS} value={status} onChange={(e) => setStatus(e.target.value)} />
          </div>
        </TableToolbar>

        <Table
          columns={columns}
          rows={data?.items ?? []}
          rowKey={(r) => r.id}
          loading={isFetching}
          emptyTitle="No reports"
          emptyDescription="The moderation queue is clear."
        />

        {data && <Pagination page={page} pageSize={data.pageSize} total={data.total} onPageChange={setPage} />}
      </Card>
    </div>
  )
}
