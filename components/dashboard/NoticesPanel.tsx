'use client'

import { useState } from 'react'
import { Notice } from '@/types'
import { formatDistanceToNow } from 'date-fns'
import { Plus, StickyNote } from 'lucide-react'
import { toast } from 'sonner'

interface NoticesPanelProps {
  notices: Notice[]
}

export function NoticesPanel({ notices: initialNotices }: NoticesPanelProps) {
  const [notices, setNotices] = useState(initialNotices)
  const [adding, setAdding] = useState(false)
  const [text, setText] = useState('')

  async function handleAdd() {
    if (!text.trim()) return

    const res = await fetch('/api/notices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: text.trim() }),
    })

    if (!res.ok) {
      toast.error('Failed to add notice')
      return
    }

    const data = await res.json()
    setNotices([data, ...notices])
    setText('')
    setAdding(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-zinc-700">Notices</p>
        <button
          onClick={() => setAdding(!adding)}
          className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-700 transition-colors duration-150"
        >
          <Plus size={11} /> Add
        </button>
      </div>

      {adding && (
        <div className="mb-3">
          <textarea
            className="w-full text-xs border border-zinc-200 rounded-md px-2.5 py-2 resize-none focus:outline-none focus:border-zinc-400 bg-white transition-colors duration-150"
            rows={2}
            placeholder="Add a notice..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="flex gap-1.5 mt-1.5">
            <button
              onClick={handleAdd}
              className="text-xs bg-zinc-900 text-white px-2.5 py-1 rounded-md hover:bg-zinc-700 transition-colors duration-150"
            >
              Save
            </button>
            <button
              onClick={() => { setAdding(false); setText('') }}
              className="text-xs text-zinc-400 px-2.5 py-1 rounded-md hover:text-zinc-700 transition-colors duration-150"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {notices.length === 0 && !adding && (
          <div className="flex flex-col items-center justify-center py-5 text-center">
            <div className="w-7 h-7 rounded-full bg-zinc-100 flex items-center justify-center mb-2">
              <StickyNote className="w-3.5 h-3.5 text-zinc-400" />
            </div>
            <p className="text-xs text-zinc-400">No notices</p>
          </div>
        )}
        {notices.map((n) => (
          <div key={n.id} className="border-l-2 border-amber-300 pl-2.5 py-1">
            <p className="text-xs text-zinc-700 leading-relaxed">{n.content}</p>
            <p className="text-xs text-zinc-400 mt-0.5">
              {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
