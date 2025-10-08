import { format } from "date-fns";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// time-select removed; no Select imports

type Props = {
	value?: Date | null;
	onChange: (date: Date) => void;
	placeholder?: string;
	minDate?: Date | null;
};

export default function DateTimePicker({ value, onChange, placeholder, minDate }: Props) {
	const [open, setOpen] = useState(false);
	const selected = value ?? undefined;

	const normalizedMin = minDate ? new Date(minDate) : null;
	if (normalizedMin) normalizedMin.setHours(0, 0, 0, 0);

	function onSelectDate(date: Date | undefined) {
		if (!date) return;
		const result = date; // Only use the date selected
		onChange(result);
		// close on any date pick
		setOpen(false);
	}

	const displayValue = selected ? format(selected, "yyyy-MM-dd") : (placeholder ?? "Select date");

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button variant="outline" className="w-full justify-between" aria-label="Select date and time">
					<span className="text-left truncate">{displayValue}</span>
				</Button>
			</PopoverTrigger>
			<PopoverContent align="start" side="bottom" className="w-[300px] p-2">
				<div className="grid gap-2">
					{/* Calendar: when a date is picked we close the popover */}
					<Calendar
						mode="single"
						selected={selected}
						onSelect={(d) => {
							// Calendar may send Date | undefined
							onSelectDate(d as Date | undefined);
						}}
						initialFocus
						disabled={normalizedMin ? (date: Date) => date < normalizedMin : undefined}
					/>

					<div className="flex items-center justify-end gap-2">
						<Button
							variant="ghost"
							onClick={() => {
								// allow manual close without changing value
								setOpen(false);
							}}
						>
							Close
						</Button>
					</div>
				</div>
			</PopoverContent>
		</Popover>
	);
}
