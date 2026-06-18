import { useState, type FormEvent } from 'react'
import { Plus, Ban, CheckCircle2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Table, type Column } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { Badge, type BadgeTone } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Avatar } from '@/components/shared/Avatar'
import {
  useGetAdminsQuery,
  useCreateAdminMutation,
  useUpdateAdminStatusMutation,
} from '@/services/endpoints/adminsApi'
import type { Admin, AdminRole } from '@/types/models'
import type { Option } from '@/types/common.types'

const ROLE_OPTIONS: Option<AdminRole>[] = [
  { label: 'Super Admin', value: 'super_admin' },
  { label: 'Admin', value: 'admin' },
  { label: 'Moderator', value: 'moderator' },
  { label: 'Support', value: 'support' },
]

const roleTone: Record<AdminRole, BadgeTone> = {
  super_admin: 'purple',
  admin: 'blue',
  moderator: 'amber',
  support: 'gray',
}

const roleLabel: Record<AdminRole, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  moderator: 'Moderator',
  support: 'Support',
}

export default function AdminsPage() {
  const { data: admins, isLoading } = useGetAdminsQuery()
  const [createAdmin, { isLoading: creating }] = useCreateAdminMutation()
  const [updateStatus] = useUpdateAdminStatusMutation()

  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<{ name: string; email: string; role: AdminRole }>({
    name: '',
    email: '',
    role: 'admin',
  })

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault()
    await createAdmin(form).unwrap()
    setOpen(false)
    setForm({ name: '', email: '', role: 'admin' })
  }

  const columns: Column<Admin>[] = [
    {
      key: 'admin',
      header: 'Admin',
      render: (a) => (
        <div className="flex items-center gap-3">
          <Avatar name={a.name} size="sm" />
          <div>
            <p className="font-medium text-ink-900">{a.name}</p>
            <p className="text-xs text-ink-500">{a.email}</p>
          </div>
        </div>
      ),
    },
    { key: 'role', header: 'Role', render: (a) => <Badge tone={roleTone[a.role]}>{roleLabel[a.role]}</Badge> },
    {
      key: 'status',
      header: 'Status',
      render: (a) => <Badge tone={a.status === 'active' ? 'green' : 'red'}>{a.status}</Badge>,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (a) =>
        a.role === 'super_admin' ? (
          <span className="text-xs text-ink-400">Protected</span>
        ) : a.status === 'active' ? (
          <Button size="sm" variant="outline" onClick={() => updateStatus({ id: a.id, status: 'suspended' })}>
            <Ban className="h-3.5 w-3.5" /> Suspend
          </Button>
        ) : (
          <Button size="sm" variant="outline" onClick={() => updateStatus({ id: a.id, status: 'active' })}>
            <CheckCircle2 className="h-3.5 w-3.5" /> Activate
          </Button>
        ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Admins"
        description="Team members with access to this dashboard."
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> Add admin
          </Button>
        }
      />

      <Card>
        <Table columns={columns} rows={admins ?? []} rowKey={(a) => a.id} loading={isLoading} />
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Add new admin"
        description="They’ll receive an email invite to set a password."
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={creating}>
              Cancel
            </Button>
            <Button type="submit" form="add-admin-form" loading={creating}>
              Send invite
            </Button>
          </>
        }
      >
        <form id="add-admin-form" onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Full name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            required
          />
          <Select
            label="Role"
            options={ROLE_OPTIONS}
            value={form.role}
            onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as AdminRole }))}
          />
        </form>
      </Modal>
    </div>
  )
}
