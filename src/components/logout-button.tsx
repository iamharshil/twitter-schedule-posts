"use client"

import { LogOut } from "lucide-react"
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button"

export function LogoutButton() {
    const router = useRouter();
    const onLogout = async () => {
        await fetch("/api/auth/logout")
            .then((res) => res.json())
            .then((res) => {
                if (res?.success) {
                    toast.success("Logged out successfully");
                    router.push("/auth");
                } else {
                    toast.error(res?.message || "Failed to logout");
                }
            })
    }

    return (
        <Button variant="secondary" onClick={onLogout}>
            <LogOut className="mr-2 size-4" />
            Logout
        </Button>
    )
}
