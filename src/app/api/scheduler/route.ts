import { NextResponse } from "next/server"
var cron = require("node-cron");

export async function GET(req: Request) {
    try {
        cron.schedule("*/5 * * * *", async () => {
            console.log("Running cron...")
            await fetch(`${process.env.NEXT_PUBLIC_SITE_URL as string}/api/cron-webhook`, {
                headers: new Headers({
                    "Authorization": process.env.API_KEY as string
                })
            });
        })

        return NextResponse.json({ message: "Cron scheduled successfully" }, { status: 200 })
    } catch (error) {
        console.error("error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}