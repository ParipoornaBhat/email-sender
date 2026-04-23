"use server";

import { db } from "@/server/db";
import { getSession } from "@/server/better-auth/server";

export async function getEmailHistory() {
  const session = await getSession();
  if (!session) return { success: false, error: "Unauthorized" };

  try {
    const history = await db.emailHistory.findMany({
      where: { userId: session.user.id },
      include: {
        account: {
          select: { emailAddress: true, orgName: true }
        }
      },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, data: history };
  } catch (error) {
    console.error("Failed to fetch history:", error);
    return { success: false, error: "Failed to fetch history" };
  }
}
