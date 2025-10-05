import { NextResponse } from "next/server";

export const RES_SUCCESS = (data = {}) => {
	return NextResponse.json({ success: true, data }, { status: 200 });
};

export const RES_ERROR = (message = "") => {
	return NextResponse.json({ success: false, message: message ?? "Something went wrong!" }, { status: 400 });
};

export const RES_INTERNAL = () => {
	return NextResponse.json({ success: false, message: "Internal sever error!" }, { status: 500 });
};
