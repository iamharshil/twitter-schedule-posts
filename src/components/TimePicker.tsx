"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Props = {
	value?: string | null; // format "HH:mm"
	onChange: (time: string) => void;
	placeholder?: string;
	minTime?: string | null; // format "HH:mm" - times before this will be disabled
	onClear?: () => void;
};

function pad(n: number) {
	return n.toString().padStart(2, "0");
}

export default function TimePicker({ value, onChange, placeholder, minTime, onClear }: Props) {
	const timeOptions = useMemo(() => {
		const res: string[] = [];
		for (let h = 0; h < 24; h++) {
			for (const m of [0, 15, 30, 45]) {
				res.push(`${pad(h)}:${pad(m)}`);
			}
		}
		return res;
	}, []);

	return (
		<div className="flex items-center gap-2">
			<Select key={value ?? "__empty__"} value={value ? value : undefined} onValueChange={(v) => onChange(v)}>
				<SelectTrigger className="w-full">
					<SelectValue placeholder={placeholder ?? "Select time"} />
				</SelectTrigger>
				<SelectContent>
					{timeOptions.map((t) => {
						const disabled = !!minTime && t < minTime;
						return (
							<SelectItem key={t} value={t} disabled={disabled}>
								{t}
							</SelectItem>
						);
					})}
				</SelectContent>
			</Select>
			<Button
				variant="secondary"
				className="h-9 px-4 cursor-pointer"
				onClick={() => {
					onChange("");
					if (typeof onClear === "function") onClear();
				}}
			>
				Clear
			</Button>
		</div>
	);
}
