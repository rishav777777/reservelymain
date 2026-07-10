'use client'

import { useEffect, useState, useCallback } from 'react'
import { Search, ExternalLink, MoreHorizontal, ShieldCheck, UserX, UserCheck, ChevronDown } from 'lucide-react'
import Link from 'next/link'

interface AdminUser {
  id:            string
  full_name:     string | null
  email:         string | null
  role:          string
  is_active:     boolean
  is_superadmin: boolean
  created_at:    string
  restaurant_id: string | null
  restaurants:   { name: string; slug: string | null; subscription_plan: string | null; deleted_at: string | null } | null
}

const ROLE_COLORS: Record<string, string> = {
  owner:   'bg-brand-primary/10 text-brand-primary',
  manager: 'bg-blue-50 text-blue-700',
  staff:   'bg-zinc-100 text-zinc-500',
}

function fmt(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

async function patchUser(id: string, patch: Record<string, unknown>) {
  const res = await fetch(`/api/admin/users/${id}`, {
    method:  'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(patch),
  })
  if (!res.ok) {
    const json = await res.json() as { error?: string }
    throw new Error(json.error ?? 'Update failed')
  }
}

function ActionsMenu({
  user,
  onRefresh,
}: {
  user: AdminUser
  onRefresh: () => void
}) {
  const [open,  setOpen]  = useState(false)
  const [acting, setActing] = useState(false)
  const [error, setError]  = useState<string | null>(null)

  async function run(patch: Record<string, unknown>) {
    setActing(true)
    setError(null)
    try {
      await patchUser(user.id, patch)
      onRefresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error')
    } finally {
      setActing(false)
      setOpen(false)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        disabled={acting}
        className="p-1 rounded hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors disabled:opacity-40"
        title="Actions"
      >
        <MoreHorizontal size={14} />
      </button>

      {error && (
        <p className="absolute right-0 top-7 z-50 text-[10px] text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1 whitespace-nowrap">
          {error}
        </p>
      )}

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-7 z-50 w-52 bg-white border border-zinc-200 rounded-lg shadow-lg overflow-hidden">
            {/* Suspend / Reactivate */}
            {user.is_active ? (
              <button
                onClick={() => { run({ is_active: false }).catch(() => {}) }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors"
              >
                <UserX size={12} /> Suspend user
              </button>
            ) : (
              <button
                onClick={() => { run({ is_active: true }).catch(() => {}) }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-emerald-600 hover:bg-emerald-50 transition-colors"
              >
                <UserCheck size={12} /> Reactivate user
              </button>
            )}

            {/* Change role */}
            <div className="border-t border-zinc-100">
              <p className="px-3 py-1.5 text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">Change role</p>
              {(['owner', 'manager', 'staff'] as const).map(r => (
                <button
                  key={r}
                  onClick={() => { run({ role: r }).catch(() => {}) }}
                  disabled={user.role === r}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs transition-colors ${
                    user.role === r
                      ? 'text-zinc-300 cursor-default'
                      : 'text-zinc-600 hover:bg-zinc-50'
                  }`}
                >
                  <ChevronDown size={10} className="opacity-0" />
                  <span className="capitalize">{r}</span>
                  {user.role === r && <span className="ml-auto text-[9px] text-zinc-300">current</span>}
                </button>
              ))}
            </div>

            {/* Superadmin */}
            <div className="border-t border-zinc-100">
              {user.is_superadmin ? (
                <button
                  onClick={() => { run({ is_superadmin: false }).catch(() => {}) }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-amber-600 hover:bg-amber-50 transition-colors"
                >
                  <ShieldCheck size={12} /> Remove superadmin
                </button>
              ) : (
                <button
                  onClick={() => { run({ is_superadmin: true }).catch(() => {}) }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-amber-700 hover:bg-amber-50 transition-colors"
                >
                  <ShieldCheck size={12} /> Promote to superadmin
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default function AdminUsersPage() {
  const [users,   setUsers]   = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [role,    setRole]    = useState('')

  const load = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (role) params.set('role', role)
    fetch(`/api/admin/users?${params}`)
      .then(r => r.json())
      .then(d => { setUsers(d.users ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [role])

  useEffect(() => { load() }, [load])

  const filtered = search
    ? users.filter(u => {
        const q = search.toLowerCase()
        return (
          u.full_name?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q) ||
          u.restaurants?.name?.toLowerCase().includes(q)
        )
      })
    : users

  const totalActive    = users.filter(u => u.is_active).length
  const totalSuspended = users.filter(u => !u.is_active).length

  return (
    <div className="p-4 md:p-6 max-w-5xl space-y-4">
      <div>
        <h1 className="text-sm font-semibold text-zinc-900">Platform Users</h1>
        <p className="text-xs text-zinc-400 mt-0.5">
          {users.length} users · {totalActive} active · {totalSuspended} suspended
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-400" />
          <input
            type="text"
            placeholder="Search name, email, restaurant…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 h-8 text-xs border border-zinc-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-primary"
          />
        </div>
        <select
          value={role}
          onChange={e => setRole(e.target.value)}
          className="h-8 px-3 text-xs border border-zinc-200 rounded-md bg-white focus:outline-none"
        >
          <option value="">All roles</option>
          <option value="owner">Owner</option>
          <option value="manager">Manager</option>
          <option value="staff">Staff</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-zinc-200 rounded-lg overflow-x-auto">
        <div className="grid grid-cols-[1fr_160px_80px_90px_90px_36px] gap-0 border-b border-zinc-100 px-4 py-2">
          {['User', 'Restaurant', 'Role', 'Status', 'Joined', ''].map((h, i) => (
            <span key={i} className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">{h}</span>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-4 h-4 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-xs text-zinc-400">No users found</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {filtered.map(u => (
              <div
                key={u.id}
                className={`grid grid-cols-[1fr_160px_80px_90px_90px_36px] gap-0 px-4 py-2.5 transition-colors ${
                  u.is_active ? 'hover:bg-zinc-50' : 'bg-red-50/30 hover:bg-red-50/60'
                }`}
              >
                {/* User */}
                <div className="min-w-0 self-center">
                  <p className="text-xs font-medium text-zinc-900 truncate">
                    {u.full_name ?? '—'}
                    {u.is_superadmin && (
                      <span className="ml-1.5 text-[9px] font-semibold px-1 py-0.5 rounded bg-amber-100 text-amber-700">SUPER</span>
                    )}
                  </p>
                  <p className="text-[11px] text-zinc-400 truncate">{u.email}</p>
                </div>

                {/* Restaurant */}
                <div className="self-center min-w-0">
                  {u.restaurants ? (
                    <Link
                      href={`/admin/restaurants/${u.restaurant_id}`}
                      className="flex items-center gap-1 text-xs text-zinc-600 hover:text-brand-primary transition-colors truncate"
                    >
                      <span className="truncate">{u.restaurants.name}</span>
                      {u.restaurants.deleted_at && (
                        <span className="text-[9px] text-red-500 shrink-0">(deleted)</span>
                      )}
                      <ExternalLink className="w-3 h-3 shrink-0 opacity-50" />
                    </Link>
                  ) : (
                    <span className="text-xs text-zinc-400">—</span>
                  )}
                </div>

                {/* Role */}
                <div className="self-center">
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${ROLE_COLORS[u.role] ?? 'bg-zinc-100 text-zinc-500'}`}>
                    {u.role}
                  </span>
                </div>

                {/* Status */}
                <div className="self-center">
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
                    u.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-500'
                  }`}>
                    {u.is_active ? 'Active' : 'Suspended'}
                  </span>
                </div>

                {/* Joined */}
                <div className="self-center">
                  <span className="text-[11px] text-zinc-400">{fmt(u.created_at)}</span>
                </div>

                {/* Actions */}
                <div className="self-center flex justify-end">
                  <ActionsMenu user={u} onRefresh={load} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
