import { type NextRequest, NextResponse } from "next/server";
import { TwitterApi } from "twitter-api-v2";
import { session } from "@/utils/session";

export const GET = async (request: NextRequest) => {
  try {
    const query = request.nextUrl.searchParams;
    const code = query.get("code");
    const state = query.get("state");

    const entry = await session.get();

    console.log("entry:", entry);

    if (!entry?.oauth?.state || entry?.oauth?.state !== state) {
      console.error("Unknown or expired state:", state);
      return NextResponse.json(
        { success: false, message: "Unknown or expired state!" },
        { status: 400 },
      );
    }

    const { codeVerifier } = entry.oauth;
    await session.destroy();

    if (!code || !codeVerifier) {
      return NextResponse.json(
        { success: false, message: "Unknown or expired state!" },
        { status: 400 },
      );
    }
    try {
      const client = new TwitterApi({
        clientId: process.env.CLIENT_ID as string,
        clientSecret: process.env.CLIENT_SECRET as string,
      });

      const callback = process.env.CALLBACK_URL as string;
      console.log("callback", callback);

      const token = await client.loginWithOAuth2({
        code,
        codeVerifier,
        redirectUri: callback,
      });

      console.log("token", token);
      const oauth2Tokens = {
        isAuthed: true,
        accessToken: token.accessToken,
        refreshToken: token.refreshToken,
        expiresIn: token.expiresIn,
        scope: token.scope,
      };

      const authedClient = new TwitterApi(token.accessToken);
      const { data } = await authedClient.v2.me({
        "user.fields": ["id", "name", "username", "profile_image_url"],
      });

      console.log("data", data);

      await session.user(oauth2Tokens);
      return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
      console.error(error);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("error", error);
    return NextResponse.json(
      { success: false, message: "Internal server error!" },
      { status: 500 },
    );
  }
};
