import { TwitterApi } from "twitter-api-v2";
import userRepo from "@/db/repos/user";
import { isTokenExpired, refreshUserToken } from "@/utils/token-refresh";

export type PostResult = {
	success: boolean;
	xPostId?: string | null;
	error?: string;
	unrecoverable?: boolean; // e.g. unauthorized / invalid token
};

/**
 * Post content to X on behalf of a user.
 * Manages token refresh and retries for transient failures.
 */
export async function postToXForUser(userIdOrObj: string | unknown, content: string): Promise<PostResult> {
	// Resolve user record if caller passed ID
	let user: unknown = typeof userIdOrObj === "string" ? await userRepo.getUserById(userIdOrObj) : userIdOrObj;
	if (!user) return { success: false, error: "user_not_found", unrecoverable: true };

	// Extract access token and expiry in a typesafe-ish way
	const getUserField = <T = unknown>(key: string) =>
		(user as unknown as Record<string, unknown>)[key] as T | undefined;
	let accessToken = getUserField<string>("access_token");

	// Refresh token if missing/expired
	if (!accessToken || isTokenExpired(getUserField<Date | string | number | undefined>("expiresIn"))) {
		try {
			const userIdStr = getUserField<{ toString?: () => string }>("_id")?.toString?.();
			if (!userIdStr) return { success: false, error: "no_user_id_for_refresh", unrecoverable: true };
			const refreshed = await refreshUserToken(userIdStr);
			if (!refreshed.success || !refreshed.accessToken) {
				return { success: false, error: "token_refresh_failed", unrecoverable: true };
			}
			accessToken = refreshed.accessToken;
			// reload user so callers later can get updated tokens if desired
			user = await userRepo.getUserById(userIdStr);
		} catch (err: unknown) {
			return { success: false, error: err instanceof Error ? err.message : String(err) };
		}
	}

	if (!accessToken) return { success: false, error: "no_access_token", unrecoverable: true };

	// Helper to create client per attempt
	const makeClient = () =>
		new TwitterApi({
			appKey: process.env.CLIENT_ID as string,
			appSecret: process.env.CLIENT_SECRET as string,
			accessToken,
		}).readWrite;

	// Retry policy for transient errors
	const maxAttempts = 3;
	let attempt = 0;
	let lastError: unknown = null;

	while (attempt < maxAttempts) {
		attempt += 1;
		try {
			const client = makeClient();
			const res = await client.v2.tweet(content);
			const id = res.data && (res.data as unknown as { id?: string }).id;
			return { success: true, xPostId: id || null };
		} catch (err: unknown) {
			lastError = err;
			const message = err instanceof Error ? err.message : String(err);
			const m = message.toLowerCase();
			if (m.includes("unauthorized") || m.includes("forbidden") || m.includes("invalid")) {
				return { success: false, error: message, unrecoverable: true };
			}

			// Rate limit/backoff: inspect possible headers or rate info on error
			try {
				const errObj = err as unknown as Record<string, unknown>;
				const headers = errObj["headers"] as Record<string, unknown> | undefined;
				const rateLimit = errObj["rateLimit"] as Record<string, unknown> | undefined;
				const retryAfter =
					(headers && (headers["retry-after"] as unknown)) || (rateLimit && (rateLimit["reset"] as unknown));
				const waitMs = retryAfter ? Math.max(1000, Number(retryAfter) * 1000) : 500 * attempt;
				await new Promise((r) => setTimeout(r, waitMs));
			} catch {}
			// loop to retry
		}
	}

	return { success: false, error: lastError instanceof Error ? lastError.message : String(lastError) };
}

export default postToXForUser;
