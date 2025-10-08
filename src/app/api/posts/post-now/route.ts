import { NextResponse } from "next/server";
import postRepo from "@/db/repos/post";
import { postToXForUser } from "@/lib/postToX";
import { withTiming } from "@/lib/serverTiming";
import { createTokenValidationResponse, validateAndRefreshToken } from "@/utils/token-validation";

export const POST = async (req: Request) => {
	return withTiming("POST /api/posts/post-now", async () => {
		try {
			const { id } = await req.json();
			console.debug("[post-now] received body id:", id);

			// Validate and refresh token if needed
			const tokenValidation = await validateAndRefreshToken();
			console.debug("[post-now] tokenValidation:", {
				isValid: tokenValidation.isValid,
				err: tokenValidation.error,
				needsRefresh: tokenValidation.needsRefresh,
				userId: tokenValidation.user?.id,
				userXId: tokenValidation.user?.xId,
			});

			if (!tokenValidation.isValid) {
				return createTokenValidationResponse(tokenValidation.error || "Token validation failed");
			}

			if (!tokenValidation.user?.id) {
				console.error("[post-now] no user id after token validation", tokenValidation);
				return NextResponse.json({ success: false, message: "User not found" }, { status: 401 });
			}

			if (!id) return NextResponse.json({ success: false, message: "Missing post id" }, { status: 400 });

			// ensure post belongs to user
			const post = await postRepo.getPostById(id);
			console.debug(
				"[post-now] fetched post:",
				post ? { id: post._id, userId: post.userId, status: post.status } : null,
			);
			if (!post) return NextResponse.json({ success: false, message: "Post not found" }, { status: 404 });
			if (post.userId.toString() !== tokenValidation.user.id)
				return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });

			// Call shared poster which handles token refresh & retries
			// Pass the session user object (may contain fresh tokens) instead of just the id
			const postResult = await postToXForUser(tokenValidation.user, post.content as string);
			console.debug("[post-now] postToXForUser result:", postResult);

			if (postResult.success) {
				await postRepo.updatePostStatus(id, "posted", postResult.xPostId || undefined);
			} else {
				// Mark failed for now; client can show error and user can retry
				await postRepo.updatePostStatus(id, "failed");
			}

			const posts = await postRepo.getPostsByUserId(tokenValidation.user.id as string);
			return NextResponse.json({ success: postResult.success, data: posts, error: postResult.error });
		} catch (err) {
			console.error("post-now error", err);
			return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
		}
	});
};
