// imports
import { NextResponse } from "next/server";
import postRepo from "@/db/repos/post";
import userRepo from "@/db/repos/user";
import type { Post } from "@/lib/validation";
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

		// Resolve numeric user id from session (prefer id, else xId -> DB lookup)
		const sessionUser = user as unknown as { id?: number; xId?: string };
		let dbUser = undefined;
		if (sessionUser.id && typeof sessionUser.id === "number") {
			dbUser = await userRepo.getUserById(sessionUser.id as number);
		} else if (sessionUser.xId) {
			dbUser = await userRepo.getUserByXId(sessionUser.xId);
		}

		if (!dbUser || !dbUser.id) {
			return NextResponse.json({ success: false, message: "User not found or unauthorized" }, { status: 401 });
		}

		const newPostData = {
			userId: dbUser.id,
			content,
			status: "pending",
			scheduledFor,
		};

		const validate = await validatePost(newPostData);
		console.log("Validated post data:", validate);

		if (!validate) {
			return NextResponse.json({ success: false, message: "Invalid post data" }, { status: 400 });
		}

		// check if same content already exists for this user
		const postsForUser = (await postRepo.getPostsByUserId(dbUser.id as number)) as unknown as Post[];
		const existingPost = postsForUser.find((p) => p.content === content);

		if (existingPost) {
			return NextResponse.json(
				{ success: false, message: "Post with same content already exists" },
				{ status: 400 },
			);
		}

		await postRepo.createPost(newPostData);
		const scheduledPosts = await postRepo.getPostsByUserId(dbUser.id as number);

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
