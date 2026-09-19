'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, MessageSquare, Plus, Trash2 } from 'lucide-react'

const ALLOWED_EMOJIS = ['👍', '❤️', '🎉', '😮', '👏', '🙏']

type ReactionRow = { emoji: string; count: number; includesMe: boolean }
type Comment = { id: string; body: string; createdAt: string; userId: string; authorName: string }

const PRIORITY_BADGE: Record<string, string> = {
  normal: 'bg-slate-100 text-slate-600',
  high: 'bg-blue-50 text-blue-700',
  urgent: 'bg-red-50 text-red-700',
}

function timeAgo(iso: string | null): string {
  if (!iso) return ''
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'just now'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d ago`
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export function AnnouncementCard({
  id,
  title,
  body,
  audience,
  priority,
  isPinned,
  publishedAt,
  authorName,
  reactions: initialReactions,
  comments: initialComments,
  canModerate,
  currentUserId,
}: {
  id: string
  title: string
  body: string
  audience: string
  priority: string
  isPinned: boolean
  publishedAt: string | null
  authorName: string
  reactions: ReactionRow[]
  comments: Comment[]
  canModerate: boolean
  currentUserId: string
}) {
  const router = useRouter()
  const [reactions, setReactions] = useState<ReactionRow[]>(initialReactions)
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [picking, setPicking] = useState(false)
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [removingId, setRemovingId] = useState<string | null>(null)

  async function toggleReaction(emoji: string) {
    setError('')
    setBusy(true)
    try {
      const res = await fetch('/api/hrm/announcements/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ announcement_id: id, emoji }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong.')
        return
      }
      setReactions((prev) => {
        const row = prev.find((r) => r.emoji === emoji)
        if (!row) {
          const next = [{ emoji, count: 1, includesMe: true }, ...prev]
          return next.filter((r) => r.count > 0)
        }
        if (data.active) {
          return prev.map((r) => (r.emoji === emoji ? { ...r, count: r.count + 1, includesMe: true } : r))
        }
        return prev
          .map((r) => (r.emoji === emoji ? { ...r, count: r.count - 1, includesMe: false } : r))
          .filter((r) => r.count > 0)
      })
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setBusy(false)
      setPicking(false)
    }
  }

  async function addComment() {
    const text = draft.trim().slice(0, 1000)
    if (!text) return
    setError('')
    setBusy(true)
    try {
      const res = await fetch('/api/hrm/announcements/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ announcement_id: id, body: text }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong.')
        return
      }
      setComments((prev) => [
        ...prev,
        { id: data.id, body: text, createdAt: new Date().toISOString(), userId: currentUserId, authorName: 'You' },
      ])
      setDraft('')
      router.refresh()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  async function removeComment(commentId: string) {
    setError('')
    setRemovingId(commentId)
    try {
      const res = await fetch(`/api/hrm/announcements/comments/${commentId}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong.')
        return
      }
      setComments((prev) => prev.filter((c) => c.id !== commentId))
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setRemovingId(null)
    }
  }

  const usedEmojis = new Set(reactions.map((r) => r.emoji))
  const availableEmojis = ALLOWED_EMOJIS.filter((e) => !usedEmojis.has(e))

  return (
    <div className={`rounded-2xl border bg-white p-5 ${isPinned ? 'border-blue-200 ring-1 ring-blue-100' : 'border-slate-200'}`}>
      <div className="flex flex-wrap items-center gap-2">
        {isPinned && (
          <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide text-white">
            Pinned
          </span>
        )}
        <h2 className="font-semibold text-slate-900">{title}</h2>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${PRIORITY_BADGE[priority] ?? PRIORITY_BADGE.normal}`}>
          {priority}
        </span>
      </div>
      <p className="mt-3 whitespace-pre-line text-sm text-slate-600">{body}</p>
      <p className="mt-4 text-xs text-slate-400">
        {authorName} · {audience} ·{' '}
        {publishedAt
          ? new Date(publishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
          : ''}
      </p>

      {/* Reactions */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {reactions.map((r) => (
          <button
            key={r.emoji}
            onClick={() => toggleReaction(r.emoji)}
            disabled={busy}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors disabled:opacity-60 ${
              r.includesMe ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300'
            }`}
          >
            <span>{r.emoji}</span>
            <span className="text-xs font-semibold">{r.count}</span>
          </button>
        ))}
        {picking ? (
          <span className="flex items-center gap-1.5">
            {availableEmojis.map((e) => (
              <button
                key={e}
                onClick={() => toggleReaction(e)}
                disabled={busy}
                className="grid h-8 w-8 place-items-center rounded-full border border-slate-200 bg-white text-sm transition-colors hover:border-blue-300"
              >
                {e}
              </button>
            ))}
            {availableEmojis.length === 0 && <span className="text-xs text-slate-400">All reactions used</span>}
          </span>
        ) : (
          availableEmojis.length > 0 && (
            <button
              onClick={() => setPicking(true)}
              disabled={busy}
              className="inline-flex items-center gap-1 rounded-full border border-dashed border-slate-300 px-3 py-1 text-xs font-medium text-slate-400 transition-colors hover:border-blue-300 hover:text-blue-600"
            >
              <Plus size={12} /> React
            </button>
          )
        )}
      </div>

      {/* Comments */}
      <div className="mt-4 border-t border-slate-100 pt-4">
        <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-400">
          <MessageSquare size={12} /> Comments · {comments.length}
        </p>
        {comments.length > 0 && (
          <ul className="mt-3 space-y-3">
            {comments.map((c) => (
              <li key={c.id} className="flex items-start justify-between gap-3 text-sm">
                <p className="min-w-0 break-words text-slate-600">
                  <span className="font-semibold text-slate-800">{c.authorName}</span>
                  <span className="mx-1.5 text-slate-300">·</span>
                  <span className="text-xs text-slate-400">{timeAgo(c.createdAt)}</span>
                  <br />
                  {c.body}
                </p>
                {(c.userId === currentUserId || canModerate) && (
                  <button
                    onClick={() => removeComment(c.id)}
                    disabled={removingId === c.id}
                    className="flex-shrink-0 rounded-md p-1 text-slate-300 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                    aria-label="Delete comment"
                  >
                    {removingId === c.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-3">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={1000}
            rows={2}
            placeholder="Add a comment…"
            className="w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-400"
          />
          {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
          <button
            onClick={addComment}
            disabled={busy || !draft.trim()}
            className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            {busy ? <Loader2 size={12} className="animate-spin" /> : <MessageSquare size={12} />}
            Comment
          </button>
        </div>
      </div>
    </div>
  )
}