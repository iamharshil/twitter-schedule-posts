export async function withTiming<T>(label: string, fn: () => Promise<T>) {
	const start = Date.now();
	try {
		const res = await fn();
		const ms = Date.now() - start;
		try {
			console.debug(`[serverTiming] ${label} -> ${ms}ms`);
		} catch {}
		return res;
	} catch (e) {
		const ms = Date.now() - start;
		try {
			console.debug(`[serverTiming] ${label} -> ${ms}ms (error)`);
		} catch {}
		throw e;
	}
}
