"use client"

import { LogOut } from "lucide-react"
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button"

export function LogoutButton() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const onLogout = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/auth/logout");
            const data = await res.json();

            if (data?.success) {
                toast.success("Logged out successfully");
                router.push("/auth");
            } else {
                toast.error(data?.message || "Failed to logout");
            }
        } catch (_) {
            toast.error("Failed to logout");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Button variant="secondary" onClick={onLogout} disabled={loading}>
            {loading ? (
                <span className="flex items-center mx-6">
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true"></span>
                </span>
            ) : (
                <>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                </>
            )}
        </Button>
    )
}
