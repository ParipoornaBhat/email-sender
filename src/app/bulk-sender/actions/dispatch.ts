"use server";

import { db } from "@/server/db";
import { getSession } from "@/server/better-auth/server";
import { decrypt } from "@/server/utils/encryption";
import nodemailer from "nodemailer";
import type { ExcelRow, ImageConfig, EmailTemplate } from "../types";
import { revalidatePath } from "next/cache";
import { createCanvas, loadImage } from "canvas";

interface DispatchParams {
  accountId: string;
  data: ExcelRow[];
  template: EmailTemplate;
}

export async function dispatchBulkEmails({ accountId, data, template }: DispatchParams) {
  const session = await getSession();
  if (!session) return { success: false, error: "Unauthorized" };

  try {
    const account = await db.emailAccount.findUnique({
      where: { id: accountId, userId: session.user.id },
    });

    if (!account) return { success: false, error: "Email account not found" };

    const appPassword = decrypt(account.appPassword);

    // Create transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: account.emailAddress,
        pass: appPassword,
      },
    });

    const logs: any[] = [];
    let successCount = 0;
    let failCount = 0;

    // Helper to interpolate strings
    const interpolate = (text: string, row: ExcelRow) => {
      return text.replace(/{([^}]+)}/g, (_, key) => String(row[key] || `{${key}}`));
    };

    // Pre-load base images to avoid repeated fetches
    const baseImages = await Promise.all(
      template.images.map(async (imgConfig) => {
        const img = await loadImage(imgConfig.url);
        return { config: imgConfig, img };
      })
    );

    // Send emails (in series for now to avoid Gmail rate limits, but could be chunked)
    for (const row of data) {
      const recipientEmail = (row.Email || row.email || Object.values(row)[0]) as string;
      const subject = interpolate(template.subject, row);
      const html = interpolate(template.bodyHtml, row);

      try {
        const attachments = await Promise.all(
          baseImages.map(async ({ config, img }, idx) => {
            const canvas = createCanvas(img.width, img.height);
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);

            // Draw each text layer
            for (const text of config.texts) {
              const interpolatedText = interpolate(text.text, row);
              ctx.font = `${text.fontWeight || "normal"} ${text.fontSize}px ${text.fontFamily}`;
              ctx.fillStyle = text.color;
              ctx.textBaseline = "middle";

              const absX = (text.x / 100) * img.width;
              const absY = (text.y / 100) * img.height;
              const maxWidthPx = ((text.maxWidth || 0) / 100) * img.width;

              // Simple line wrapping
              const words = interpolatedText.split(' ');
              const lines = [];
              let currentLine = '';

              if (maxWidthPx > 0) {
                for (const word of words) {
                  const testLine = currentLine ? `${currentLine} ${word}` : word;
                  if (ctx.measureText(testLine).width > maxWidthPx && currentLine) {
                    lines.push(currentLine);
                    currentLine = word;
                  } else {
                    currentLine = testLine;
                  }
                }
                if (currentLine) lines.push(currentLine);
              } else {
                lines.push(interpolatedText);
              }

              const lineHeight = text.fontSize * 1.2;
              const totalHeight = lines.length * lineHeight;
              let startY = absY;
              
              if (text.verticalAlign === "middle" || !text.verticalAlign) startY = absY - (totalHeight - lineHeight) / 2;
              if (text.verticalAlign === "bottom") startY = absY - (totalHeight - lineHeight);

              lines.forEach((line, i) => {
                const lineY = startY + i * lineHeight;
                let lineX = absX;
                if (text.textAlign === "center") lineX -= ctx.measureText(line).width / 2;
                if (text.textAlign === "right") lineX -= ctx.measureText(line).width;
                ctx.fillText(line, lineX, lineY);
              });
            }

            const buffer = canvas.toBuffer("image/png");
            const filename = config.attachmentName 
              ? `${interpolate(config.attachmentName, row)}.png`
              : `certificate_${idx + 1}.png`;

            return {
              filename,
              content: buffer,
            };
          })
        );

        await transporter.sendMail({
          from: `"${account.orgName}" <${account.emailAddress}>`,
          to: recipientEmail,
          subject,
          html,
          attachments,
        });
        
        logs.push({ email: recipientEmail, status: "SUCCESS" });
        successCount++;
      } catch (err: any) {
        console.error(`Failed to send to ${recipientEmail}:`, err);
        logs.push({ email: recipientEmail, status: "FAILED", error: err.message });
        failCount++;
      }
    }

    // Save to history
    await db.emailHistory.create({
      data: {
        userId: session.user.id,
        accountId: account.id,
        subject: template.subject,
        bodyHtml: template.bodyHtml,
        imagesConfig: JSON.stringify(template.images),
        excelData: JSON.stringify(data),
        status: failCount === 0 ? "COMPLETED" : successCount > 0 ? "PARTIAL" : "FAILED",
        logs: JSON.stringify(logs),
      },
    });

    revalidatePath("/history");
    return { 
      success: true, 
      message: `Finished! ${successCount} sent, ${failCount} failed.` 
    };

  } catch (error: any) {
    console.error("Bulk Dispatch Error:", error);
    return { success: false, error: error.message || "Bulk dispatch failed" };
  }
}
