"use server";

import { db } from "@/server/db";
import { getSession } from "@/server/better-auth/server";

export async function getGalleryImages() {
  const session = await getSession();
  if (!session) return { success: false, error: "Unauthorized" };

  try {
    const images = await db.galleryImage.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, data: images };
  } catch (error) {
    console.error("Failed to fetch gallery images:", error);
    return { success: false, error: "Failed to fetch images" };
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
