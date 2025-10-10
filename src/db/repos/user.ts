import User from "@/models/user.model";
import connectDB from "@/utils/database";

export default {
	async getUserById(id: string) {
		await connectDB();
		return await User.findById(id).select("+access_token +refresh_token +expiresIn +scope");
	},

	async getUserByXId(xId: string) {
		await connectDB();
		return await User.findOne({ xId }).select("+access_token +refresh_token +expiresIn +scope");
	},

	async createUser(userData: Record<string, unknown>) {
		await connectDB();
		return await User.create(userData);
	},

	async updateUser(id: string, updateData: Record<string, unknown>) {
		await connectDB();
		return await User.findByIdAndUpdate(id, updateData, { new: true });
	},

	async deleteUser(id: string) {
		await connectDB();
		return await User.findByIdAndDelete(id);
	},
};
