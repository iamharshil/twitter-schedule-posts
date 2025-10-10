import { NextResponse } from "next/server";
import { TwitterApi } from "twitter-api-v2";
import postRepo from "@/db/repos/post";
import userRepo from "@/db/repos/user";
import { postToXForUser } from "@/lib/postToX";
import { withTiming } from "@/lib/serverTiming";
import type { IPost } from "@/models/posts.model";
import type { IUser } from "@/models/user.model";
import User from "@/models/user.model";
import connectDB from "@/utils/database";

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
		const now = new Date();
		const start = new Date(now.getTime() - TOLERANCE_MINUTES * 60 * 1000);
		const end = new Date(now.getTime() + TOLERANCE_MINUTES * 60 * 1000);

		const pending = await postRepo.getScheduledPosts();

		const toProcess = (pending || []).filter((p: IPost & { userId?: IUser | string }) => {
			const scheduled = new Date(p.scheduledFor as unknown as string);
			return scheduled >= start && scheduled <= end;
		});
		if (toProcess.length === 0) {
			console.debug("cron: no posts to process in the window", { start, end });
			return NextResponse.json({ success: true, message: "No posts to process", data: { total: 0 } });
		}

		await connectDB();
		const users = new Map();
		toProcess.forEach(async (p) => {
			let user = users.get(p.userId?._id as string);
			if (!user) {
				user = await User.findById(p.userId?._id).select("+access_token +refresh_token +expiresAt");
				await users.set(p.userId?._id as string, user);
			}

			const client = new TwitterApi(user?.access_token as string);
			const { data } = await client.v2.tweet(p.content);
			if (data?.id) {
				// update post status to posted
				p.status = "posted";
				p.xPostId = data.id;
				await p.save();
				console.debug("[cron-webhook] post saved with status posted and xPostId:", data.id);
			} else {
				console.error("[cron-webhook] tweet failed, no id in response data");
				console.error(data);
				console.error("[error-user]", user);
				console.error("[error-post]", p);
				// update post status to failed
				p.status = "failed";
				await p.save();
				console.debug("[cron-webhook] post save failed, marked as failed");
			}
		});

		console.debug(`cron: ${toProcess.length} posts to process in the window`, { start, end });

		return NextResponse.json({
			success: true,
			message: "Posts processed",
			data: { total: toProcess.length },
		});
	} catch (error) {
		console.error("cron-webhook error:", error);
		return NextResponse.json({ success: false, message: "Internal server error!" }, { status: 500 });
	}
};
