'use client'

import { useEffect, useState } from 'react'
import { Star, MessageSquare, Plus, Trash2, Eye, EyeOff } from 'lucide-react'

type Tab = 'testimonials' | 'faqs'

interface Testimonial {
  id: string; author_name: string; author_role: string | null
  restaurant_name: string | null; location: string | null
  content: string; rating: number; is_published: boolean; sort_order: number
}

interface Faq {
  id: string; question: string; answer: string
  category: string; sort_order: number; is_published: boolean
}

export default function AdminContentPage() {
  const [tab, setTab]                   = useState<Tab>('testimonials')
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [faqs, setFaqs]                 = useState<Faq[]>([])
  const [loading, setLoading]           = useState(true)
  const [acting, setActing]             = useState<string | null>(null)

  // New testimonial form
  const [newT, setNewT] = useState({ author_name: '', author_role: '', restaurant_name: '', location: '', content: '', rating: 5 })
  const [newF, setNewF] = useState({ question: '', answer: '', category: 'general' })
  const [saving, setSaving] = useState(false)

  function load() {
    setLoading(true)
    Promise.all([
      fetch('/api/admin/content?type=testimonials').then(r => r.json()),
      fetch('/api/admin/content?type=faqs').then(r => r.json()),
    ]).then(([t, f]) => {
      setTestimonials(t.items ?? [])
      setFaqs(f.items ?? [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  async function togglePublished(id: string, type: Tab, current: boolean) {
    setActing(id)
    await fetch('/api/admin/content', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, type, is_published: !current }),
    })
    if (type === 'testimonials') {
      setTestimonials(prev => prev.map(t => t.id === id ? { ...t, is_published: !current } : t))
    } else {
      setFaqs(prev => prev.map(f => f.id === id ? { ...f, is_published: !current } : f))
    }
    setActing(null)
  }

  async function deleteItem(id: string, type: Tab) {
    if (!confirm('Delete this item?')) return
    setActing(id)
    await fetch('/api/admin/content', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, type }),
    })
    if (type === 'testimonials') setTestimonials(prev => prev.filter(t => t.id !== id))
    else setFaqs(prev => prev.filter(f => f.id !== id))
    setActing(null)
  }

  async function addTestimonial(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/admin/content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'testimonials', ...newT }),
    })
    const data = await res.json()
    if (data.item) setTestimonials(prev => [data.item, ...prev])
    setNewT({ author_name: '', author_role: '', restaurant_name: '', location: '', content: '', rating: 5 })
    setSaving(false)
  }

  async function addFaq(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/admin/content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'faqs', ...newF }),
    })
    const data = await res.json()
    if (data.item) setFaqs(prev => [data.item, ...prev])
    setNewF({ question: '', answer: '', category: 'general' })
    setSaving(false)
  }

  const INPUT = 'text-xs border border-zinc-200 rounded-md px-2.5 py-1.5 w-full focus:outline-none focus:ring-1 focus:ring-brand-primary/40'

  return (
    <div className="p-4 md:p-6 max-w-4xl space-y-5">
      <div>
        <h1 className="text-sm font-semibold text-zinc-900">Content Management</h1>
        <p className="text-xs text-zinc-400 mt-0.5">Manage testimonials and FAQs shown on the landing page</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(['testimonials', 'faqs'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md border capitalize transition-colors ${
              tab === t ? 'bg-brand-primary text-white border-brand-primary' : 'bg-white text-zinc-500 border-zinc-200 hover:border-zinc-300'
            }`}
          >
            {t === 'testimonials' ? <Star className="w-3 h-3" /> : <MessageSquare className="w-3 h-3" />}
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-5 h-5 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : tab === 'testimonials' ? (
        <div className="space-y-4">
          {/* Add form */}
          <form onSubmit={addTestimonial} className="bg-white border border-zinc-200 rounded-lg p-4 space-y-3">
            <p className="text-xs font-semibold text-zinc-700">Add testimonial</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input required placeholder="Author name" value={newT.author_name} onChange={e => setNewT(p => ({ ...p, author_name: e.target.value }))} className={INPUT} />
              <input placeholder="Role (optional)" value={newT.author_role} onChange={e => setNewT(p => ({ ...p, author_role: e.target.value }))} className={INPUT} />
              <input placeholder="Restaurant name" value={newT.restaurant_name} onChange={e => setNewT(p => ({ ...p, restaurant_name: e.target.value }))} className={INPUT} />
              <input placeholder="Location (city)" value={newT.location} onChange={e => setNewT(p => ({ ...p, location: e.target.value }))} className={INPUT} />
            </div>
            <textarea required placeholder="Quote text…" rows={2} value={newT.content} onChange={e => setNewT(p => ({ ...p, content: e.target.value }))} className={INPUT + ' resize-none'} />
            <div className="flex items-center justify-between">
              <select value={newT.rating} onChange={e => setNewT(p => ({ ...p, rating: Number(e.target.value) }))} className={INPUT + ' w-32'}>
                {[5,4,3,2,1].map(n => <option key={n} value={n}>{n} stars</option>)}
              </select>
              <button type="submit" disabled={saving} className="flex items-center gap-1.5 text-xs bg-brand-primary text-white px-3 py-1.5 rounded-md hover:bg-brand-primary/90 disabled:opacity-50 transition-colors">
                <Plus className="w-3 h-3" /> {saving ? 'Adding…' : 'Add'}
              </button>
            </div>
          </form>

          {/* List */}
          {testimonials.map(t => (
            <div key={t.id} className={`bg-white border rounded-lg p-4 ${t.is_published ? 'border-zinc-200' : 'border-zinc-100 opacity-60'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-zinc-900">{t.author_name}{t.author_role && <span className="font-normal text-zinc-400"> · {t.author_role}</span>}</p>
                  {(t.restaurant_name || t.location) && (
                    <p className="text-xs text-zinc-400">{[t.restaurant_name, t.location].filter(Boolean).join(', ')}</p>
                  )}
                  <p className="text-xs text-zinc-600 mt-1.5 leading-relaxed line-clamp-2">{t.content}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => togglePublished(t.id, 'testimonials', t.is_published)} disabled={acting === t.id}
                    className="text-zinc-400 hover:text-zinc-700 transition-colors p-1 disabled:opacity-40"
                    title={t.is_published ? 'Unpublish' : 'Publish'}>
                    {t.is_published ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>
                  <button onClick={() => deleteItem(t.id, 'testimonials')} disabled={acting === t.id}
                    className="text-zinc-300 hover:text-red-500 transition-colors p-1 disabled:opacity-40">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Add FAQ form */}
          <form onSubmit={addFaq} className="bg-white border border-zinc-200 rounded-lg p-4 space-y-3">
            <p className="text-xs font-semibold text-zinc-700">Add FAQ</p>
            <input required placeholder="Question" value={newF.question} onChange={e => setNewF(p => ({ ...p, question: e.target.value }))} className={INPUT} />
            <textarea required placeholder="Answer…" rows={3} value={newF.answer} onChange={e => setNewF(p => ({ ...p, answer: e.target.value }))} className={INPUT + ' resize-none'} />
            <div className="flex items-center justify-between">
              <select value={newF.category} onChange={e => setNewF(p => ({ ...p, category: e.target.value }))} className={INPUT + ' w-36'}>
                {['general','pricing','technical','gdpr','restaurants'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <button type="submit" disabled={saving} className="flex items-center gap-1.5 text-xs bg-brand-primary text-white px-3 py-1.5 rounded-md hover:bg-brand-primary/90 disabled:opacity-50 transition-colors">
                <Plus className="w-3 h-3" /> {saving ? 'Adding…' : 'Add'}
              </button>
            </div>
          </form>

          {/* FAQ list */}
          {faqs.map(f => (
            <div key={f.id} className={`bg-white border rounded-lg p-4 ${f.is_published ? 'border-zinc-200' : 'border-zinc-100 opacity-60'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-xs font-semibold text-zinc-900">{f.question}</p>
                    <span className="text-[10px] text-zinc-400 border border-zinc-200 rounded px-1.5 py-0.5">{f.category}</span>
                  </div>
                  <p className="text-xs text-zinc-500 leading-relaxed line-clamp-2">{f.answer}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => togglePublished(f.id, 'faqs', f.is_published)} disabled={acting === f.id}
                    className="text-zinc-400 hover:text-zinc-700 transition-colors p-1 disabled:opacity-40"
                    title={f.is_published ? 'Unpublish' : 'Publish'}>
                    {f.is_published ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>
                  <button onClick={() => deleteItem(f.id, 'faqs')} disabled={acting === f.id}
                    className="text-zinc-300 hover:text-red-500 transition-colors p-1 disabled:opacity-40">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
