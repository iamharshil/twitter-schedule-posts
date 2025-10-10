import { NextResponse } from "next/server";
import { TwitterApi } from "twitter-api-v2";
// import { postToXForUser } from "@/lib/postToX";
import { withTiming } from "@/lib/serverTiming";
import Post from "@/models/posts.model";
import User from "@/models/user.model";
import connectDB from "@/utils/database";

export const POST = async (req: Request) => {
	return withTiming("POST /api/posts/post-now", async () => {
		try {
			const { id } = await req.json();
			console.debug("[post-now] received body id:", id);

			if (!id) {
				return NextResponse.json({ success: false, message: "Missing post id" }, { status: 400 });
			}

			await connectDB();
			const post = await Post.findById(id);
			if (!post) {
				return NextResponse.json({ success: false, message: "Post not found" }, { status: 404 });
			}

			const auther = await User.findById(post.userId).select("+access_token +refresh_token +expiresAt");
			if (!auther) {
				return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
			}

			// validate tokens using function validateAndRefreshToken

			// check post status and if posted, return error
			if (post.status === "posted") {
				return NextResponse.json({ success: false, message: "Post is already posted" }, { status: 400 });
			}

			console.debug("[post-now] auther with tokens:", {
				id: auther._id,
				xId: auther.xId,
				expiresAt: auther.expiresAt,
				accessToken: !!auther.access_token,
				refreshToken: !!auther.refresh_token,
			});
			// post to x
			const client = new TwitterApi(auther.access_token as string);
			console.debug("[post-now] posting tweet:", post.content);

			const { data } = await client.v2.tweet(post.content);
			console.debug("[post-now] tweet response data:", data);

			if (data?.id) {
				// update post status to posted
				post.status = "posted";
				post.xPostId = data.id;
				await post.save();
				console.debug("[post-now] post saved with status posted and xPostId:", data.id);
				return NextResponse.json({ success: true, data: post });
			} else {
				// update post status to failed
				post.status = "failed";
				await post.save();
				console.error("[post-now] tweet failed, no id in response data");
				return NextResponse.json({ success: false, message: "Failed to post to X" }, { status: 500 });
			}
		} catch (err) {
			console.error("post-now error", err);
			return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
		}
	});
};
