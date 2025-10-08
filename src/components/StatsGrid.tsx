import { AlertCircleIcon, CheckCircleIcon, Clock3Icon, SendIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function StatsGrid({
	pending,
	posted,
	failed,
	total,
}: {
	pending: number;
	posted: number;
	failed: number;
	total: number;
}) {
	const stats = [
		{
			label: "Scheduled",
			value: pending,
			icon: <Clock3Icon className="h-6 w-6 text-indigo-400" />,
			accent: "from-indigo-600 to-sky-500",
		},
		{
			label: "Posted",
			value: posted,
			icon: <CheckCircleIcon className="h-6 w-6 text-green-400" />,
			accent: "from-emerald-500 to-green-500",
		},
		{
			label: "Failed",
			value: failed,
			icon: <AlertCircleIcon className="h-6 w-6 text-red-400" />,
			accent: "from-red-500 to-rose-500",
		},
		{
			label: "Total",
			value: total,
			icon: <SendIcon className="h-6 w-6 text-purple-300" />,
			accent: "from-purple-500 to-pink-500",
		},
	];

	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
			{stats.map((s) => (
				<Card
					key={s.label}
					className="rounded-2xl border bg-white/60 dark:bg-slate-900/60 backdrop-blur p-0 shadow-lg hover:shadow-2xl transition-shadow"
				>
					<CardContent className="p-4 flex items-center justify-between gap-4">
						<div>
							<p className="text-xs text-slate-500 dark:text-slate-400">{s.label}</p>
							<p className="text-2xl font-extrabold mt-1">{s.value}</p>
						</div>
						<div className={`rounded-lg p-3 bg-gradient-to-br ${s.accent} bg-opacity-10`}>{s.icon}</div>
					</CardContent>
				</Card>
			))}
		</div>
	);
}
