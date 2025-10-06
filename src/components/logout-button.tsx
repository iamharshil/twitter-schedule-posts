"use client"

import { LogOut } from "lucide-react"
import { toast } from "sonner";
import { Button } from "@/components/ui/button"

export function LogoutButton() {
    const onLogout = async () => {
        toast("You have been logged out successfully.")
    }

    return (
        <Button variant="secondary" onClick={onLogout}>
            <LogOut className="mr-2 size-4" />
            Logout
        </Button>
    )
}
