import { integer, pgTable, timestamp, uniqueIndex, varchar } from "drizzle-orm/pg-core";

export const userTable = pgTable(
	"users",
	{
		id: integer().primaryKey().generatedByDefaultAsIdentity(),
		xId: varchar({ length: 255 }),
		name: varchar({ length: 255 }),
		username: varchar({ length: 255 }).notNull(),
		profile: varchar({ length: 255 }),
		accessToken: varchar({ length: 255 }),
		createdAt: timestamp().notNull().defaultNow(),
		updatedAt: timestamp(),
	},
	(table) => [uniqueIndex("xid_idx").on(table.xId)],
).enableRLS();

export const postTable = pgTable(
	"posts",
	{
		id: integer().primaryKey().generatedByDefaultAsIdentity(),
		userId: integer()
			.notNull()
			.references(() => userTable.id),
		content: varchar({ length: 1024 }).notNull(),
		scheduleAt: timestamp(),
		status: varchar({ length: 50 }).notNull().default("pending"),
		createdAt: timestamp().notNull().defaultNow(),
		updatedAt: timestamp(),
	},
	(table) => [uniqueIndex("userId_idx").on(table.userId)],
);
