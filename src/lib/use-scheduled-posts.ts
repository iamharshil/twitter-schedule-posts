"use client";

import { nanoid } from "nanoid";
import useSWR from "swr";

export type ScheduledPost = {
	id: string;
	content: string;
	scheduledAt: string; // ISO8601
};

const KEY = "scheduled-posts";

function read(): ScheduledPost[] {
	if (typeof window === "undefined") return [];
	try {
		const raw = localStorage.getItem(KEY);
		return raw ? (JSON.parse(raw) as ScheduledPost[]) : [];
	} catch {
		return [];
	}
}

function write(posts: ScheduledPost[]) {
	if (typeof window === "undefined") return;
	localStorage.setItem(KEY, JSON.stringify(posts));
}

export function useScheduledPosts() {
	const { data, mutate } = useSWR<ScheduledPost[]>(KEY, () => read(), {
		fallbackData: [],
		revalidateOnFocus: false,
	});

	const posts = data || [];

	const addPost = (p: Omit<ScheduledPost, "id">) => {
		const next = [{ id: nanoid(), ...p }, ...posts];
		write(next);
		mutate(next, false);
	};

	const deletePost = (id: string) => {
		const next = posts.filter((p) => p.id !== id);
		write(next);
		mutate(next, false);
	};

	const updatePost = (id: string, update: Partial<Omit<ScheduledPost, "id">>) => {
		const next = posts.map((p) => (p.id === id ? { ...p, ...update } : p));
		write(next);
		mutate(next, false);
	};

	return { posts, addPost, deletePost, updatePost };
}
