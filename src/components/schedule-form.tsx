"use client"

import type React from "react"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useScheduledPosts } from "@/lib/use-scheduled-posts"
import { cn } from "@/lib/utils"

export function ScheduleForm() {
    const [content, setContent] = useState("")
    const [when, setWhen] = useState<string>("")
    const { addPost } = useScheduledPosts()

    const canSubmit = content.trim().length > 0 && when

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!canSubmit) return
        addPost({
            content: content.trim(),
            scheduledAt: new Date(when).toISOString(),
        })
        setContent("")
        toast("Your post has been added to the schedule.")
    }

    return (
        <form onSubmit={onSubmit} className="space-y-3">
            <label className="text-sm font-medium mb-4" htmlFor="content">
                Content
            </label>
            <Textarea
                id="content"
                placeholder="Share something great..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className={cn("min-h-28 mt-1 supports-[backdrop-filter]:backdrop-blur-sm", "bg-background")}
                style={{
                    background: "color-mix(in oklab, var(--background), transparent 55%)",
                    borderColor: "var(--glass-border-color)",
                }}
                maxLength={280}
            />
            <div className="flex flex-wrap items-center justify-between gap-y-1 text-xs text-muted-foreground">
                <span>{content.length}/280</span>
                <span>Keep it concise and clear.</span>
            </div>

            <label className="text-sm font-medium" htmlFor="when">
                Date & time
            </label>
            <Input
                id="when"
                type="datetime-local"
                value={when}
                onChange={(e) => setWhen(e.target.value)}
                className="mt-1 supports-[backdrop-filter]:backdrop-blur-sm"
                style={{
                    background: "color-mix(in oklab, var(--background), transparent 55%)",
                    borderColor: "var(--glass-border-color)",
                }}
            />

            <div className="pt-2">
                <Button
                    type="submit"
                    className="w-full"
                    disabled={!canSubmit}
                    style={{
                        backgroundImage: "linear-gradient(90deg, var(--brand-start), var(--brand-end))",
                        color: "oklch(1 0 0)",
                        boxShadow: "0 14px 28px -16px color-mix(in oklab, var(--brand-end), transparent 78%)",
                    }}
                >
                    Schedule Post
                </Button>
            </div>
        </form>
    )
}
