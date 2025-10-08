import mongoose, { type Connection } from "mongoose";

let cachedConnection: Connection | null = null;

export default async function connectDB() {
	if (cachedConnection) {
		return cachedConnection;
	}

	try {
		if (!process.env.MONGODB_URI) {
			throw new Error("Please provide MONGODB_URI environment variable!");
		}
		const cnx = await mongoose.connect(process.env.MONGODB_URI);
		cachedConnection = cnx.connection;

		return cachedConnection;
	} catch (error) {
		console.error("🚀 ~ connectDB ~ error:", error);
		throw new Error("Error connecting to MongoDB!");
	}
}
