import { eq } from "drizzle-orm";
import { db } from "@/db/drizzle";
import { userTable } from "@/db/schema";

type UserInsert = {
	xId: string;
	name?: string | null;
	username: string;
	profile?: string | null;
	timezone?: string | null;
	accessToken?: string | null;
	refreshToken?: string | null;
	expiresIn?: number | null;
	scope?: string | null;
	isAuthed?: number;
	updatedAt?: Date | null;
};

export const getUserByXId = async (xId: string) => {
	const [user] = await db.select().from(userTable).where(eq(userTable.xId, xId)).limit(1);
	return user;
};

export const getUserById = async (id: number) => {
	const [user] = await db.select().from(userTable).where(eq(userTable.id, id)).limit(1);
	return user;
};

export const upsertUserByXId = async (data: UserInsert) => {
	const [user] = await db
		.insert(userTable)
		.values(data)
		.onConflictDoUpdate({
			target: userTable.xId,
			set: data,
		})
		.returning();

	return user;
};

export default {
	getUserByXId,
	getUserById,
	upsertUserByXId,
};
