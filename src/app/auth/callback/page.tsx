"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
export default function AuthCallbackPage() {
    const router = useRouter();

    useEffect(() => {
        (async () => {
            const urlParams = new URLSearchParams(window.location.search);
            const error = urlParams.get("error");
            if (error) {
                console.log("error", error);
                return;
            }
            const code = urlParams.get("code");
            const state = urlParams.get("state");

            console.log("urlParams", urlParams);
            console.log("code", code);
            console.log("state", state);

            if (code && state) {
                const res = await fetch(
                    `/api/auth/callback?code=${code}&state=${state}`
                );
                const response = await res.json();
                console.log("response", response);
                if (response?.success) {
                    router.push("/");
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