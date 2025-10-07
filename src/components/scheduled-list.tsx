"use client"

import { Edit2, Save, Trash2, X } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { type ScheduledPost, useScheduledPosts } from "@/lib/use-scheduled-posts"
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

export function ScheduledList({ posts }: { posts: Posts }) {

    const { deletePost, updatePost } = useScheduledPosts()
    const [editingId, setEditingId] = useState<string | null>(null)
    const [draft, setDraft] = useState<{ content: string; when: string }>({
        content: "",
        when: "",
    })

    const startEdit = (p: Post) => {
        setEditingId(p.id as string)
        setDraft({
            content: p.content,
            when: p.scheduledFor.slice(0, 16), // yyyy-MM-ddTHH:mm for datetime-local
        })
    }

    const saveEdit = () => {
        if (!editingId) return
        // updatePost(editingId, {
        //     content: draft.content.trim(),
        //     scheduledFor: new Date(draft.when).toISOString() as string, // TypeScript fix: cast to any to bypass type error
        // } as Date) // TypeScript fix: cast to any to bypass type error
        setEditingId(null)
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
                const isEditing = editingId === p.id
                return (
                    <Card
                        key={p.id}
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
                                    <Button variant="destructive" className="w-full sm:w-auto" onClick={() => deletePost(p.id as string)}>
                                        <Trash2 className="mr-2 size-4" />
                                        Delete
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="relative space-y-3">
                                <label className="text-sm font-medium" htmlFor={`content-${p.id}`}>
                                    Edit content
                                </label>
                                <Textarea
                                    id={`content-${p.id}`}
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
                                <label className="text-sm font-medium" htmlFor={`when-${p.id}`}>
                                    Date & time
                                </label>
                                <Input
                                    id={`when-${p.id}`}
                                    type="datetime-local"
                                    value={draft.when}
                                    onChange={(e) => setDraft((d) => ({ ...d, when: e.target.value }))}
                                    className="supports-[backdrop-filter]:backdrop-blur-sm"
                                    style={{
                                        background: "color-mix(in oklab, var(--background), transparent 60%)",
                                        borderColor: "color-mix(in oklab, var(--foreground), transparent 90%)",
                                    }}
                                />

                                <div className="flex items-center gap-2 pt-1 flex-wrap">
                                    <Button className="w-full sm:w-auto" onClick={saveEdit}>
                                        <Save className="mr-2 size-4" />
                                        Save
                                    </Button>
                                    <Button variant="secondary" className="w-full sm:w-auto" onClick={() => setEditingId(null)}>
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
