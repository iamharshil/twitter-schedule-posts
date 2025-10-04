import { TwitterApi } from "twitter-api-v2";

export const client = new TwitterApi({
  clientId: process.env.CLIENT_ID as string,
});

export const callbackURL = process.env.CALLBACK_URL as string;
export const scopes = [
  "tweet.read",
  "users.read",
  "tweet.write",
  "offline.access",
];
