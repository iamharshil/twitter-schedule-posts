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
import { validateAndRefreshToken } from "@/utils/token-validation";

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
		const end = new Date(now.getTime() + TOLERANCE_MINUTES * 60 * 1000);

		const pending = await postRepo.getScheduledPosts();
		console.log("pending", pending);

		const toProcess = (pending || []).filter((p: IPost & { userId?: IUser | string }) => {
			const scheduled = new Date(p.scheduledFor as unknown as string);
			return scheduled <= end;
		});
		if (toProcess.length === 0) {
			console.debug("cron: no posts to process in the window", { end });
			return NextResponse.json({ success: true, message: "No posts to process", data: { total: 0 } });
		}

		await connectDB();
		const users = new Map();
		// Process posts sequentially so token refresh + DB updates are consistent per user
		for (const p of toProcess) {
			try {
				const userId = p.userId?._id as string;
				let user = users.get(userId);
				if (!user) {
					user = await User.findById(userId).select("+access_token +refresh_token +expiresAt");
					if (!user) {
						console.error("[cron-webhook] user not found for post:", p._id);
						p.status = "failed";
						await p.save();
						continue;
					}
					users.set(userId, user);
				}

				// Validate access token locally. If missing or expired (with a small buffer), attempt refresh.
				const now = Date.now();
				const expiresAt = user.expiresAt ? new Date(user.expiresAt).getTime() : 0;
				const TOKEN_BUFFER_MS = 60 * 1000; // 1 minute buffer
				let hasValidAccessToken = !!user.access_token && expiresAt - now > TOKEN_BUFFER_MS;

				if (!hasValidAccessToken) {
					// Try refresh if refresh_token exists
					if (!user.refresh_token) {
						console.error("[cron-webhook] no refresh_token for user:", userId);
						p.status = "failed";
						await p.save();
						continue;
					}

					if (!process.env.CLIENT_ID || !process.env.CLIENT_SECRET) {
						console.error("[cron-webhook] missing CLIENT_ID/SECRET env vars; cannot refresh token");
						p.status = "failed";
						await p.save();
						continue;
					}

					try {
						// Use OAuth2 client to refresh user token
						const oauthClient = new TwitterApi({
							clientId: process.env.CLIENT_ID,
							clientSecret: process.env.CLIENT_SECRET,
						});
						const refreshed = await oauthClient.refreshOAuth2Token(user.refresh_token as string);

						// Update user tokens and expiry
						user.access_token = refreshed.accessToken;
						user.refresh_token = refreshed.refreshToken ?? user.refresh_token;
						if (refreshed.expiresIn) {
							user.expiresAt = new Date(Date.now() + refreshed.expiresIn * 1000);
						}
						await user.save();
						users.set(userId, user);
						hasValidAccessToken = true;
						console.debug("[cron-webhook] refreshed token for user:", userId);
					} catch (err) {
						console.error("[cron-webhook] token refresh failed for user:", userId, err);
						p.status = "failed";
						await p.save();
						continue;
					}
				}

				// At this point we should have a valid access token
				if (!hasValidAccessToken || !user.access_token) {
					console.error("[cron-webhook] invalid access token (post failed) for user:", userId);
					p.status = "failed";
					await p.save();
					continue;
				}

				const client = new TwitterApi(user.access_token as string);
				const { data } = await client.v2.tweet(p.content);
				if (data?.id) {
					p.status = "posted";
					p.xPostId = data.id;
					await p.save();
					console.debug("[cron-webhook] post saved with status posted and xPostId:", data.id);
				} else {
					console.error("[cron-webhook] tweet failed, no id in response data");
					console.error(data);
					console.error("[error-user]", userId);
					console.error("[error-post]", p._id);
					p.status = "failed";
					await p.save();
					console.debug("[cron-webhook] post save failed, marked as failed");
				}
			} catch (err) {
				console.error("[cron-webhook] error processing post", p._id, err);
				try {
					p.status = "failed";
					await p.save();
				} catch (saveErr) {
					console.error("[cron-webhook] failed to mark post failed", p._id, saveErr);
				}
			}
		}

		console.debug(`cron: ${toProcess.length} posts to process in the window`, { end });

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
