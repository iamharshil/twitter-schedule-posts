"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { LogoutButton } from "@/components/logout-button";
import TimePicker from "@/components/TimePicker";
import { Button } from "@/components/ui/button";
// Calendar is unused here; DatePicker is used instead
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { fetchJsonWithTiming } from "@/lib/fetchWithTiming";
import { cn } from "@/lib/utils";
import DatePicker from "./DatePicker";
import { ScheduledList } from "./scheduled-list";
import { ModeToggle } from "./toggle-theme";

export default function Page() {
	const [posts, setPosts] = useState([]);
	const [loadingPosts, setLoadingPosts] = useState<boolean>(false);

	const fetchScheduleList = useCallback(async () => {
		setLoadingPosts(true);
		try {
			const data = await fetchJsonWithTiming("/api/posts");
			setPosts(data?.data || []);
		} catch (e) {
			console.error("failed to fetch posts", e);
			setPosts([]);
		} finally {
			setLoadingPosts(false);
		}
	}, []);

	useEffect(() => {
		fetchScheduleList();
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
							<span className="md:hidden">Postly</span>
							<span className="hidden md:inline">Postly</span>
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
						<InlineScheduleForm onRefresh={fetchScheduleList} />
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
							<ScheduledList posts={posts} onRefresh={fetchScheduleList} loading={loadingPosts} />
						</div>
					</Card>
				</div>
			</section>

			<footer className="mx-auto text-center max-w-5xl px-4 pb-8 pt-2 text-xs text-muted-foreground">
				Crafted for creators — responsive, accessible, and fast.
			</footer>
		</main>
	);
}

function InlineScheduleForm({ onRefresh }: { onRefresh?: () => Promise<void> }) {
	const [content, setContent] = useState("");
	const [date, setDate] = useState<Date | null>(null);
	const [time, setTime] = useState<string>("");
	const [loading, setLoading] = useState<boolean>(false);

	const canSubmit = content.trim().length > 0 && date && time;

	const onSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!canSubmit) return;
		setLoading(true);

		try {
			await fetchJsonWithTiming("/api/posts/schedule", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					content: content.trim(),
					scheduledFor: (() => {
						if (!date || !time) return null;
						const [hh, mm] = time.split(":").map(Number);
						const d = new Date(date);
						d.setHours(hh, mm, 0, 0);
						return d.toISOString();
					})(),
				}),
			}).then((data) => {
				if (data?.success) {
					onRefresh?.().catch(() => {});
					return toast.success("Your post has been added to the schedule.");
				} else {
					return toast.error(data?.message || "Failed to schedule post. Please try again.");
				}
			});
		} catch (_) {
			toast.error("Failed to schedule post. Please try again.");
			return;
		} finally {
			setContent("");
			setDate(null);
			setTime("");
			setLoading(false);
		}
	};

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
			<div className="mt-1 grid grid-cols-2 gap-2 items-start">
				<div>
					<DatePicker value={date || null} onChange={(d) => setDate(d)} minDate={new Date()} />
				</div>
				<div>
					<TimePicker
						value={time || undefined}
						onChange={(t) => setTime(t)}
						onClear={() => {
							setTime("");
							setDate(null);
						}}
						minTime={(() => {
							// if date is today, disallow times before now rounded up to next 15min
							if (!date) return null;
							const now = new Date();
							const sel = new Date(date);
							if (sel.toDateString() !== now.toDateString()) return null;
							// round up to next 15 minute
							const mins = now.getMinutes();
							const next = Math.ceil((mins + 1) / 15) * 15;
							const h = now.getHours();
							const mm = next === 60 ? 0 : next;
							const hh = next === 60 ? h + 1 : h;
							return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
						})()}
					/>
				</div>
			</div>

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
							<span
								className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
								aria-hidden="true"
							></span>
							Scheduling...
						</>
					) : (
						"Schedule Post"
					)}
				</Button>
			</div>
		</form>
	);
}
