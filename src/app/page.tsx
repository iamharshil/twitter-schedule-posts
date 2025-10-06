import { redirect } from "next/navigation";
import Home from "@/components/Home";
// import postRepo from "@/db/repos/post";
import userRepo from "@/db/repos/user";
// import type { Post } from "@/lib/validation";
import { session } from "@/utils/session";

export default async function HomePage() {
  const { user } = await session.get();

  console.log("user", user);
  // await db.delete(postTable);
  if (!user) {
    redirect("/auth")
  } else {
    // Resolve numeric user id from session (prefer id, else lookup by xId)
    const sessionUser = user as unknown as { id?: number; xId?: string };
    let dbUser = undefined;
    if (sessionUser.id && typeof sessionUser.id === "number") {
      dbUser = await userRepo.getUserById(sessionUser.id as number);
    } else if (sessionUser.xId) {
      dbUser = await userRepo.getUserByXId(sessionUser.xId);
    }

    if (!dbUser || !dbUser.id) {
      console.warn("Could not resolve numeric user id for session user");
      redirect("/auth");
    }

    // const dbPosts = await postRepo.getPostsByUserId(dbUser.id as number);

    // const posts = (dbPosts as unknown as Post[]).map((post) => ({
    //   id: post.id?.toString(),
    //   userId: post.userId,
    //   content: post.content,
    //   status: post.status as "posted" | "pending" | "failed",
    //   scheduledFor: post.scheduledFor ? new Date(post.scheduledFor).toISOString() : "",
    //   createdAt: post.createdAt ? new Date(post.createdAt).toISOString() : undefined,
    //   updatedAt: post.updatedAt ? new Date(post.updatedAt).toISOString() : undefined,
    // }));
    // console.log("posts", posts);

    return (
      <Home />
    )
  }
}