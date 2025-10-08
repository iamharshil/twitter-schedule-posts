import { NextResponse } from "next/server";
import postRepo from "@/db/repos/post";
import { createTokenValidationResponse, validateAndRefreshToken } from "@/utils/token-validation";

export const GET = async () => {
	try {
		// Validate and refresh token if needed
		const tokenValidation = await validateAndRefreshToken();

		if (!tokenValidation.isValid) {
			return createTokenValidationResponse(tokenValidation.error || "Token validation failed");
		}

		if (!tokenValidation.user?.id) {
			return NextResponse.json(
				{ success: false, message: "Something went wrong, please try again!" },
				{ status: 400 },
			);
		}

		const posts = await postRepo.getPostsByUserId(tokenValidation.user.id);

		return NextResponse.json({ success: true, data: posts }, { status: 200 });
	} catch (error) {
		console.error("error:", error);
		return NextResponse.json({ success: false, message: "Internal server error!" }, { status: 500 });
	}
};
