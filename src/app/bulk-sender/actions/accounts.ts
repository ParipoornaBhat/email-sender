"use server";

import { db } from "@/server/db";
import { getSession } from "@/server/better-auth/server";
import { encrypt, decrypt } from "@/server/utils/encryption";
import { revalidatePath } from "next/cache";

export async function getEmailAccounts() {
  const session = await getSession();
  if (!session) return { success: false, error: "Unauthorized" };

  try {
    const accounts = await db.emailAccount.findMany({
      where: { userId: session.user.id },
      include: {
        _count: {
          select: { emailHistories: true }
        }
      },
      orderBy: { createdAt: "desc" },
    });

    return { 
      success: true, 
      data: accounts.map(acc => ({
        id: acc.id,
        emailAddress: acc.emailAddress,
        orgName: acc.orgName,
        appPassword: decrypt(acc.appPassword),
        hasHistory: acc._count.emailHistories > 0,
        createdAt: acc.createdAt,
      })) 
    };
  } catch (error) {
    console.error("Failed to fetch email accounts:", error);
    return { success: false, error: "Failed to fetch accounts" };
  }
}

export async function addEmailAccount(formData: {
  emailAddress: string;
  orgName: string;
  appPassword: string;
}) {
  const session = await getSession();
  if (!session) return { success: false, error: "Unauthorized" };

  try {
    const encryptedPassword = encrypt(formData.appPassword);

    await db.emailAccount.create({
      data: {
        userId: session.user.id,
        emailAddress: formData.emailAddress,
        orgName: formData.orgName,
        appPassword: encryptedPassword,
      },
    });

    revalidatePath("/bulk-sender");
    return { success: true };
  } catch (error) {
    console.error("Failed to add email account:", error);
    return { success: false, error: "Failed to add account" };
  }
}

export async function deleteEmailAccount(id: string) {
  const session = await getSession();
  if (!session) return { success: false, error: "Unauthorized" };

  try {
    // Safety Check: Don't allow deletion if there is linked history
    const historyCount = await db.emailHistory.count({
      where: { 
        accountId: id,
        userId: session.user.id
      }
    });

    if (historyCount > 0) {
      return { 
        success: false, 
        error: `Cannot delete this account because it has ${historyCount} linked campaign history records. Please keep it for auditing purposes.` 
      };
    }

    await db.emailAccount.delete({
      where: { 
        id,
        userId: session.user.id 
      },
    });

    revalidatePath("/bulk-sender");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete email account:", error);
    return { success: false, error: "Failed to delete account" };
  }
}
