import { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    needsAdditionalInfo?: boolean;
    user: {
      id?: string;
      role?: string;
      image?: string | null;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    token?: string;
    needsAdditionalInfo?: boolean;
    role?: string;
    avatar?: { url?: string };
    profile?: unknown;
    hostProfile?: unknown;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    needsAdditionalInfo?: boolean;
    id?: string;
    avatarUrl?: string;
    role?: string;
  }
}
