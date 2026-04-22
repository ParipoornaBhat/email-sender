import crypto from "crypto";
import { env } from "@/env";

const ALGORITHM = "aes-256-cbc";
const IV_LENGTH = 16;

export function encrypt(text: string): string {
  if (!env.ENCRYPTION_KEY) {
    throw new Error("ENCRYPTION_KEY is not set in environment variables");
  }

  // Ensure key is 32 bytes
  const key = crypto.createHash('sha256').update(env.ENCRYPTION_KEY).digest();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  
  return `${iv.toString("hex")}:${encrypted}`;
}

export function decrypt(text: string): string {
  if (!env.ENCRYPTION_KEY) {
    throw new Error("ENCRYPTION_KEY is not set in environment variables");
  }

  const [ivHex, encryptedText] = text.split(":");
  if (!ivHex || !encryptedText) {
    throw new Error("Invalid encrypted text format");
  }

  const key = crypto.createHash('sha256').update(env.ENCRYPTION_KEY).digest();
  const iv = Buffer.from(ivHex, "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  
  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");
  
  return decrypted;
}
