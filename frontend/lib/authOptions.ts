import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { api } from "./api";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password required");
        }

        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/users/login`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: credentials.email,
                password: credentials.password,
              }),
            }
          );

          if (!response.ok) {
            throw new Error("Invalid credentials");
          }

          const data = await response.json();

          return {
            id: data.user.id,
            email: data.user.email,
            name: `${data.user.firstName} ${data.user.lastName}`,
            image: data.user.avatar?.url,
            token: data.token,
            ...data.user,
          };
        } catch (error) {
          console.error("Login error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        try {
          console.log("🔵 Google OAuth detected, calling backend...");
          console.log("API URL:", process.env.NEXT_PUBLIC_API_URL);
          
          // Register/login via backend with Google OAuth
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/users/oauth/google`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: user.email,
                firstName:
                  (profile as { given_name?: string } | undefined)?.given_name ||
                  user.name?.split(" ")[0],
                lastName:
                  (profile as { family_name?: string } | undefined)?.family_name ||
                  user.name?.split(" ")[1] || "",
                avatar: user.image,
                googleId: account.providerAccountId,
              }),
            }
          );

          console.log("Backend response status:", response.status);

          if (!response.ok) {
            const errorText = await response.text();
            console.error("OAuth backend error:", errorText);
            return false;
          }

          const data = await response.json();
          console.log("✅ Backend responded:", data);
          
          user.token = data.token;
          user.id = data.user.id;
          user.needsAdditionalInfo = data.needsAdditionalInfo || false;
          user.role = data.user.role;
          (user as { profile?: unknown }).profile = data.user.profile;
          (user as { hostProfile?: unknown }).hostProfile = data.user.hostProfile;
          user.image = data.user?.avatar?.url || user.image;
          user.avatar = data.user?.avatar || user.avatar;

          return true;
        } catch (error) {
          console.error("❌ OAuth sign-in error:", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.accessToken = user.token;
        token.id = user.id;
        token.needsAdditionalInfo = user.needsAdditionalInfo;
        token.avatarUrl = user.avatar?.url ?? user.image ?? undefined;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.image = (token.avatarUrl as string) || session.user.image;
        session.user.role = token.role as string | undefined;
        session.accessToken = token.accessToken as string;
        session.needsAdditionalInfo = token.needsAdditionalInfo as boolean;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // url is the callback url (default is /)
      // For OAuth providers, we need to check if user needs additional info
      // This is tricky because we can't access the token here directly
      // So we'll handle it via a query param or default redirect
      
      // If redirecting to home, NextAuth will handle it
      // The complete-profile check happens in the complete-profile page itself
      return baseUrl;
    },
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
