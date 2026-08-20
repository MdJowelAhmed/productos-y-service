import { useEffect, useState, type FormEvent } from 'react'
import { Plus, Ban, CheckCircle2, Pencil, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Table, type Column } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { Badge, type BadgeTone } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Avatar } from '@/components/shared/Avatar'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { toast } from '@/components/ui/Toast'
import {
  useGetAdminsQuery,
  useCreateAdminMutation,
  useUpdateAdminMutation,
  useUpdateAdminStatusMutation,
  useDeleteAdminMutation,
} from '@/services/endpoints/adminsApi'
import type { Admin } from '@/types/models'
import type { Option } from '@/types/common.types'

const ROLE_OPTIONS: Option<string>[] = [
  { label: 'Admin', value: 'admin' },
  { label: 'Super Admin', value: 'super_admin' },
  { label: 'Moderator', value: 'moderator' },
  { label: 'Support', value: 'support' },
]

const roleTone: Record<string, BadgeTone> = {
  super_admin: 'purple',
  admin: 'blue',
  moderator: 'amber',
  support: 'gray',
}

const roleLabel: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  moderator: 'Moderator',
  support: 'Support',
}

export default function AdminsPage() {
  const { data: admins, isLoading } = useGetAdminsQuery()
  const [createAdmin, { isLoading: creating }] = useCreateAdminMutation()
  const [updateAdmin, { isLoading: updating }] = useUpdateAdminMutation()
  const [updateStatus, { isLoading: statusUpdating }] = useUpdateAdminStatusMutation()
  const [deleteAdmin, { isLoading: deleting }] = useDeleteAdminMutation()

  const [creatingOpen, setCreatingOpen] = useState(false)
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null)
  const [toDeleteAdmin, setToDeleteAdmin] = useState<Admin | null>(null)
  const [toToggleStatusAdmin, setToToggleStatusAdmin] = useState<{
    admin: Admin
    targetStatus: 'active' | 'suspended'
  } | null>(null)

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'admin',
  })

  useEffect(() => {
    if (editingAdmin) {
      setForm({
        name: editingAdmin.name || '',
        email: editingAdmin.email || '',
        password: '',
        role: (editingAdmin.role as string) || 'admin',
      })
    } else if (creatingOpen) {
      setForm({
        name: '',
        email: '',
        password: '',
        role: 'admin',
      })
    }
  }, [editingAdmin, creatingOpen])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    try {
      if (editingAdmin) {
        await updateAdmin({
          id: editingAdmin.id,
          name: form.name,
          email: form.email,
          password: form.password ? form.password : undefined,
          role: form.role,
        }).unwrap()
        toast.success(`Admin "${form.name}" updated successfully!`)
        setEditingAdmin(null)
      } else {
        await createAdmin({
          name: form.name,
          email: form.email,
          password: form.password,
          role: form.role,
        }).unwrap()
        toast.success(`Admin "${form.name}" created successfully!`)
        setCreatingOpen(false)
      }
    } catch (err: any) {
      toast.error(
        err?.data?.message || err?.message || 'Failed to save admin account.',
      )
    }
  }

  const handleConfirmStatusChange = async () => {
    if (!toToggleStatusAdmin) return
    const { admin, targetStatus } = toToggleStatusAdmin
    try {
      await updateStatus({ id: admin.id, status: targetStatus }).unwrap()
      toast.success(
        `Admin "${admin.name}" status changed to ${targetStatus} successfully!`,
      )
    } catch (err: any) {
      toast.error(
        err?.data?.message || err?.message || 'Failed to update admin status.',
      )
    } finally {
      setToToggleStatusAdmin(null)
    }
  }

  const handleConfirmDelete = async () => {
    if (!toDeleteAdmin) return
    try {
      await deleteAdmin(toDeleteAdmin.id).unwrap()
      toast.success(`Admin "${toDeleteAdmin.name}" deleted successfully!`)
    } catch (err: any) {
      toast.error(err?.data?.message || err?.message || 'Failed to delete admin.')
    } finally {
      setToDeleteAdmin(null)
    }
  }

  const columns: Column<Admin>[] = [
    {
      key: 'admin',
      header: 'Admin',
      render: (a) => (
        <div className="flex items-center gap-3">
          <Avatar name={a.name} src={a.profileImage} size="sm" />
          <div>
            <p className="font-medium text-ink-900">{a.name}</p>
            <p className="text-xs text-ink-500">{a.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (a) => (
        <Badge tone={roleTone[a.role] || 'gray'}>
          {roleLabel[a.role] || a.role}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (a) => (
        <Badge tone={a.status === 'active' ? 'green' : 'red'}>
          {a.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (a) => (
        <div className="flex items-center justify-end gap-2">
          {a.role === 'super_admin' ? (
            <span className="text-xs text-ink-400">Protected</span>
          ) : (
            <>
              {a.status === 'active' ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setToToggleStatusAdmin({ admin: a, targetStatus: 'suspended' })
                  }
                >
                  <Ban className="h-3.5 w-3.5" /> Suspend
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setToToggleStatusAdmin({ admin: a, targetStatus: 'active' })
                  }
                >
                  <CheckCircle2 className="h-3.5 w-3.5" /> Activate
                </Button>
              )}

              <Button size="sm" variant="outline" onClick={() => setEditingAdmin(a)}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>

              <Button
                size="sm"
                variant="ghost"
                onClick={() => setToDeleteAdmin(a)}
                className="text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Admins"
        description="Team members with administrative access to this dashboard."
        actions={
          <Button onClick={() => setCreatingOpen(true)}>
            <Plus className="h-4 w-4" /> Add admin
          </Button>
        }
      />

      <Card>
        <Table columns={columns} rows={admins ?? []} rowKey={(a) => a.id} loading={isLoading} />
      </Card>

      {/* Form Modal for Creating/Editing Admin */}
      <Modal
        open={creatingOpen || Boolean(editingAdmin)}
        onClose={() => {
          setCreatingOpen(false)
          setEditingAdmin(null)
        }}
        title={editingAdmin ? `Edit Admin · ${editingAdmin.name}` : 'Add New Admin'}
        description={
          editingAdmin
            ? 'Update administrator account credentials and role.'
            : 'Create a new admin account to manage the dashboard.'
        }
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setCreatingOpen(false)
                setEditingAdmin(null)
              }}
              disabled={creating || updating}
            >
              Cancel
            </Button>
            <Button type="submit" form="admin-form" loading={creating || updating}>
              {editingAdmin ? 'Save changes' : 'Create admin'}
            </Button>
          </>
        }
      >
        <form id="admin-form" onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Enter full name"
            required
          />
          <Input
            label="Email Address"
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="Enter email address"
            required
          />
          <Input
            label={editingAdmin ? 'Password (leave blank to keep current)' : 'Password'}
            type="password"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            placeholder="Enter password"
            required={!editingAdmin}
          />
          <Select
            label="Role"
            options={ROLE_OPTIONS}
            value={form.role}
            onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
          />
        </form>
      </Modal>

      {/* Status Change Confirmation Modal */}
      <ConfirmDialog
        open={Boolean(toToggleStatusAdmin)}
        title={`Change admin status to ${
          toToggleStatusAdmin?.targetStatus === 'active' ? 'Active' : 'Suspended'
        }?`}
        description={`Are you sure you want to change status of "${toToggleStatusAdmin?.admin.name}" to ${toToggleStatusAdmin?.targetStatus}?`}
        confirmLabel={`Set to ${
          toToggleStatusAdmin?.targetStatus === 'active' ? 'Active' : 'Suspended'
        }`}
        tone={toToggleStatusAdmin?.targetStatus === 'active' ? 'primary' : 'danger'}
        loading={statusUpdating}
        onConfirm={handleConfirmStatusChange}
        onClose={() => setToToggleStatusAdmin(null)}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        open={Boolean(toDeleteAdmin)}
        title={`Delete admin "${toDeleteAdmin?.name}"?`}
        description="This action will permanently delete the admin account from the database."
        confirmLabel="Delete admin"
        tone="danger"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setToDeleteAdmin(null)}
      />
    </div>
  )
}
