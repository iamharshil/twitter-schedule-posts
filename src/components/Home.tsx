"use client"

import { useCallback, useEffect, useState } from "react"
import { LogoutButton } from "@/components/logout-button"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { ScheduleForm } from "./schedule-form"
import { ScheduledList } from "./scheduled-list"
import { ModeToggle } from "./toggle-theme"

export default function Page() {
    const [posts, setPosts] = useState([]);

    const fetchScheduleList = useCallback(async () => {
        const res = await fetch("/api/posts")
        const data = await res.json();
        setPosts(data.data);
    }, []);


    useEffect(() => {
        fetchScheduleList()
    }, [fetchScheduleList]);


    return (
        <main className="min-h-dvh relative overflow-hidden">
            <div
                aria-hidden
                className="pointer-events-none fixed inset-0 -z-10"
                style={{
                    backgroundImage: `
            radial-gradient(40% 30% at 10% 0%,
              color-mix(in oklab, var(--brand-start), transparent 85%),
              transparent
            ),
            radial-gradient(35% 30% at 90% 10%,
              color-mix(in oklab, var(--brand-end), transparent 85%),
              transparent
            )
          `,
                    filter: "blur(40px)",
                }}
            />

            <header className="sticky top-0 z-30">
                <div
                    className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 rounded-b-2xl supports-[backdrop-filter]:backdrop-blur-xl flex-wrap md:flex-nowrap"
                    style={{
                        background: "color-mix(in oklab, var(--background), transparent 35%)",
                        border: "1px solid",
                        borderColor: "var(--glass-border-color)",
                        boxShadow: "var(--glass-inner-shadow), var(--glass-shadow)",
                    }}
                >
                    <div className="min-w-0">
                        <h1
                            aria-label="X Scheduler"
                            className={cn("text-balance text-xl font-semibold tracking-tight md:text-3xl")}
                            style={{
                                backgroundImage: "linear-gradient(90deg, var(--brand-start), var(--brand-end))",
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                            }}
                        >
                            <span className="md:hidden">X</span>
                            <span className="hidden md:inline">X Scheduler</span>
                        </h1>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <ModeToggle />
                        <LogoutButton />
                    </div>
                </div>
            </header>

            <section className="relative">
                <div className="mx-auto max-w-5xl px-4 py-6 md:py-8 flex flex-col gap-6">
                    <Card
                        className="p-4 md:p-6 supports-[backdrop-filter]:backdrop-blur-xl"
                        style={{
                            background: "var(--glass-surface-bg)",
                            border: "1px solid",
                            borderColor: "var(--glass-border-color)",
                            boxShadow: "var(--glass-inner-shadow), var(--glass-shadow)",
                            position: "relative",
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
                        <h2 className="text-lg font-medium relative">New Scheduled Post</h2>
                        <p className="mb-4 text-sm text-muted-foreground relative">
                            Write your content and pick a time to publish.
                        </p>
                        <ScheduleForm />
                    </Card>

                    <Card
                        className="p-4 md:p-6 supports-[backdrop-filter]:backdrop-blur-xl"
                        style={{
                            background: "var(--glass-surface-bg)",
                            border: "1px solid",
                            borderColor: "var(--glass-border-color)",
                            boxShadow: "var(--glass-inner-shadow), var(--glass-shadow)",
                            position: "relative",
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
                        <div className="relative flex items-center justify-between">
                            <h2 className="text-lg font-medium">Scheduled Posts</h2>
                        </div>
                        <div className="relative">
                            <ScheduledList posts={posts} />
                        </div>
                    </Card>
                </div>
            </section>

            <footer className="mx-auto max-w-5xl px-4 pb-8 pt-2 text-xs text-muted-foreground">
                Crafted for creators — responsive, accessible, and fast.
            </footer>
        </main>
    )
}
