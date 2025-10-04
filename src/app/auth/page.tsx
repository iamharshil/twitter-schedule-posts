"use client";

import { redirect } from "next/navigation";
import { useEffect } from "react";


export default function AuthPage() {

    useEffect(() => {
        (async () => {
            const res = await fetch("/api/auth/generate-callback");
            const response = await res.json();
            console.log("response", response);
            if (response?.success) {
                return redirect(response.data.url);
            }
        })()
    }, []);
    return (
        <div className="h-screen w-screen flex justify-center items-center">
            <p className="text-muted-foreground">Redirecting to x.com please wait</p>
        </div>
    )
}