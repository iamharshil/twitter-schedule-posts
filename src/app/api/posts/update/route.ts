import { NextResponse } from "next/server";
import postRepo from "@/db/repos/post";
import { withTiming } from "@/lib/serverTiming";
import { createTokenValidationResponse, validateAndRefreshToken } from "@/utils/token-validation";

export const POST = async (req: Request) => {
	return withTiming("POST /api/posts/update", async () => {
		try {
			const { id, content, scheduledFor } = await req.json();

			const tokenValidation = await validateAndRefreshToken();
			if (!tokenValidation.isValid)
				return createTokenValidationResponse(tokenValidation.error || "Token validation failed");
			if (!tokenValidation.user?.id)
				return NextResponse.json({ success: false, message: "User not found" }, { status: 401 });

			if (!id) return NextResponse.json({ success: false, message: "Missing post id" }, { status: 400 });

			const post = await postRepo.getPostById(id);
			if (!post) return NextResponse.json({ success: false, message: "Post not found" }, { status: 404 });
			if (post.userId.toString() !== tokenValidation.user.id)
				return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });

			const updateData: Record<string, unknown> = {};
			if (typeof content === "string") updateData.content = content;
			if (typeof scheduledFor === "string") updateData.scheduledFor = new Date(scheduledFor);

			await postRepo.updatePost(id, updateData);

			const posts = await postRepo.getPostsByUserId(tokenValidation.user.id);
			return NextResponse.json({ success: true, data: posts });
		} catch (err) {
			console.error("update post error", err);
			return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
		}
	});
};
