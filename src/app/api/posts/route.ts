import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { postTable } from "@/db/schema";
import { session } from "@/utils/session";

export const GET = async () => {
	try {
		const sessionInfo = await session.get();
		if (!sessionInfo?.user?.isAuthed) {
			await session.destroy();
			return NextResponse.json({ success: false, message: "Unauthorized access!" }, { status: 401 });
		}

		if (!sessionInfo?.user?.id) {
			return NextResponse.json(
				{ success: false, message: "Something went wrong, please try again!" },
				{ status: 400 },
			);
		}
		const posts = await db
			.select()
			.from(postTable)
			.where(eq(postTable.userId, sessionInfo.user.id))
			.orderBy(postTable.scheduledFor);

		return NextResponse.json({ success: true, data: posts }, { status: 200 });
	} catch (error) {
		console.error("error:", error);
		return NextResponse.json({ success: false, message: "Internal server error!" }, { status: 500 });
	}
};
