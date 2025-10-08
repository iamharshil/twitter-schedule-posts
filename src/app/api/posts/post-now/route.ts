import { NextResponse } from "next/server";
import postRepo from "@/db/repos/post";
import { createTokenValidationResponse, validateAndRefreshToken } from "@/utils/token-validation";

export const POST = async (req: Request) => {
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

		// ensure post belongs to user
		const post = await postRepo.getPostById(id);
		if (!post) return NextResponse.json({ success: false, message: "Post not found" }, { status: 404 });
		if (post.userId.toString() !== tokenValidation.user.id)
			return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });

		// For now, mark as posted. In a production system we'd call the external API and store xPostId.
		await postRepo.updatePostStatus(id, "posted");

		const posts = await postRepo.getPostsByUserId(tokenValidation.user.id);
		return NextResponse.json({ success: true, data: posts });
	} catch (err) {
		console.error("post-now error", err);
		return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
	}
};
