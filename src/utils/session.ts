import { getIronSession } from "iron-session";
import { cookies } from "next/headers";

type SessionData = {
  oauth?: {
    url?: string;
    state?: string;
    codeVerifier?: string;
  };
  user?: {
    isAuthed?: boolean;
    accessToken?: string;
    refreshToken?: string;
  };
};

const sessionOptions = {
  password: "iHY5MT7EddG6g2igxVCpUXPPSIubGHiQ",
  cookieName: "session",
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
    const sesssionInstance = await this.get();
    await sesssionInstance.save();
  },

  async destroy() {
    const sessionInstance = await this.get();
    sessionInstance.destroy();
  },
};
