import { NextResponse } from "next/server";
import postRepo from "@/db/repos/post";
import { withTiming } from "@/lib/serverTiming";
import { createTokenValidationResponse, validateAndRefreshToken } from "@/utils/token-validation";

export const POST = async (req: Request) => {
	return withTiming("POST /api/posts/delete", async () => {
		try {
			const { id } = await req.json();

			// Validate and refresh token if needed
			const tokenValidation = await validateAndRefreshToken();

			if (!tokenValidation.isValid) {
				return createTokenValidationResponse(tokenValidation.error || "Token validation failed");
			}

			if (!tokenValidation.user?.id) {
				return NextResponse.json({ success: false, message: "User not found" }, { status: 401 });
			}

			if (!id) return NextResponse.json({ success: false, message: "Missing post id" }, { status: 400 });

			const post = await postRepo.getPostById(id);
			if (!post) return NextResponse.json({ success: false, message: "Post not found" }, { status: 404 });
			if (post.userId.toString() !== tokenValidation.user.id)
				return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });

			await postRepo.deletePost(id);

			const posts = await postRepo.getPostsByUserId(tokenValidation.user.id);
			return NextResponse.json({ success: true, data: posts });
		} catch (err) {
			console.error("delete post error", err);
			return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
		}
	});
};
