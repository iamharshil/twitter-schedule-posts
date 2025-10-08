export async function fetchWithTiming(input: RequestInfo, init?: RequestInit) {
	const start = performance.now();
	const res = await fetch(input, init);
	const end = performance.now();
	try {
		const path = typeof input === "string" ? input : input instanceof Request ? input.url : String(input);
		// use debug-level log for timing so it's easy to filter out in production
		console.debug(`[fetchWithTiming] ${path} -> ${Math.round(end - start)}ms`);
	} catch {}
	return res;
}

export async function fetchJsonWithTiming(input: RequestInfo, init?: RequestInit) {
	const res = await fetchWithTiming(input, init);
	try {
		return await res.json();
	} catch {
		return null;
	}
}
