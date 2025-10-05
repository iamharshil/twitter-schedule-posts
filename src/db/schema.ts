import { integer, pgTable, timestamp, uniqueIndex, varchar } from "drizzle-orm/pg-core";

export const userTable = pgTable(
	"users",
	{
		id: integer().primaryKey().generatedByDefaultAsIdentity(),
		xId: varchar({ length: 255 }),
		name: varchar({ length: 255 }),
		username: varchar({ length: 255 }).notNull(),
		profile: varchar({ length: 255 }),
		timezone: varchar({ length: 100 }),
		accessToken: varchar({ length: 255 }),
		refreshToken: varchar({ length: 255 }),
		expiresIn: integer(),
		scope: varchar({ length: 255 }),
		isAuthed: integer().notNull().default(1), // 1 for true, 0 for false
		createdAt: timestamp().notNull().defaultNow(),
		updatedAt: timestamp(),
	},
	(table) => [uniqueIndex("xid_idx").on(table.xId)],
).enableRLS();

export const postTable = pgTable("posts", {
	id: integer().primaryKey().generatedByDefaultAsIdentity(),
	userId: integer()
		.notNull()
		.references(() => userTable.id),
	content: varchar({ length: 1024 }).notNull(),
	scheduleAt: timestamp(),
	status: varchar({ length: 50 }).notNull().default("pending"),
	createdAt: timestamp().notNull().defaultNow(),
	updatedAt: timestamp(),
});
