'use client'

import { useState, useRef, useEffect } from 'react'
import { Message } from '@/types'
import { formatDistanceToNow } from 'date-fns'
import { Send } from 'lucide-react'
import { toast } from 'sonner'

interface MessageThreadProps {
  reservationId: string
  messages: Message[]
  staffName: string
}

export function MessageThread({ reservationId, messages: initialMessages, staffName }: MessageThreadProps) {
  const [messages, setMessages] = useState(initialMessages)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) return
    setSending(true)

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reservation_id: reservationId,
          sender_type: 'restaurant',
          sender_name: staffName,
          content: text.trim(),
        }),
      })

      if (!res.ok) {
        toast.error('Failed to send message')
        return
      }

      const message = await res.json()
      setMessages([...messages, message])
      setText('')
    } catch {
      toast.error('Network error')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-3 py-2 min-h-0">
        {messages.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-4">No messages yet</p>
        )}
        {messages.map((msg) => {
          const isRestaurant = msg.sender_type === 'restaurant'
          return (
            <div
              key={msg.id}
              className={`flex flex-col gap-0.5 ${isRestaurant ? 'items-end' : 'items-start'}`}
            >
              <span className="text-xs text-gray-400">{msg.sender_name ?? msg.sender_type}</span>
              <div
                className={`max-w-[80%] px-3 py-2 rounded-lg text-xs leading-relaxed ${
                  isRestaurant
                    ? 'bg-red-50 text-red-900 border border-red-100'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {msg.content}
              </div>
              <span className="text-xs text-gray-400">
                {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
              </span>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="flex gap-2 pt-3 border-t border-gray-200 mt-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 text-xs border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:border-gray-400"
          disabled={sending}
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="flex items-center gap-1 bg-[#E63946] hover:bg-[#c1121f] text-white text-xs px-3 py-2 rounded-md transition-colors disabled:opacity-50"
        >
          <Send size={12} /> Send
        </button>
      </form>
    </div>
  )
}
