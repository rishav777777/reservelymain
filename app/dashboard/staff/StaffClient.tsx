'use client'

import { useState } from 'react'
import { StaffMember, UserRole } from '@/types'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Shield, UserPlus, Plus } from 'lucide-react'
import { useLang } from '@/components/i18n/LanguageProvider'
import { dashboardT } from '@/lib/i18n/dashboardT'

const ROLE_BADGE: Record<UserRole, string> = {
  owner:   'bg-violet-100 text-violet-700',
  manager: 'bg-blue-100 text-blue-700',
  staff:   'bg-zinc-100 text-zinc-600',
}

interface UsersClientProps {
  team: StaffMember[]
  pending: StaffMember[]
  currentUserId: string
}

function memberInitials(member: StaffMember): string {
  return (member.full_name ?? member.email ?? '?')
    .split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

export function StaffClient({ team: initialTeam, pending: initialPending, currentUserId }: UsersClientProps) {
  const { lang } = useLang()
  const tx = dashboardT[lang].team

  const [team, setTeam]       = useState(Array.isArray(initialTeam)    ? initialTeam    : [])
  const [pending, setPending] = useState(Array.isArray(initialPending) ? initialPending : [])
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting]               = useState(false)

  const [createOpen, setCreateOpen]     = useState(false)
  const [newName, setNewName]           = useState('')
  const [newEmail, setNewEmail]         = useState('')
  const [newPassword, setNewPassword]   = useState('')
  const [newRole, setNewRole]           = useState<UserRole>('staff')
  const [creating, setCreating]         = useState(false)

  async function handleRoleChange(memberId: string, role: UserRole) {
    setUpdatingId(memberId)
    try {
      const res = await fetch(`/api/users/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      })
      const body = await res.json()
      if (!res.ok) { toast.error(body.error ?? 'Update failed'); return }
      setTeam(prev => prev.map(m => m.id === memberId ? { ...m, role } : m))
      toast.success('Role updated')
    } catch {
      toast.error('Update failed')
    } finally {
      setUpdatingId(null)
    }
  }

  async function handleToggleActive(memberId: string, currentlyActive: boolean) {
    setUpdatingId(memberId)
    try {
      const res = await fetch(`/api/users/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle_active' }),
      })
      const body = await res.json()
      if (!res.ok) { toast.error(body.error ?? 'Failed'); return }
      setTeam(prev => prev.map(m =>
        m.id === memberId ? { ...m, is_active: !currentlyActive } : m
      ))
      toast.success(currentlyActive ? tx.deactivate : tx.activate)
    } catch {
      toast.error('Failed')
    } finally {
      setUpdatingId(null)
    }
  }

  async function handleAddToTeam(userId: string) {
    setUpdatingId(userId)
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add', role: 'staff' }),
      })
      const body = await res.json()
      if (!res.ok) { toast.error(body.error ?? 'Failed'); return }

      const added = pending.find(p => p.id === userId)
      if (added) {
        setPending(prev => prev.filter(p => p.id !== userId))
        setTeam(prev => [...prev, { ...added, role: 'staff' }])
      }
      toast.success(tx.addToTeam)
    } catch {
      toast.error('Failed to add user')
    } finally {
      setUpdatingId(null)
    }
  }

  async function handleDeleteUser(memberId: string) {
    setDeleting(true)
    try {
      const res = await fetch(`/api/users/${memberId}`, { method: 'DELETE' })
      const body = await res.json()
      if (!res.ok) { toast.error(body.error ?? 'Delete failed'); return }
      setTeam(prev => prev.filter(m => m.id !== memberId))
      setConfirmDeleteId(null)
      toast.success(tx.delete)
    } catch {
      toast.error('Delete failed')
    } finally {
      setDeleting(false)
    }
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName, email: newEmail,
          password: newPassword, role: newRole,
        }),
      })
      const body = await res.json()
      if (!res.ok) { toast.error(body.error ?? 'Failed'); return }
      setTeam(prev => [...prev, body])
      setCreateOpen(false)
      setNewName(''); setNewEmail(''); setNewPassword(''); setNewRole('staff')
      toast.success(tx.modal.create)
    } catch {
      toast.error('Failed to create user')
    } finally {
      setCreating(false)
    }
  }

  const ROLE_LABELS = tx.roles

  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-sm font-semibold text-gray-900">{tx.title}</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {tx.subtitle(team.length)}
            {pending.length > 0 && ` ${tx.pendingCount(pending.length)}`}
          </p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-1.5 bg-brand-primary hover:bg-brand-primary/90 text-white text-xs font-medium px-3 py-1.5 rounded-md transition-colors"
        >
          <Plus size={12} /> {tx.createUser}
        </button>
      </div>

      {/* Your team */}
      <div className="space-y-2 mb-6">
        {team.map((member) => {
          const isSelf    = member.id === currentUserId
          const isActive  = member.is_active ?? true
          return (
            <div
              key={member.id}
              className={`flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 bg-white border border-zinc-200 rounded-lg px-4 py-3 ${!isActive ? 'opacity-60' : ''}`}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center shrink-0 text-xs font-medium text-zinc-500">
                  {memberInitials(member)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-zinc-900 truncate">
                    {member.full_name ?? 'Unnamed'}
                    {isSelf && <span className="text-zinc-400 font-normal ml-1">{tx.you}</span>}
                    {!isActive && <span className="text-zinc-400 font-normal ml-1">{tx.inactive}</span>}
                  </p>
                  <p className="text-xs text-zinc-400 truncate">{member.email ?? '—'}</p>
                </div>
              </div>
              <div className="shrink-0 flex items-center gap-2 pl-11 sm:pl-0">
                {isSelf ? (
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ROLE_BADGE[member.role]}`}>
                    {ROLE_LABELS[member.role]}
                  </span>
                ) : (
                  <>
                    <Select
                      value={member.role}
                      onValueChange={v => v && handleRoleChange(member.id, v as UserRole)}
                      disabled={updatingId === member.id}
                    >
                      <SelectTrigger className="h-7 text-xs w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(ROLE_LABELS) as UserRole[]).map(r => (
                          <SelectItem key={r} value={r} className="text-xs">
                            {ROLE_LABELS[r]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <button
                      onClick={() => handleToggleActive(member.id, isActive)}
                      disabled={updatingId === member.id}
                      className={`text-xs px-2 py-1 rounded transition-colors ${
                        isActive
                          ? 'text-red-500 hover:text-red-700'
                          : 'text-emerald-600 hover:text-emerald-800'
                      }`}
                    >
                      {isActive ? tx.deactivate : tx.activate}
                    </button>
                    {confirmDeleteId === member.id ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-red-600">{tx.deleteConfirm}</span>
                        <button
                          onClick={() => handleDeleteUser(member.id)}
                          disabled={deleting}
                          className="text-xs text-red-600 font-medium hover:text-red-800 transition-colors"
                        >
                          {deleting ? '...' : tx.yes}
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors"
                        >
                          {tx.no}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(member.id)}
                        disabled={updatingId === member.id}
                        className="text-xs text-zinc-300 hover:text-red-500 transition-colors"
                      >
                        {tx.delete}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Pending users */}
      {pending.length > 0 && (
        <div className="mb-6">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 px-1">
            {tx.pendingSection}
          </p>
          <div className="space-y-2">
            {pending.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-3 bg-white border border-dashed border-zinc-200 rounded-lg px-4 py-3"
              >
                <div className="w-8 h-8 rounded-full bg-zinc-50 border border-zinc-200 flex items-center justify-center shrink-0 text-xs font-medium text-zinc-400">
                  {memberInitials(member)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-zinc-700 truncate">
                    {member.full_name ?? 'Unnamed'}
                  </p>
                  <p className="text-xs text-zinc-400 truncate">{member.email ?? '—'}</p>
                </div>
                <Button
                  onClick={() => handleAddToTeam(member.id)}
                  disabled={updatingId === member.id}
                  className="h-7 text-xs px-3 bg-brand-primary hover:bg-brand-primary/90 text-white shrink-0"
                >
                  <UserPlus size={11} className="mr-1" />
                  {updatingId === member.id ? tx.adding : tx.addToTeam}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Permissions legend */}
      <div className="bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-3">
        <div className="flex items-start gap-2">
          <Shield size={13} className="text-zinc-400 mt-0.5 shrink-0" />
          <div className="text-xs text-zinc-500 space-y-1">
            <p><span className="font-medium text-violet-700">{ROLE_LABELS.owner}</span> — {tx.legend.owner}</p>
            <p><span className="font-medium text-blue-700">{ROLE_LABELS.manager}</span> — {tx.legend.manager}</p>
            <p><span className="font-medium text-zinc-700">{ROLE_LABELS.staff}</span> — {tx.legend.staff}</p>
            <p className="pt-2 text-zinc-400 border-t border-zinc-200 mt-1">{tx.legend.note}</p>
          </div>
        </div>
      </div>

      {/* Create user modal */}
      <Dialog open={createOpen} onOpenChange={(v) => !v && setCreateOpen(false)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">{tx.modal.title}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateUser} className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-700">{tx.modal.fullName}</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Jane Smith"
                className="h-8 text-sm"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-700">{tx.modal.email}</Label>
              <Input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="jane@restaurant.com"
                className="h-8 text-sm"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-700">{tx.modal.password}</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="h-8 text-sm"
                required
                minLength={6}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-700">{tx.modal.role}</Label>
              <Select value={newRole} onValueChange={(v) => v && setNewRole(v as UserRole)}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(ROLE_LABELS) as UserRole[]).map(r => (
                    <SelectItem key={r} value={r} className="text-sm">
                      {ROLE_LABELS[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-1">
              <Button
                type="submit"
                className="flex-1 h-8 text-sm bg-brand-primary hover:bg-brand-primary/90 text-white"
                disabled={creating}
              >
                {creating ? tx.modal.creating : tx.modal.create}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-8 text-sm"
                onClick={() => setCreateOpen(false)}
              >
                {tx.modal.cancel}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
