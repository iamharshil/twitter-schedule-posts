import { TwitterApi } from "twitter-api-v2";

export const client = new TwitterApi({
  clientId: process.env.CLIENT_ID as string,
});

export const callbackURL = `http://127.0.0.1:3000/auth/callback`;
export const scopes = [
  "tweet.read",
  "users.read",
  "tweet.write",
  "offline.access",
];
