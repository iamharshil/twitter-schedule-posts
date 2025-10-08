import { TwitterApi } from "twitter-api-v2";
import userRepo from "@/db/repos/user";
import { session } from "./session";

export interface TokenRefreshResult {
	success: boolean;
	accessToken?: string;
	refreshToken?: string;
	expiresIn?: number;
	expiresAt?: Date;
	error?: string;
}

export async function refreshUserToken(userId: string): Promise<TokenRefreshResult> {
	try {
		// Get user from database
		const user = await userRepo.getUserById(userId);
		if (!user || !user.refresh_token) {
			return { success: false, error: "User not found or no refresh token available" };
		}

		// Create Twitter API client for token refresh
		const client = new TwitterApi({
			clientId: process.env.CLIENT_ID as string,
			clientSecret: process.env.CLIENT_SECRET as string,
		});

		// Refresh the token
		const refreshedToken = await client.refreshOAuth2Token(user.refresh_token);

		// Calculate new expiration time
		const expiresAt = new Date(Date.now() + refreshedToken.expiresIn * 1000);

		// Update user in database with new tokens
		await userRepo.updateUser(userId, {
			access_token: refreshedToken.accessToken,
			refresh_token: refreshedToken.refreshToken || user.refresh_token, // Keep old refresh token if new one not provided
			expiresIn: expiresAt,
		});

		// Update session with new token info
		const sessionData = await session.get();
		if (sessionData.user) {
			sessionData.user.accessToken = refreshedToken.accessToken;
			sessionData.user.refreshToken = refreshedToken.refreshToken || user.refresh_token;
			sessionData.user.expiresIn = refreshedToken.expiresIn;
			sessionData.user.expiresAt = expiresAt;
			await session.save();
		}

		return {
			success: true,
			accessToken: refreshedToken.accessToken,
			refreshToken: refreshedToken.refreshToken || user.refresh_token,
			expiresIn: refreshedToken.expiresIn,
			expiresAt,
		};
	} catch (error) {
		console.error("Token refresh failed:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Unknown error during token refresh",
		};
	}
}

export function isTokenExpired(expiresAt: Date | number | string | undefined | null): boolean {
	const now = new Date();

	// Normalize various possible types into a Date object
	let expirationTime: Date | null = null;
	if (!expiresAt) {
		// No expiration info; consider expired so callers will attempt refresh
		return true;
	}

	if (expiresAt instanceof Date) {
		expirationTime = expiresAt;
	} else if (typeof expiresAt === "number") {
		expirationTime = new Date(expiresAt);
	} else if (typeof expiresAt === "string") {
		const parsed = Date.parse(expiresAt);
		if (Number.isNaN(parsed)) {
			// Can't parse string -> treat as expired
			return true;
		}
		expirationTime = new Date(parsed);
	} else {
		// Unknown type -> treat as expired
		return true;
	}

	// If the parsed date is invalid, treat as expired
	if (Number.isNaN(expirationTime.getTime())) return true;

	// Add 5 minute buffer to refresh token before it actually expires
	const bufferTime = 5 * 60 * 1000; // 5 minutes in milliseconds
	return now.getTime() >= expirationTime.getTime() - bufferTime;
}

export function calculateExpiresAt(expiresIn: number): Date {
	return new Date(Date.now() + expiresIn * 1000);
}
