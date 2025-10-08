"use client"

import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type Props = {
    value?: Date | null;
    onChange: (d: Date | null) => void;
    placeholder?: string;
    minDate?: Date | null;
};

export default function DatePicker({ value, onChange, placeholder, minDate }: Props) {
    const [open, setOpen] = useState(false);
    const selected = value ?? undefined;

    const normalizedMin = minDate ? new Date(minDate) : null;
    if (normalizedMin) normalizedMin.setHours(0, 0, 0, 0);

    const display = selected ? format(selected, "PPP") : placeholder ?? "Select date";

    function onSelectDate(date: Date | undefined) {
        if (!date) return;
        onChange(date);
        setOpen(false);
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <div className="relative w-full" aria-hidden>
                    <Input
                        readOnly
                        value={display}
                        onClick={() => setOpen(true)}
                        aria-label="Select date"
                    />
                    <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
                        <CalendarIcon className="size-4 opacity-60" />
                    </span>
                </div>
            </PopoverTrigger>
            <PopoverContent align="start" side="bottom" className="p-1 w-auto">
                <Calendar
                    className="p-0"
                    mode="single"
                    selected={selected}
                    onSelect={(d) => onSelectDate(d as Date | undefined)}
                    disabled={normalizedMin ? (date: Date) => date < normalizedMin : undefined}
                    captionLayout="dropdown"
                />
            </PopoverContent>
        </Popover>
    );
}
