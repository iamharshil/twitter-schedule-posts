import { NextResponse } from "next/server";
import postRepo from "@/db/repos/post";
import userRepo from "@/db/repos/user";
import { postToXForUser } from "@/lib/postToX";
import { withTiming } from "@/lib/serverTiming";
import type { IPost } from "@/models/posts.model";
import type { IUser } from "@/models/user.model";

type CronResult = {
	total: number;
	posted: number;
	failed: number;
	errors: Array<{ id: string; reason: string }>;
};

// posting logic moved to `src/lib/postToX.ts`

// We'll consider a small tolerance window to account for cron jitter (in minutes)
const TOLERANCE_MINUTES = 2;

export const GET = async (req: Request) => {
	try {
		const token = req.headers.get("Authorization")?.split(" ")[1];
		if (token !== process.env.API_KEY) {
			return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
		}

		return await withTiming("cron-webhook", async () => {
			// Determine UTC window: now - tolerance -> now + tolerance
			const now = new Date();
			const start = new Date(now.getTime() - TOLERANCE_MINUTES * 60 * 1000);
			const end = new Date(now.getTime() + TOLERANCE_MINUTES * 60 * 1000);

			// Fetch pending posts that are scheduled up to 'end'
			// Note: postRepo.getPendingPosts currently uses $lte new Date(), so we'll fetch all pending and filter
			const pending = await postRepo.getPendingPosts();

			const toProcess = (pending || []).filter((p: IPost & { userId?: IUser | string }) => {
				const scheduled = new Date(p.scheduledFor as unknown as string);
				return scheduled >= start && scheduled <= end;
			});

			const result: CronResult = { total: toProcess.length, posted: 0, failed: 0, errors: [] };

			function getObjectIdString(obj: unknown): string | undefined {
				if (!obj) return undefined;
				const maybe = obj as { _id?: { toString?: () => string } | string };
				if (typeof maybe._id === "string") return maybe._id;
				if (maybe._id && typeof maybe._id.toString === "function") return maybe._id.toString();
				return undefined;
			}

			for (const p of toProcess) {
				try {
					const userIdStr = typeof p.userId === "string" ? p.userId : getObjectIdString(p.userId);
					const user = (p.userId as IUser) || (userIdStr ? await userRepo.getUserById(userIdStr) : null);
					if (!user) throw new Error("User not found");

					const res = await postToXForUser(user, p.content as unknown as string);
					const xPostId = res.success ? res.xPostId : undefined;
					const pid = getObjectIdString(p) || "";
					await postRepo.updatePostStatus(pid, "posted", xPostId || undefined);
					result.posted += 1;
				} catch (err) {
					const reason = err instanceof Error ? err.message : String(err);
					const pid = getObjectIdString(p) || "";
					console.error("cron: failed to post", pid, reason);
					await postRepo.updatePostStatus(pid, "failed");
					result.failed += 1;
					result.errors.push({ id: pid, reason });
				}
			}

			return NextResponse.json({ success: true, result }, { status: 200 });
		});
	} catch (error) {
		console.error("cron-webhook error:", error);
		return NextResponse.json({ success: false, message: "Internal server error!" }, { status: 500 });
	}
};
