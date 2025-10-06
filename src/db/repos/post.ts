import { eq } from "drizzle-orm";
import { db } from "@/db/drizzle";
import { postTable } from "@/db/schema";

type PostInsert = {
	userId: number;
	content: string;
	status?: string;
	scheduledFor?: Date | string;
	xPostId?: string | null;
};

export const createPost = async (data: PostInsert) => {
	const insertData: {
		userId: number;
		content: string;
		status: string;
		scheduledFor?: Date | undefined;
		xPostId?: string | null;
	} = {
		userId: data.userId,
		content: data.content,
		status: data.status ?? "pending",
		scheduledFor: data.scheduledFor ? new Date(data.scheduledFor) : undefined,
		xPostId: data.xPostId ?? null,
	};

	const result = await db.insert(postTable).values(insertData).returning();
	return result;
};

export const getPostsByUserId = async (userId: number) => {
	const posts = await db.select().from(postTable).where(eq(postTable.userId, userId)).orderBy(postTable.scheduledFor);
	return posts;
};

export const getPostById = async (id: number) => {
	const posts = await db.select().from(postTable).where(eq(postTable.id, id));
	return posts[0];
};

export const updatePostStatus = async (id: number, status: string, xPostId?: string | null) => {
	const updateData: { status: string; xPostId?: string | null } = { status };
	if (typeof xPostId !== "undefined") updateData.xPostId = xPostId ?? null;

	const result = await db.update(postTable).set(updateData).where(eq(postTable.id, id)).returning();
	return result;
};

export const deletePostById = async (id: number) => {
	const result = await db.delete(postTable).where(eq(postTable.id, id)).returning();
	return result;
};

export default {
	createPost,
	getPostsByUserId,
	getPostById,
	updatePostStatus,
	deletePostById,
};
