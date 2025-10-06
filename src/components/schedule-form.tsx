"use client"

import type React from "react"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

export function ScheduleForm() {
    const [content, setContent] = useState("")
    const [when, setWhen] = useState<string>("")
    const [loading, setLoading] = useState<boolean>(false);

    const canSubmit = content.trim().length > 0 && when

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!canSubmit) return
        setLoading(true);

        try {
            await fetch("/api/posts/schedule", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    content: content.trim(),
                    scheduledFor: new Date(when).toISOString(),
                }),
            })
                .then((res) => res.json())
                .then((data) => {
                    if (data.success) {
                        return toast.success("Your post has been added to the schedule.")
                    } else {
                        return toast.error(data?.message || "Failed to schedule post. Please try again.")
                    }
                })
        } catch (_) {
            toast.error("Failed to schedule post. Please try again.")
            return
        } finally {
            setContent("")
            setWhen("")
            setLoading(false);
        }
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
                    disabled={!canSubmit || loading}
                    style={{
                        backgroundImage: "linear-gradient(90deg, var(--brand-start), var(--brand-end))",
                        color: "oklch(1 0 0)",
                        boxShadow: "0 14px 28px -16px color-mix(in oklab, var(--brand-end), transparent 78%)",
                    }}
                >
                    {loading ? (
                        <>
                            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true"></span>
                            Scheduling...
                        </>
                    ) : "Schedule Post"}
                </Button>
            </div>
        </form>
    )
}
