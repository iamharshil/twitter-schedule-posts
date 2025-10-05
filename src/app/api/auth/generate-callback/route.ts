import { NextResponse } from "next/server";
import { session } from "@/utils/session";
import { callbackURL, client, scopes } from "@/utils/x-auth";

export const GET = async () => {
	try {
		const data = await client.generateOAuth2AuthLink(callbackURL, {
			scope: scopes,
		});

		console.log(data);

		await session.setOAuth(data);
		return NextResponse.json({ success: true, data });
	} catch (error) {
		console.error("error", error);
		return NextResponse.json({
			success: false,
			message: "Internal server error!",
		});
	}
};
