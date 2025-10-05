"use client";

import { CalendarIcon, ClockIcon, LogOutIcon, SendIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import PostsTabs from '@/components/PostsTabs';
import StatsGrid from '@/components/StatsGrid';
import { ModeToggle } from "@/components/toggle-theme";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
// card components no longer needed in redesigned layout
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Post, Posts } from "@/lib/validation";
import type { ScheduledPost as ScheduledPostType } from '@/types/posts';

export default function Home({ posts }: { posts: Posts }) {
    const router = useRouter();
    const [postContent, setPostContent] = useState("");
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const [selectedTime, setSelectedTime] = useState("");
    const [isScheduling, setIsScheduling] = useState(false);
    const [scheduleError, setScheduleError] = useState<string | null>(null);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [isTimeOpen, setIsTimeOpen] = useState(false);
    const [search, setSearch] = useState('');
    // removed active tab state for simplified hero flow

    // Local state for posts
    const [scheduledPosts, setScheduledPosts] = useState<ScheduledPostType[]>(() =>
        posts
            .filter((p) => p.id)
            .map((p) => ({
                id: p.id as string,
                userId: p.userId,
                content: p.content,
                status: p.status as 'pending' | 'posted' | 'failed',
                scheduledFor: new Date(p.scheduledFor),
                createdAt: p.createdAt ? new Date(p.createdAt) : undefined,
                updatedAt: p.updatedAt ? new Date(p.updatedAt) : undefined,
            }))
    );

    const [activeTab, setActiveTab] = useState<'scheduled' | 'posted'>('scheduled');

    const postedContent = useMemo(() => {
        return scheduledPosts
            .filter((p) => p.status === 'posted')
            .map((p) => {
                const postedAt = p.updatedAt ?? p.createdAt ?? undefined;
                return { id: p.id, content: p.content, postedAt };
            })
            .filter((p) => p.postedAt !== undefined) as Array<{ id: string; content: string; postedAt: Date }>;
    }, [scheduledPosts]);

    // Simple derived stats
    const pendingCount = scheduledPosts.filter((p) => p.status === 'pending').length;
    const failedCount = scheduledPosts.filter((p) => p.status === 'failed').length;

    // Helpers
    const getCharacterCount = () => postContent.length;

    const timeOptions = Array.from({ length: 24 * 4 }).map((_, i) => {
        const hours = Math.floor(i / 4);
        const minutes = (i % 4) * 15;
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    });

    const formatDate = (d?: Date) => (d ? d.toISOString().split('T')[0] : '');

    // Handlers
    function handleLogout() {
        // simple client-side redirect to logout route
        router.push('/api/auth/logout');
    }

    async function handleSchedulePost() {
        setScheduleError(null);
        if (!selectedDate || !selectedTime) {
            setScheduleError('Please select date and time');
            return;
        }

        const [hours, minutes] = selectedTime.split(':').map(Number);
        const scheduled = new Date(selectedDate);
        scheduled.setHours(hours, minutes, 0, 0);

        setIsScheduling(true);
        try {
            const res = await fetch('/api/posts/schedule', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: postContent.trim(), scheduledFor: scheduled.toISOString() }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json?.message || 'Failed to schedule');

            // Expect data to be an array of posts
            const data = json.data as Post[];
            const mapped = data.map((p) => ({
                id: String(p.id),
                userId: p.userId,
                content: p.content,
                status: p.status,
                scheduledFor: new Date(p.scheduledFor),
                createdAt: p.createdAt ? new Date(p.createdAt) : undefined,
                updatedAt: p.updatedAt ? new Date(p.updatedAt) : undefined,
            }));

            setScheduledPosts(mapped);
            setPostContent('');
            setSelectedTime('');
            setSelectedDate(new Date());
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            setScheduleError(message || 'Unknown error');
        } finally {
            setIsScheduling(false);
        }
    }

    // post now / delete handlers intentionally omitted in this redesign
    async function handlePostNow(id?: string) {
        if (!id) return;
        try {
            const res = await fetch('/api/posts/post-now', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json?.message || 'Failed to post');

            const data = json.data as Post[];
            const mapped = data.map((p) => ({
                id: String(p.id),
                userId: p.userId,
                content: p.content,
                status: p.status,
                scheduledFor: p.scheduledFor ? new Date(p.scheduledFor) : new Date(),
                createdAt: p.createdAt ? new Date(p.createdAt) : undefined,
                updatedAt: p.updatedAt ? new Date(p.updatedAt) : undefined,
            }));

            setScheduledPosts(mapped);
        } catch (err: unknown) {
            console.error('post now error', err);
        }
    }

    async function handleDelete(id?: string) {
        if (!id) return;
        try {
            const res = await fetch('/api/posts/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json?.message || 'Failed to delete');

            const data = json.data as Post[];
            const mapped = data.map((p) => ({
                id: String(p.id),
                userId: p.userId,
                content: p.content,
                status: p.status,
                scheduledFor: p.scheduledFor ? new Date(p.scheduledFor) : new Date(),
                createdAt: p.createdAt ? new Date(p.createdAt) : undefined,
                updatedAt: p.updatedAt ? new Date(p.updatedAt) : undefined,
            }));

            setScheduledPosts(mapped);
        } catch (err: unknown) {
            console.error('delete error', err);
        }
    }
    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 text-slate-900 dark:text-white">
            <header className="sticky top-0 z-50 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-700/60">
                <div className="max-w-7xl mx-auto px-4 md:px-6 py-3">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-lg shadow-sm">
                                <SendIcon className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-lg md:text-xl font-bold">Post Scheduler</h1>
                                <p className="text-xs text-slate-600 dark:text-slate-400">Plan and manage your scheduled posts</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                placeholder="Search posts"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="hidden md:inline-block px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/70 text-sm w-72"
                            />
                            <ModeToggle />
                            <Button variant="outline" size="sm" onClick={handleLogout}>
                                <LogOutIcon className="h-4 w-4 mr-2" />
                                Logout
                            </Button>
                        </div>
                    </div>
                </div>
            </header>
            <section className="relative overflow-hidden">
                <div className="absolute inset-0 -z-10 bg-gradient-to-tr from-indigo-50 via-white to-rose-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-800 opacity-70" />
                <div className="max-w-7xl mx-auto px-4 md:px-6 py-10">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                        {/* Main content (full width) */}
                        <div className="md:col-span-12 lg:col-span-12">
                            <div className="max-w-full">
                                <h2 className="text-3xl md:text-4xl font-extrabold leading-tight tracking-tight">Your scheduled posts</h2>
                                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Manage scheduled and posted content from here.</p>
                                <div className="mt-6">
                                    {/* Composer */}
                                    <div className="p-4 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-white/30 dark:border-slate-800 shadow mb-6">
                                        <h4 className="text-sm font-medium">Create a new post</h4>
                                        <p className="text-xs text-slate-500">Write your content, pick a date & time, then schedule.</p>

                                        <div className="mt-3 space-y-3">
                                            <Label htmlFor="post-content" className="text-sm font-medium">Compose</Label>
                                            <Textarea
                                                id="post-content"
                                                placeholder="What's happening?"
                                                value={postContent}
                                                onChange={(e) => setPostContent(e.target.value)}
                                                className="min-h-[100px] resize-none text-sm border border-slate-200 dark:border-slate-700 rounded-lg p-3"
                                                maxLength={280}
                                            />
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="flex items-center gap-2">
                                                    <DropdownMenu open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="outline" size="sm" className="h-9">
                                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                                {selectedDate ? formatDate(selectedDate) : "Date"}
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent className="w-auto p-0" align="start">
                                                            <Calendar
                                                                mode="single"
                                                                selected={selectedDate}
                                                                onSelect={(date) => {
                                                                    setSelectedDate(date);
                                                                    setIsCalendarOpen(false);
                                                                }}
                                                                disabled={(date) => date < new Date()}
                                                                initialFocus
                                                            />
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>

                                                    <DropdownMenu open={isTimeOpen} onOpenChange={setIsTimeOpen}>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="outline" size="sm" className="h-9">
                                                                <ClockIcon className="mr-2 h-4 w-4" />
                                                                {selectedTime || "Time"}
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent className="w-auto max-h-48 overflow-y-auto">
                                                            {timeOptions.map((time) => (
                                                                <DropdownMenuItem
                                                                    key={time}
                                                                    onClick={() => {
                                                                        setSelectedTime(time);
                                                                        setIsTimeOpen(false);
                                                                    }}
                                                                    className="text-sm"
                                                                >
                                                                    {time}
                                                                </DropdownMenuItem>
                                                            ))}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    <div className="text-xs text-slate-500">{getCharacterCount()}/280</div>
                                                    <Button
                                                        onClick={handleSchedulePost}
                                                        disabled={isScheduling || !postContent.trim() || !selectedDate || !selectedTime || getCharacterCount() > 280}
                                                        className="h-9 text-sm bg-gradient-to-r from-indigo-600 to-sky-500 text-white"
                                                    >
                                                        <SendIcon className="mr-2 h-4 w-4" />
                                                        {isScheduling ? 'Scheduling...' : 'Schedule'}
                                                    </Button>
                                                </div>
                                            </div>
                                            {scheduleError && (
                                                <p className="mt-2 text-sm text-red-500">{scheduleError}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Posts list */}
                                    <div>
                                        <div className="flex items-center justify-between mb-4">
                                            <div>
                                                <h3 className="text-sm font-semibold">All posts</h3>
                                                <p className="text-xs text-slate-500">Filter and manage your scheduled content</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button variant="ghost" size="sm">Filter</Button>
                                                <Button variant="ghost" size="sm">Sort</Button>
                                            </div>
                                        </div>

                                        <PostsTabs
                                            activeTab={activeTab}
                                            setActiveTab={setActiveTab}
                                            scheduledPosts={scheduledPosts.filter((p) => p.content.toLowerCase().includes(search.toLowerCase()))}
                                            postedContent={postedContent.filter((p) => p.content.toLowerCase().includes(search.toLowerCase()))}
                                            onPostNow={handlePostNow}
                                            onDelete={handleDelete}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}
