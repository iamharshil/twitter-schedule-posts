import { getIronSession } from "iron-session";
import { cookies } from "next/headers";

type SessionData = {
	oauth?: {
		url?: string;
		state?: string;
		codeVerifier?: string;
	};
	user?: {
		id?: string; // Changed to string for MongoDB ObjectId
		xId?: string;
		isAuthed?: boolean;
		timezone?: string;
		accessToken?: string;
		refreshToken?: string;
		expiresIn?: number;
		expiresAt?: Date; // Added expiresAt timestamp
		createdAt?: Date;
		updatedAt?: Date;
	};
};

const sessionOptions = {
	password: process.env.SESSION_PASSWORD as string,
	cookieName: process.env.SESSION_NAME as string,
};

export const session = {
	async get() {
		const cookieStore = await cookies();
		return await getIronSession<SessionData>(cookieStore, sessionOptions);
	},

	async setOAuth(data: object) {
		const sessionInstance = await this.get();
		sessionInstance.oauth = data;
		await sessionInstance.save();
	},

	async user(data: object) {
		const sessionInstance = await this.get();
		sessionInstance.user = data;
		await sessionInstance.save();
	},

	async save() {
		const sessionInstance = await this.get();
		await sessionInstance.save();
	},

	async destroy() {
		const sessionInstance = await this.get();
		sessionInstance.destroy();
	},
};
