"use server";

import { db } from "@/server/db";
import { getSession } from "@/server/better-auth/server";
import { revalidatePath } from "next/cache";

export async function acceptTerms() {
  const session = await getSession();
  if (!session) return { success: false, error: "Unauthorized" };

  try {
    await db.user.update({
      where: { id: session.user.id },
      data: { agreedTerms: true },
    });

    revalidatePath("/bulk-sender");
    return { success: true };
  } catch (error) {
    console.error("Failed to accept terms:", error);
    return { success: false, error: "Failed to update agreement status" };
  }
}

export async function getAgreementStatus() {
  const session = await getSession();
  if (!session) return { success: false, error: "Unauthorized" };

  try {
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { agreedTerms: true }
    });
    return { success: true, agreed: !!user?.agreedTerms };
  } catch (error) {
    return { success: false, error: "Failed to fetch status" };
  }
}
