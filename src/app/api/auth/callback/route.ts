import { DateTime } from "luxon";
import { type NextRequest, NextResponse } from "next/server";
import { TwitterApi } from "twitter-api-v2";
import userRepo from "@/db/repos/user";
import { session } from "@/utils/session";
import { calculateExpiresAt } from "@/utils/token-refresh";

export const GET = async (request: NextRequest) => {
	try {
		const query = request.nextUrl.searchParams;
		const code = query.get("code");
		const state = query.get("state");
		const timezone = query.get("timezone");

		const entry = await session.get();
		if (!entry?.oauth?.state || entry?.oauth?.state !== state) {
			console.error("Unknown or expired state:", state);
			return NextResponse.json({ success: false, message: "Unknown or expired state!" }, { status: 400 });
		}

		const { codeVerifier } = entry.oauth;
		await session.destroy();

		if (!code || !codeVerifier) {
			return NextResponse.json({ success: false, message: "Unknown or expired state!" }, { status: 400 });
		}

		const isValidTimezone = DateTime.local().setZone(timezone ?? "").isValid;
		if (!isValidTimezone) {
			console.error("Invalid timezone:", timezone);
			return NextResponse.json({ success: false, message: "Invalid timezone!" }, { status: 400 });
		}

		try {
			const client = new TwitterApi({
				clientId: process.env.CLIENT_ID as string,
				clientSecret: process.env.CLIENT_SECRET as string,
			});

			const callback = process.env.CALLBACK_URL as string;
			const token = await client.loginWithOAuth2({
				code,
				codeVerifier,
				redirectUri: callback,
			});

			const authedClient = new TwitterApi(token.accessToken);
			const { data } = await authedClient.v2.me({
				"user.fields": ["id", "name", "username", "profile_image_url"],
			});

			// Calculate expiration time
			const expiresAt = calculateExpiresAt(token.expiresIn);

			// Check if user already exists
			let user = await userRepo.getUserByXId(data.id);

			if (user) {
				// Update existing user
				user = await userRepo.updateUser(user._id.toString(), {
					name: data.name,
					username: data.username,
					profile: data.profile_image_url,
					timezone: timezone as string,
					access_token: token.accessToken,
					refresh_token: token.refreshToken,
					expiresIn: expiresAt,
					scope: token.scope,
				});
			} else {
				// Create new user
				user = await userRepo.createUser({
					xId: data.id,
					name: data.name,
					username: data.username,
					profile: data.profile_image_url,
					timezone: timezone as string,
					access_token: token.accessToken,
					refresh_token: token.refreshToken,
					expiresIn: expiresAt,
					scope: token.scope,
				});
			}

			// Set session with user data including expiresAt
			await session.user({
				id: user._id.toString(),
				xId: user.xId,
				isAuthed: true,
				timezone: user.timezone,
				accessToken: user.access_token,
				refreshToken: user.refresh_token,
				expiresIn: token.expiresIn,
				expiresAt: expiresAt,
				createdAt: user.createdAt,
				updatedAt: user.updatedAt,
			});
			return NextResponse.json({ success: true }, { status: 200 });
		} catch (error) {
			console.error(error);
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("error", error);
		return NextResponse.json({ success: false, message: "Internal server error!" }, { status: 500 });
	}
};
