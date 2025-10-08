"use client"

import { Edit2, Save, Trash2, X } from "lucide-react"
import { useState } from "react"
import DatePicker from "@/components/DatePicker"
import TimePicker from "@/components/TimePicker"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
// Input removed: we use DatePicker + TimePicker for edits
import { Textarea } from "@/components/ui/textarea"
import type { Post, Posts } from "@/lib/validation"

function formatDate(iso: string) {
    try {
        const d = new Date(iso)
        return new Intl.DateTimeFormat(undefined, {
            dateStyle: "medium",
            timeStyle: "short",
        }).format(d)
    } catch {
        return iso
    }
}

export function ScheduledList({ posts, onRefresh, loading }: { posts: Posts; onRefresh?: () => Promise<void>; loading?: boolean }) {
    const [editingId, setEditingId] = useState<string | null>(null)
    const [draft, setDraft] = useState<{ content: string; when: string }>({
        content: "",
        when: "",
    })
    const [draftDate, setDraftDate] = useState<Date | null>(null)
    const [draftTime, setDraftTime] = useState<string>("")
    const [saving, setSaving] = useState<boolean>(false)

    const startEdit = (p: Post) => {
        setEditingId(p._id as string)
        // populate draft content and split scheduledFor into date + time
        setDraft({
            content: p.content,
            when: p.scheduledFor.slice(0, 16), // keep for compatibility
        })
        try {
            const d = new Date(p.scheduledFor)
            if (!Number.isNaN(d.getTime())) {
                setDraftDate(d)
                const hh = String(d.getHours()).padStart(2, '0')
                const mm = String(d.getMinutes()).padStart(2, '0')
                setDraftTime(`${hh}:${mm}`)
            } else {
                setDraftDate(null)
                setDraftTime("")
            }
        } catch {
            setDraftDate(null)
            setDraftTime("")
        }
    }

    const saveEdit = () => {
        if (!editingId) return
        (async () => {
            setSaving(true)
            try {
                // Build ISO datetime from draftDate + draftTime
                let scheduledIso: string | null = null
                if (draftDate && draftTime) {
                    const [hh, mm] = draftTime.split(':').map(Number)
                    const d = new Date(draftDate)
                    d.setHours(hh, mm, 0, 0)
                    scheduledIso = d.toISOString()
                }

                const res = await fetch('/api/posts/update', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: editingId, content: draft.content.trim(), scheduledFor: scheduledIso }),
                })
                const data = await res.json()
                if (data?.success) {
                    if (onRefresh) await onRefresh()
                }
            } catch (e) {
                console.error('update post failed', e)
            } finally {
                setSaving(false)
                setEditingId(null)
                setDraftDate(null)
                setDraftTime("")
            }
        })()
    }

    const deletePost = async (_id: string) => {
        try {
            const res = await fetch('/api/posts/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: _id }),
            })
            const data = await res.json()
            if (data?.success) {
                if (onRefresh) await onRefresh()
            }
        } catch (e) {
            console.error('delete failed', e)
        }
    }

    if (loading) {
        // render skeleton placeholders
        return (
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <Card
                        key={`skeleton-${i}`}
                        className="p-4 animate-pulse"
                        style={{
                            background: "var(--glass-surface-bg)",
                            border: "1px solid",
                            borderColor: "var(--glass-border-color)",
                            boxShadow: "var(--glass-inner-shadow), var(--glass-shadow)",
                        }}
                    >
                        <div className="h-4 bg-muted rounded w-3/4 mb-3" />
                        <div className="h-3 bg-muted rounded w-1/2" />
                    </Card>
                ))}
            </div>
        )
    }

    if (!posts?.length) {
        return (
            <div
                className="rounded-lg p-6 text-center text-sm text-muted-foreground supports-[backdrop-filter]:backdrop-blur-xl"
                style={{
                    background: "var(--glass-surface-bg)",
                    border: "1px solid",
                    borderColor: "var(--glass-border-color)",
                    boxShadow: "var(--glass-inner-shadow), var(--glass-shadow)",
                }}
            >
                No scheduled posts yet. Your planned posts will appear here.
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {posts.map((p) => {
                const isEditing = editingId === p._id
                return (
                    <Card
                        key={p._id}
                        className="p-4 relative supports-[backdrop-filter]:backdrop-blur-xl"
                        style={{
                            background: "var(--glass-surface-bg)",
                            border: "1px solid",
                            borderColor: "var(--glass-border-color)",
                            boxShadow: "var(--glass-inner-shadow), var(--glass-shadow)",
                        }}
                    >
                        <div
                            aria-hidden
                            style={{
                                content: '""',
                                position: "absolute",
                                inset: 0,
                                borderRadius: "inherit",
                                background: "var(--glass-glare)",
                                opacity: "var(--glass-glare-opacity)",
                                pointerEvents: "none",
                            }}
                        />
                        {!isEditing ? (
                            <div className="relative flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                <div className="flex-1">
                                    <p className="text-pretty break-words">{p.content}</p>
                                    <p className="mt-1 text-xs text-muted-foreground">Scheduled for {formatDate(p.scheduledFor)}</p>
                                </div>
                                <div className="flex items-stretch gap-2 flex-wrap w-full md:w-auto md:justify-end">
                                    <Button variant="secondary" className="w-full sm:w-auto" onClick={() => startEdit(p)}>
                                        <Edit2 className="mr-2 size-4" />
                                        Edit
                                    </Button>
                                    <Button variant="destructive" className="w-full sm:w-auto" onClick={() => deletePost(p._id as string)}>
                                        <Trash2 className="mr-2 size-4" />
                                        Delete
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="relative space-y-3">
                                <label className="text-sm font-medium" htmlFor={`content-${p._id}`}>
                                    Edit content
                                </label>
                                <Textarea
                                    id={`content-${p._id}`}
                                    value={draft.content}
                                    onChange={(e) => setDraft((d) => ({ ...d, content: e.target.value }))}
                                    maxLength={280}
                                    className="min-h-24 supports-[backdrop-filter]:backdrop-blur-sm"
                                    style={{
                                        background: "color-mix(in oklab, var(--background), transparent 60%)",
                                        borderColor: "color-mix(in oklab, var(--foreground), transparent 90%)",
                                    }}
                                />
                                <div className="text-right text-xs text-muted-foreground">{draft.content.length}/280</div>
                                <label className="text-sm font-medium" htmlFor={`when-${p._id}`}>
                                    Date & time
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    <DatePicker
                                        value={draftDate}
                                        onChange={(d) => setDraftDate(d)}
                                        minDate={new Date()}
                                    />
                                    <TimePicker
                                        value={draftTime || undefined}
                                        onChange={(t) => setDraftTime(t)}
                                        minTime={(() => {
                                            if (!draftDate) return null
                                            const now = new Date()
                                            const sel = new Date(draftDate)
                                            if (sel.toDateString() !== now.toDateString()) return null
                                            const mins = now.getMinutes()
                                            const next = Math.ceil((mins + 1) / 15) * 15
                                            const h = now.getHours()
                                            const mm = next === 60 ? 0 : next
                                            const hh = next === 60 ? h + 1 : h
                                            return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
                                        })()}
                                    />
                                </div>

                                <div className="flex items-center gap-2 pt-1 flex-wrap">
                                    <Button className="w-full sm:w-auto" onClick={saveEdit} disabled={saving}>
                                        {saving ? (
                                            <>
                                                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" aria-hidden="true"></span>
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="mr-2 size-4" />
                                                Save
                                            </>
                                        )}
                                    </Button>
                                    <Button variant="secondary" className="w-full sm:w-auto" onClick={() => setEditingId(null)} disabled={saving}>
                                        <X className="mr-2 size-4" />
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        )}
                    </Card>
                )
            })}
        </div>
    )
}
