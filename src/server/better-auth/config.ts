import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

import { db } from "@/server/db";
import { env } from "@/env";

const getBaseURL = () => {
  if (env.BETTER_AUTH_URL) return env.BETTER_AUTH_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
};

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  baseURL: getBaseURL(),
  // Disable email/password for Google-only auth
  emailAndPassword: {
    enabled: false,
  },
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID || "",
      clientSecret: env.GOOGLE_CLIENT_SECRET || "",
      // Fallback to dynamically constructed URI if not explicitly set
      redirectURI: `${getBaseURL()}/api/auth/callback/google`,
    },
  },
});

export type Session = typeof auth.$Infer.Session;
