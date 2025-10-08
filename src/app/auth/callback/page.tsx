"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
export default function AuthCallbackPage() {
	const router = useRouter();

	useEffect(() => {
		(async () => {
			const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

			const urlParams = new URLSearchParams(window.location.search);
			const error = urlParams.get("error");
			if (error) {
				console.debug("error", error);
				return;
			}
			const code = urlParams.get("code");
			const state = urlParams.get("state");

			console.debug("urlParams", urlParams);
			console.debug("code", code);
			console.debug("state", state);

			if (code && state) {
				const res = await fetch(`/api/auth/callback?code=${code}&state=${state}&timezone=${timezone}`);
				const response = await res.json();
				if (response?.success) {
					router.push("/");
				} else {
					toast.error(response.message);
				}
			}
		})();
	}, [router]);

	return (
		<div className="h-screen w-screen flex justify-center items-center">
			<p className="text-muted-foreground">Please wait...</p>
		</div>
	);
}
