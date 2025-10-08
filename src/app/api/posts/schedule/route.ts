import { NextResponse } from "next/server";
import postRepo from "@/db/repos/post";
import { validatePost } from "@/lib/validation";
import { createTokenValidationResponse, validateAndRefreshToken } from "@/utils/token-validation";

export const POST = async (req: Request) => {
	try {
		const { content, scheduledFor } = await req.json();

		console.log("Scheduling post:", { content, scheduledFor });

		// Validate and refresh token if needed
		const tokenValidation = await validateAndRefreshToken();

		if (!tokenValidation.isValid) {
			return createTokenValidationResponse(tokenValidation.error || "Token validation failed");
		}

		if (!tokenValidation.user?.id) {
			return NextResponse.json({ success: false, message: "User not found or unauthorized" }, { status: 401 });
		}

		const newPostData = {
			userId: tokenValidation.user.id,
			content,
			status: "pending",
			scheduledFor,
		};

		try {
			validatePost(newPostData);
			console.log("Validated post data:", newPostData);
		} catch {
			return NextResponse.json({ success: false, message: "Invalid post data" }, { status: 400 });
		}

		try {
			await postRepo.createPost(newPostData);
			const scheduledPosts = await postRepo.getPostsByUserId(tokenValidation.user.id);

			console.log("Post scheduled successfully:", scheduledPosts);
			return NextResponse.json({ success: true, message: "Post scheduled successfully!", data: scheduledPosts });
		} catch (error: unknown) {
			// Handle MongoDB duplicate key error
			if (error && typeof error === "object" && "code" in error && error.code === 11000) {
				return NextResponse.json(
					{ success: false, message: "Post with same content already exists for this user" },
					{ status: 400 },
				);
			}
			throw error;
		}
	} catch (error) {
		console.error("error", error);
		return NextResponse.json({
			success: false,
			message: "Internal server error!",
		});
	}
};
