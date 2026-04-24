"use server";

import { db } from "@/server/db";
import { getSession } from "@/server/better-auth/server";
import { decrypt } from "@/server/utils/encryption";
import nodemailer from "nodemailer";
import type { ExcelRow, ImageConfig, EmailTemplate } from "../types";
import { revalidatePath } from "next/cache";
import { createCanvas, loadImage } from "canvas";

// Helper to interpolate strings
const interpolate = (text: string, row: ExcelRow) => {
  return text.replace(/{([^}]+)}/g, (_, key) => String(row[key] || `{${key}}`));
};

// Global cache to prevent downloading the same Cloudinary image for every single recipient
const globalImageCache = new Map<string, any>();

async function getCachedImage(url: string) {
    if (!globalImageCache.has(url)) {
        const img = await loadImage(url);
        globalImageCache.set(url, img);
    }
    return globalImageCache.get(url);
}

interface SingleDispatchParams {
  accountId: string;
  row: ExcelRow;
  template: EmailTemplate;
  rowIndex: number;
  historyId?: string;
}

export async function dispatchSingleEmail({ accountId, row, template, rowIndex, historyId }: SingleDispatchParams) {
  const session = await getSession();
  if (!session) return { success: false, error: "Unauthorized" };

  const recipientEmail = (row.Email || row.email || Object.values(row)[0]) as string;
  
  if (!recipientEmail) {
      return { success: false, log: { email: "Unknown", status: "FAILED", error: "No email address found in row" } };
  }

  try {
    const account = await db.emailAccount.findUnique({
      where: { id: accountId, userId: session.user.id },
    });

    if (!account) return { success: false, log: { email: recipientEmail, status: "FAILED", error: "Account not found" } };

    const appPassword = decrypt(account.appPassword);
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: account.emailAddress, pass: appPassword },
    });

    const subject = interpolate(template.subject, row);
    const html = interpolate(template.bodyHtml, row);

    // Pre-load base images (cached)
    const baseImages = await Promise.all(
      template.images.map(async (imgConfig) => {
        const img = await getCachedImage(imgConfig.url);
        return { config: imgConfig, img };
      })
    );

    const attachments = await Promise.all(
        baseImages.map(async ({ config, img }, idx) => {
          const canvas = createCanvas(img.width, img.height);
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0);

          for (const text of config.texts) {
            const interpolatedText = interpolate(text.text, row);
            ctx.font = `${text.fontWeight || "normal"} ${text.fontSize}px ${text.fontFamily}`;
            ctx.fillStyle = text.color;
            ctx.textBaseline = "middle";

            const absX = (text.x / 100) * img.width;
            const absY = (text.y / 100) * img.height;
            const maxWidthPx = ((text.maxWidth || 0) / 100) * img.width;

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
            : `certificate_${rowIndex}_${idx + 1}.png`;

          return { filename, content: buffer };
        })
    );

    await transporter.sendMail({
      from: `"${account.orgName}" <${account.emailAddress}>`,
      to: recipientEmail,
      subject,
      html,
      attachments,
    });
    
    const successLog = { email: recipientEmail, status: "SUCCESS", rowIndex };
    
    if (historyId) {
        try {
            const history = await db.emailHistory.findUnique({ where: { id: historyId, userId: session.user.id } });
            if (history) {
                let parsedLogs: any[] = [];
                if (Array.isArray(history.logs)) {
                    parsedLogs = history.logs;
                } else if (typeof history.logs === "string") {
                    try { parsedLogs = JSON.parse(history.logs); } catch (e) {}
                }
                parsedLogs = parsedLogs.filter((l: any) => l.rowIndex !== rowIndex);
                parsedLogs.push(successLog);
                await db.emailHistory.update({
                    where: { id: historyId },
                    data: { logs: JSON.stringify(parsedLogs) }
                });
            }
        } catch (e) {
            console.error("Failed to update log on server side:", e);
        }
    }

    return { success: true, log: { email: recipientEmail, status: "SUCCESS" } };

  } catch (error: any) {
    console.error(`Dispatch error for ${recipientEmail}:`, error);
    const errorLog = { email: recipientEmail, status: "FAILED", error: error.message || "Failed to send", rowIndex };
    
    if (historyId) {
        try {
            const history = await db.emailHistory.findUnique({ where: { id: historyId, userId: session.user.id } });
            if (history) {
                let parsedLogs: any[] = [];
                if (Array.isArray(history.logs)) {
                    parsedLogs = history.logs;
                } else if (typeof history.logs === "string") {
                    try { parsedLogs = JSON.parse(history.logs); } catch (e) {}
                }
                parsedLogs = parsedLogs.filter((l: any) => l.rowIndex !== rowIndex);
                parsedLogs.push(errorLog);
                await db.emailHistory.update({
                    where: { id: historyId },
                    data: { logs: JSON.stringify(parsedLogs) }
                });
            }
        } catch (e) {
            console.error("Failed to update error log on server side:", e);
        }
    }

    return { success: false, log: { email: recipientEmail, status: "FAILED", error: error.message || "Failed to send" } };
  }
}

