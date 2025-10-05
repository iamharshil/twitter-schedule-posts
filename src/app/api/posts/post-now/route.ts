import { NextResponse } from "next/server";
import postRepo from "@/db/repos/post";
import userRepo from "@/db/repos/user";
import { session } from "@/utils/session";

export const POST = async (req: Request) => {
	try {
		const { id } = await req.json();

		const { user } = await session.get();
		if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

		const sessionUser = user as unknown as { id?: number; xId?: string };
		let dbUser = undefined;
		if (sessionUser.id && typeof sessionUser.id === "number") {
			dbUser = await userRepo.getUserById(sessionUser.id as number);
		} else if (sessionUser.xId) {
			dbUser = await userRepo.getUserByXId(sessionUser.xId);
		}
		if (!dbUser || !dbUser.id)
			return NextResponse.json({ success: false, message: "User not found" }, { status: 401 });

		if (!id) return NextResponse.json({ success: false, message: "Missing post id" }, { status: 400 });

		// ensure post belongs to user
		const post = await postRepo.getPostById(Number(id));
		if (!post) return NextResponse.json({ success: false, message: "Post not found" }, { status: 404 });
		if (post.userId !== dbUser.id)
			return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });

		// For now, mark as posted. In a production system we'd call the external API and store xPostId.
		await postRepo.updatePostStatus(Number(id), "posted");

		const posts = await postRepo.getPostsByUserId(dbUser.id as number);
		return NextResponse.json({ success: true, data: posts });
	} catch (err) {
		console.error("post-now error", err);
		return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
	}
};
