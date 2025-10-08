import { z } from "zod";

export const PostSchema = z.object({
	_id: z.string().optional(),
	userId: z.string().min(1, "userId is required"), // MongoDB ObjectId as string
	content: z.string().min(1, "Post content cannot be empty").max(280, "Post content cannot exceed 280 characters"),
	status: z.enum(["pending", "posted", "failed"]),
	scheduledFor: z.string().refine((date) => !Number.isNaN(Number(Date.parse(date))), {
		message: "Invalid date format",
	}),
	createdAt: z
		.string()
		.refine((date) => !Number.isNaN(Number(Date.parse(date))), {
			message: "Invalid date format",
		})
		.optional(),
	updatedAt: z
		.string()
		.refine((date) => !Number.isNaN(Number(Date.parse(date))), {
			message: "Invalid date format",
		})
		.optional(),
});

export type Post = z.infer<typeof PostSchema>;
export type Posts = Post[];

export const validatePost = (data: unknown): Post => {
	const result = PostSchema.safeParse(data);
	if (!result.success) {
		throw new Error(result.error.issues.map((err) => err.message).join(", "));
	}
	return result.data;
};