interface InitializeParams {
  accountId: string;
  template: EmailTemplate;
  data: ExcelRow[];
}

export async function initializeCampaign({ accountId, template, data }: InitializeParams) {
    const session = await getSession();
    if (!session) return { success: false, error: "Unauthorized" };

    try {
        const history = await db.emailHistory.create({
            data: {
              userId: session.user.id,
              accountId,
              subject: template.subject,
              bodyHtml: template.bodyHtml,
              imagesConfig: JSON.stringify(template.images),
              excelData: JSON.stringify(data),
              status: "PROCESSING",
              logs: JSON.stringify([]),
            },
        });
        
        return { success: true, historyId: history.id };
    } catch (error: any) {
        console.error("Failed to initialize campaign:", error);
        return { success: false, error: "Failed to initialize history" };
    }
}

interface UpdateHistoryParams {
  historyId: string;
  logs: any[];
  status: string;
  excelData?: ExcelRow[];
}

export async function updateCampaignProgress({ historyId, logs, status, excelData }: UpdateHistoryParams) {
    const session = await getSession();
    if (!session) return { success: false, error: "Unauthorized" };

    try {
        const dataToUpdate: any = {
            status,
            logs: JSON.stringify(logs),
        };
        
        if (excelData) {
            dataToUpdate.excelData = JSON.stringify(excelData);
        }

        await db.emailHistory.update({
            where: { id: historyId, userId: session.user.id },
            data: dataToUpdate,
        });

        if (status === "COMPLETED" || status.startsWith("CANCELLED")) {
            globalImageCache.clear();
            revalidatePath("/history");
        }
        
        return { success: true };
    } catch (error: any) {
        console.error("Failed to update campaign progress:", error);
        return { success: false, error: "Failed to update history" };
    }
}

export async function getCampaignHistory() {
    const session = await getSession();
    if (!session) return { success: false, error: "Unauthorized" };

    try {
        const history = await db.emailHistory.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: "desc" },
            take: 20,
            select: {
                id: true,
                subject: true,
                status: true,
                createdAt: true,
                accountId: true,
            }
        });
        return { success: true, history };
    } catch (error) {
        return { success: false, error: "Failed to fetch history" };
    }
}

export async function getCampaignDetails(id: string) {
    const session = await getSession();
    if (!session) return { success: false, error: "Unauthorized" };

    try {
        const campaign = await db.emailHistory.findUnique({
            where: { id, userId: session.user.id },
        });
        if (!campaign) return { success: false, error: "Campaign not found" };
        
        return { 
            success: true, 
            campaign: {
                ...campaign,
                imagesConfig: campaign.imagesConfig || [],
                excelData: campaign.excelData || [],
                logs: campaign.logs || []
            }
        };
    } catch (error) {
        return { success: false, error: "Failed to fetch details" };
    }
}
