"use client";

import { useEffect, useState } from "react";

export default function DateClient({ date }: { date?: Date | string | undefined }) {
  const iso = date ? new Date(date).toISOString() : undefined;
  const [display, setDisplay] = useState<string | undefined>(iso);

  useEffect(() => {
    if (!date) return;
    try {
      const d = new Date(date);
      setDisplay(d.toLocaleString());
    } catch {
      // fallback to iso
      setDisplay(iso);
    }
  }, [date, iso]);

  return <>{display ?? "—"}</>;
}
