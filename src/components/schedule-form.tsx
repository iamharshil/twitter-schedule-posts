"use client";

import type React from "react";

import { useState } from "react";
import { toast } from "sonner";
import TimePicker from "@/components/TimePicker";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export function ScheduleForm() {
	const [content, setContent] = useState("");
	const [date, setDate] = useState<Date | null>(null);
	const [time, setTime] = useState<string>("");
	const [loading, setLoading] = useState<boolean>(false);

	const canSubmit = content.trim().length > 0 && date && time;
	const normalizedMin = new Date();
	normalizedMin.setHours(0, 0, 0, 0);

	const onSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!canSubmit) return;
		setLoading(true);

		try {
			await fetch("/api/posts/schedule", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
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
			})
				.then((res) => res.json())
				.then((data) => {
					if (data.success) {
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
					<Calendar
						className="p-0"
						selected={date ?? undefined}
						mode="single"
						onSelect={(d) => {
							if (!d) return;
							setDate(d as Date);
						}}
						disabled={(dateArg: Date) => dateArg < normalizedMin}
					/>
				</div>
				<div>
					<TimePicker
						value={time || undefined}
						onChange={(t) => setTime(t)}
						onClear={() => {
							setTime("");
							setDate(null);
						}}
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
