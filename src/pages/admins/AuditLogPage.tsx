import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Table, type Column } from '@/components/ui/Table'
import { Pagination } from '@/components/ui/Pagination'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/shared/Avatar'
import { SearchInput } from '@/components/shared/SearchInput'
import { TableToolbar } from '@/components/shared/TableToolbar'
import { useListParams } from '@/hooks/useListParams'
import { useGetAuditLogsQuery } from '@/services/endpoints/engagementApi'
import { formatDateTime } from '@/lib/format'
import type { AuditLog } from '@/types/models'

export default function AuditLogPage() {
  const { search, setSearch, page, setPage, params } = useListParams()
  const { data, isFetching } = useGetAuditLogsQuery(params)

  const columns: Column<AuditLog>[] = [
    {
      key: 'actor',
      header: 'Admin',
      render: (l) => (
        <div className="flex items-center gap-3">
          <Avatar name={l.actorName} size="sm" />
          <span className="font-medium text-ink-900">{l.actorName}</span>
        </div>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      render: (l) => (
        <span className="text-ink-700">
          {l.action} <Badge tone="gray">{l.targetType}</Badge>
        </span>
      ),
    },
    { key: 'target', header: 'Target', render: (l) => <span className="text-ink-700">{l.targetName}</span> },
    { key: 'time', header: 'When', render: (l) => <span className="text-ink-500">{formatDateTime(l.createdAt)}</span> },
  ]

  return (
    <div>
      <PageHeader title="Audit Log" description="A record of administrative actions across the platform." />

      <Card>
        <TableToolbar>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by admin, action or target…"
            className="w-full sm:max-w-sm"
          />
        </TableToolbar>

        <Table
          columns={columns}
          rows={data?.items ?? []}
          rowKey={(l) => l.id}
          loading={isFetching}
          emptyTitle="No activity yet"
        />

        {data && <Pagination page={page} pageSize={data.pageSize} total={data.total} onPageChange={setPage} />}
      </Card>
    </div>
  )
}
