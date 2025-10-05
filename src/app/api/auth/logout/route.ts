import { NextResponse } from "next/server";
import { session } from "@/utils/session";

export const GET = async () => {
	try {
		await session.destroy();

		return NextResponse.json({ success: true }, { status: 200 });
	} catch (error) {
		console.error("error", error);
		return NextResponse.json({ success: false, message: "Internal sever error!" }, { status: 500 });
	}
};
