"use server";

import { db } from "@/server/db";
import { getSession } from "@/server/better-auth/server";
import type { ImageConfig } from "../types";

export async function getGalleryImages() {
  const session = await getSession();
  if (!session) return { success: false, error: "Unauthorized" };

  try {
    // Fetch unique templates from historical campaigns
    const histories = await db.emailHistory.findMany({
      where: { userId: session.user.id },
      select: { imagesConfig: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });

    // Extract unique templates based on the ImageConfig structure
    const templates: ImageConfig[] = [];
    const seenPublicIds = new Set<string>();

    histories.forEach(h => {
      if (!h.imagesConfig) return;
      try {
        const configs = JSON.parse(h.imagesConfig as string) as ImageConfig[];
        configs.forEach(c => {
          if (c.publicId && !seenPublicIds.has(c.publicId)) {
            templates.push(c);
            seenPublicIds.add(c.publicId);
          }
        });
      } catch (e) {
        // Skip malformed
      }
    });

    return {
      success: true,
      data: templates
    };
  } catch (error) {
    console.error("Failed to fetch templates:", error);
    return { success: false, error: "Failed to fetch templates" };
  }
}

export async function saveGalleryImage(img: { url: string; publicId: string; name: string }) {
  const session = await getSession();
  if (!session) return { success: false, error: "Unauthorized" };

  try {
    const newImage = await db.galleryImage.create({
      data: {
        userId: session.user.id,
        url: img.url,
        publicId: img.publicId,
        name: img.name,
      },
    });

    return { success: true, data: newImage };
  } catch (error) {
    console.error("Failed to save gallery image:", error);
    return { success: false, error: "Failed to save image" };
  }
}
