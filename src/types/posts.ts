export type ScheduledPost = {
	id: string;
	userId: number;
	content: string;
	status: "pending" | "posted" | "failed";
	scheduledFor: Date;
	createdAt?: Date;
	updatedAt?: Date;
};
