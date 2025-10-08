"use client";

import { TwitterIcon } from "lucide-react";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function AuthPage() {
	const handleClick = async () => {
		const res = await fetch("/api/auth/generate-callback");
		const response = await res.json();
		if (response?.success) {
			return redirect(response.data.url);
		}
	};
	return (
		<div className="h-screen w-screen flex justify-center items-center">
			<Button className="bg-blue-600 text-white hover:bg-blue-700 cursor-pointer" onClick={handleClick}>
				<TwitterIcon />
				Continue with X.com
			</Button>
		</div>
	);
}
