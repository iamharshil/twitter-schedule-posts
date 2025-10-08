import mongoose, { type InferSchemaType, Schema } from "mongoose";

const PostSchema = new Schema(
	{
		userId: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		content: {
			type: String,
			trim: true,
			required: true,
		},
		xPostId: {
			type: String,
		},
		scheduledFor: {
			type: Date,
			required: true,
		},
		status: {
			type: String,
			enum: ["pending", "posted", "failed"],
			default: "pending",
		},
	},
	{ timestamps: true },
);

// Unique compound index: same user cannot have duplicate content
PostSchema.index({ userId: 1, content: 1 }, { unique: true });

const Post = mongoose.models?.Post || mongoose.model("Post", PostSchema);

export type IPost = InferSchemaType<typeof PostSchema>;
export default Post;
