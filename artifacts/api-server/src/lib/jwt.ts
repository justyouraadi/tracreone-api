import crypto from "node:crypto";
import jwt from "jsonwebtoken";

const sessionSecret = process.env.SESSION_SECRET;

if (!sessionSecret) {
  throw new Error("SESSION_SECRET must be set to sign authentication tokens.");
}

function deriveSecret(purpose: string): string {
  return crypto.createHash("sha256").update(`${sessionSecret}:${purpose}`).digest("hex");
}

const ACCESS_SECRET = deriveSecret("jwt-access");
const REFRESH_SECRET = deriveSecret("jwt-refresh");

export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
export const REFRESH_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60;

export interface AccessTokenPayload {
  sub: number;
  companyId: number | null;
  role: string;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_TOKEN_TTL_SECONDS });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, ACCESS_SECRET) as unknown as AccessTokenPayload;
}

export function signRefreshToken(payload: { sub: number; jti: string }): string {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_TTL_SECONDS });
}

export function verifyRefreshToken(token: string): { sub: number; jti: string } {
  return jwt.verify(token, REFRESH_SECRET) as unknown as { sub: number; jti: string };
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function generateOpaqueId(): string {
  return crypto.randomUUID();
}
