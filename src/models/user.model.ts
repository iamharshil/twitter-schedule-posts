import mongoose, { type InferSchemaType, Schema } from "mongoose";

const UserSchema = new Schema(
	{
		xId: {
			type: String,
			required: true,
			trim: true,
			unique: true,
		},
		name: {
			type: String,
			required: true,
			trim: true,
		},
		username: {
			type: String,
			trim: true,
			required: true,
		},
		profile: {
			type: String,
		},
		timezone: {
			type: String,
			required: true,
		},
		access_token: {
			type: String,
			required: true,
			select: false,
		},
		refresh_token: {
			type: String,
			required: true,
			select: false,
		},
		expiresIn: {
			type: Date,
			required: true,
			select: false,
		},
		scope: {
			type: [String],
			required: true,
			select: false,
		},
	},
	{ timestamps: true },
);

const User = mongoose.models?.User || mongoose.model("User", UserSchema);

export type IUser = InferSchemaType<typeof UserSchema>;
export default User;
