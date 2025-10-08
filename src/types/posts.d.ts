export type ScheduledPost = {
	id: string;
	content: string;
	// some parts of the app expect ISO strings, others use Date; allow both
	scheduledFor: string | Date;
	status: "pending" | "posted" | "failed";
};
