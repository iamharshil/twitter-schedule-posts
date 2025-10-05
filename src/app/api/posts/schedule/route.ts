import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { postTable } from "@/db/schema";
import { validatePost } from "@/lib/validation";
import { session } from "@/utils/session";

export const POST = async (req: Request) => {
	try {
		const { content, scheduledFor } = await req.json();

		console.log("Scheduling post:", { content, scheduledFor });

		const { user } = await session.get();
		if (!user) {
			return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
		}

		const newPostData = {
			userId: user.id as number,
			content,
			status: "pending",
			scheduledFor,
		};

		const validate = await validatePost(newPostData);
		console.log("Validated post data:", validate);

		if (!validate) {
			return NextResponse.json({ success: false, message: "Invalid post data" }, { status: 400 });
		}

		// check if same content is already exists in posts
		const existingPost = await db.select().from(postTable).where(eq(postTable.content, content)).limit(1);

		if (existingPost.length > 0) {
			return NextResponse.json(
				{ success: false, message: "Post with same content already exists" },
				{ status: 400 },
			);
		}

		await db.insert(postTable).values(newPostData);
		const scheduledPosts = await db
			.select()
			.from(postTable)
			.where(eq(postTable.userId, user.id as number));

		console.log("Post scheduled successfully:", scheduledPosts);
		return NextResponse.json({ success: true, message: "Post scheduled successfully!", data: scheduledPosts });
	} catch (error) {
		console.error("error", error);
		return NextResponse.json({
			success: false,
			message: "Internal server error!",
		});
	}
};
