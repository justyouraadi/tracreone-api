import crypto from "node:crypto";

export function generateOtpCode(): string {
  return crypto.randomInt(100000, 999999).toString();
}

export function hashOtp(code: string): string {
  return crypto.createHash("sha256").update(code).digest("hex");
}
