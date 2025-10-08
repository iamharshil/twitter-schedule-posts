import { NextResponse } from "next/server";
import { session } from "./session";
import { calculateExpiresAt, isTokenExpired, refreshUserToken } from "./token-refresh";

export interface TokenValidationResult {
	isValid: boolean;
	user?: {
		id?: string;
		xId?: string;
		isAuthed?: boolean;
		timezone?: string;
		accessToken?: string;
		refreshToken?: string;
		expiresIn?: number;
		expiresAt?: Date;
		createdAt?: Date;
		updatedAt?: Date;
	};
	needsRefresh?: boolean;
	error?: string;
}

export async function validateAndRefreshToken(): Promise<TokenValidationResult> {
	try {
		const sessionData = await session.get();

		if (!sessionData?.user?.isAuthed) {
			return { isValid: false, error: "User not authenticated" };
		}

		const user = sessionData.user;

		// If we have expiresAt in session, use it
		if (user.expiresAt) {
			if (isTokenExpired(user.expiresAt)) {
				console.debug("Token expired, attempting refresh...");
				if (!user.id) {
					return { isValid: false, error: "User ID not found in session" };
				}
				const refreshResult = await refreshUserToken(user.id);

				if (!refreshResult.success) {
					return {
						isValid: false,
						error: `Token refresh failed: ${refreshResult.error}`,
						needsRefresh: true,
					};
				}

				// Return updated user data
				return {
					isValid: true,
					user: { ...user, ...refreshResult },
					needsRefresh: true,
				};
			}

			return { isValid: true, user };
		}

		// If we only have expiresIn (legacy), calculate expiresAt
		if (user.expiresIn) {
			const expiresAt = calculateExpiresAt(user.expiresIn);

			if (isTokenExpired(expiresAt)) {
				console.debug("Token expired (calculated), attempting refresh...");
				if (!user.id) {
					return { isValid: false, error: "User ID not found in session" };
				}
				const refreshResult = await refreshUserToken(user.id);

				if (!refreshResult.success) {
					return {
						isValid: false,
						error: `Token refresh failed: ${refreshResult.error}`,
						needsRefresh: true,
					};
				}

				return {
					isValid: true,
					user: { ...user, ...refreshResult },
					needsRefresh: true,
				};
			}

			// Update session with calculated expiresAt for future use
			user.expiresAt = expiresAt;
			await session.save();

			return { isValid: true, user };
		}

		// No expiration info available, assume valid but log warning
		console.warn("No token expiration info available in session");
		return { isValid: true, user };
	} catch (error) {
		console.error("Token validation error:", error);
		return {
			isValid: false,
			error: error instanceof Error ? error.message : "Unknown error during token validation",
		};
	}
}

export function createTokenValidationResponse(error: string, status: number = 401) {
	return NextResponse.json({ success: false, message: error }, { status });
}
