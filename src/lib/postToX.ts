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
	// Resolve user record if caller passed ID; otherwise accept session-style user object
	let user: unknown = typeof userIdOrObj === "string" ? await userRepo.getUserById(userIdOrObj) : userIdOrObj;
	console.log("⚡️ ~ postToX.ts:19 ~ postToXForUser ~ user:", user);
	if (!user) return { success: false, error: "user_not_found", unrecoverable: true };

	// Helper to read either DB-style (snake_case) or session-style (camelCase) fields
	const getUserField = <T = unknown>(...keys: string[]) => {
		const rec = user as unknown as Record<string, unknown>;
		for (const k of keys) {
			if (rec[k] !== undefined) return rec[k] as T;
		}
		return undefined as T | undefined;
	};
	console.log("⚡️ ~ postToX.ts:30 ~ getUserField ~ getUserField:", getUserField);

	// Prefer session/camelCase tokens if present, otherwise DB snake_case
	let accessToken = getUserField<string>("accessToken", "access_token");
	console.log("⚡️ ~ postToX.ts:34 ~ postToXForUser ~ accessToken:", accessToken);
	let refreshToken = getUserField<string>("refreshToken", "refresh_token");
	console.log("⚡️ ~ postToX.ts:36 ~ postToXForUser ~ refreshToken:", refreshToken);
	const userIdStr = getUserField<string>("id", "_id")?.toString?.();
	console.log("⚡️ ~ postToX.ts:38 ~ postToXForUser ~ userIdStr:", userIdStr);

	console.debug("[postToX] posting for user:", {
		_id: userIdStr,
		xId: getUserField<string>("xId"),
		expiresIn: getUserField<unknown>("expiresIn", "expiresAt"),
	});

	// Refresh token if missing/expired
	const expiresField = getUserField<Date | string | number | undefined>("expiresAt", "expiresIn");
	if (!accessToken || isTokenExpired(expiresField)) {
		try {
			if (!userIdStr && !refreshToken) {
				return { success: false, error: "no_user_id_for_refresh", unrecoverable: true };
			}

			console.debug(
				"[postToX] access token missing/expired, attempting refresh for userId",
				userIdStr || "(no id, will attempt with session refresh token)",
			);

			// If we have a refresh token from session object, try inline refresh flow using Twitter client
			if (refreshToken) {
				try {
					const client = new TwitterApi({
						clientId: process.env.CLIENT_ID as string,
						clientSecret: process.env.CLIENT_SECRET as string,
					});
					const refreshedToken = await client.refreshOAuth2Token(refreshToken as string);
					accessToken = refreshedToken.accessToken;
					refreshToken = refreshedToken.refreshToken || refreshToken;
					console.debug("[postToX] refreshed via session refresh token");

					// If we have a DB user id, persist refreshed tokens
					if (userIdStr) {
						try {
							const expiresAt = refreshedToken.expiresIn
								? new Date(Date.now() + refreshedToken.expiresIn * 1000)
								: undefined;
							await userRepo.updateUser(userIdStr, {
								access_token: refreshedToken.accessToken,
								refresh_token: refreshedToken.refreshToken || refreshToken,
								expiresIn: expiresAt,
							});
							// reload user so callers can get updated values
							user = await userRepo.getUserById(userIdStr);
						} catch (e) {
							console.error("[postToX] failed to persist refreshed tokens:", e);
						}
					}
				} catch (e) {
					console.error("[postToX] inline refresh via session token failed:", e);
				}
			}

			// If we still don't have tokens and we have a userId, use canonical refresh path that updates DB
			if ((!accessToken || !refreshToken) && userIdStr) {
				const refreshed = await refreshUserToken(userIdStr);
				console.debug("[postToX] refresh result:", { success: refreshed.success, error: refreshed.error });
				if (!refreshed.success || !refreshed.accessToken) {
					return { success: false, error: "token_refresh_failed", unrecoverable: true };
				}
				accessToken = refreshed.accessToken;
				// reload user so callers later can get updated tokens if desired
				user = await userRepo.getUserById(userIdStr);
				// update local refreshToken variable from reloaded user
				refreshToken = getUserField<string>("refreshToken", "refresh_token");
			}
		} catch (err: unknown) {
			console.error("[postToX] token refresh exception:", err);
			return { success: false, error: err instanceof Error ? err.message : String(err) };
		}
	}

	if (!accessToken) return { success: false, error: "no_access_token", unrecoverable: true };

	// Helper to create client per attempt
	const makeClient = () =>
		// cast to unknown as any to avoid TypeScript constructor overload issues; runtime expects these fields for OAuth2
		(
			new (TwitterApi as unknown as any)({
				clientId: process.env.CLIENT_ID as string,
				clientSecret: process.env.CLIENT_SECRET as string,
				accessToken,
				refreshToken: refreshToken as string | undefined,
			} as unknown as any) as unknown as any
		).readWrite;

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
			console.error("[postToX] tweet attempt failed:", { attempt, message, err });

			// If the API indicates unsupported authentication, treat as unrecoverable (user must re-auth)
			try {
				const errObj = err as unknown as Record<string, unknown>;
				const data = errObj.data as Record<string, unknown> | undefined;
				const dataType = data && (data.type as string | undefined);
				const dataTitle = data && (data.title as string | undefined);
				if (dataType?.includes("unsupported-authentication") || dataTitle === "Unsupported Authentication") {
					return { success: false, error: String(data?.detail || message), unrecoverable: true };
				}
			} catch {}

			const m = message.toLowerCase();
			if (m.includes("unauthorized") || m.includes("forbidden") || m.includes("invalid")) {
				return { success: false, error: message, unrecoverable: true };
			}

			// Rate limit/backoff: inspect possible headers or rate info on error
			try {
				const errObj = err as unknown as Record<string, unknown>;
				const headers = errObj.headers as Record<string, unknown> | undefined;
				const rateLimit = errObj.rateLimit as Record<string, unknown> | undefined;
				const retryAfter =
					(headers && (headers["retry-after"] as unknown)) || (rateLimit && (rateLimit.reset as unknown));
				const waitMs = retryAfter ? Math.max(1000, Number(retryAfter) * 1000) : 500 * attempt;
				console.debug("[postToX] retrying after ms:", waitMs);
				await new Promise((r) => setTimeout(r, waitMs));
			} catch (e) {
				console.error("[postToX] error computing backoff:", e);
			}
			// loop to retry
		}
	}

	return { success: false, error: lastError instanceof Error ? lastError.message : String(lastError) };
}

export default postToXForUser;
