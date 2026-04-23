import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

import { db } from "@/server/db";

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  // Disable email/password for Google-only auth
  emailAndPassword: {
    enabled: false,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      redirectURI: process.env.GOOGLE_REDIRECT_URI || "http://localhost:3000/api/auth/callback/google",
    },
  },
});

export type Session = typeof auth.$Infer.Session;
