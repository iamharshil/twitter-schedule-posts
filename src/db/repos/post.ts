import Post from "@/models/posts.model";
import connectDB from "@/utils/database";

export default {
	async getPostsByUserId(userId: string) {
		await connectDB();
		return await Post.find({ userId }).sort({ scheduledFor: 1 });
	},

	async getPostById(id: string) {
		await connectDB();
		return await Post.findById(id);
	},

	async createPost(postData: Record<string, unknown>) {
		await connectDB();
		return await Post.create(postData);
	},

	async updatePost(id: string, updateData: Record<string, unknown>) {
		await connectDB();
		return await Post.findByIdAndUpdate(id, updateData, { new: true });
	},

	async deletePost(id: string) {
		await connectDB();
		return await Post.findByIdAndDelete(id);
	},

	async getPendingPosts() {
		await connectDB();
		return await Post.find({
			status: "pending",
			scheduledFor: { $lte: new Date() },
		}).populate("userId");
	},

	async updatePostStatus(id: string, status: "pending" | "posted" | "failed", xPostId?: string) {
		await connectDB();
		const updateData: Record<string, unknown> = { status };
		if (xPostId) {
			updateData.xPostId = xPostId;
		}
		return await Post.findByIdAndUpdate(id, updateData, { new: true });
	},
};
