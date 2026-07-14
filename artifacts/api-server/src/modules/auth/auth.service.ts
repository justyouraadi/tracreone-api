import { prisma } from "../../config/prisma";
import { hashPassword, verifyPassword } from "../../lib/password";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
  generateOpaqueId,
  REFRESH_TOKEN_TTL_SECONDS,
} from "../../lib/jwt";
import { generateOtpCode, hashOtp } from "../../lib/otp";
import { ApiError } from "../../middlewares/errorHandler";
import { logger } from "../../lib/logger";

const OTP_TTL_MINUTES = 5;
const MAX_OTP_ATTEMPTS = 5;

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || `company-${Date.now()}`
  );
}

async function uniqueSlug(base: string): Promise<string> {
  let slug = slugify(base);
  let suffix = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const candidate = suffix === 0 ? slug : `${slug}-${suffix}`;
    const existing = await prisma.company.findUnique({ where: { slug: candidate } });
    if (!existing) return candidate;
    suffix += 1;
  }
}

async function issueTokenPair(user: { id: number; companyId: number | null; role: string }) {
  const accessToken = signAccessToken({ sub: user.id, companyId: user.companyId, role: user.role });
  const jti = generateOpaqueId();
  const refreshToken = signRefreshToken({ sub: user.id, jti });

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000),
    },
  });

  return { accessToken, refreshToken };
}

export async function registerCompanyOwner(input: {
  companyName: string;
  name: string;
  email: string;
  password: string;
  phone?: string;
}) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw new ApiError(409, "An account with this email already exists");

  const slug = await uniqueSlug(input.companyName);
  const passwordHash = await hashPassword(input.password);

  const user = await prisma.$transaction(async (tx) => {
    const company = await tx.company.create({ data: { name: input.companyName, slug } });
    return tx.user.create({
      data: {
        companyId: company.id,
        name: input.name,
        email: input.email,
        phone: input.phone,
        passwordHash,
        role: "owner",
      },
    });
  });

  const tokens = await issueTokenPair(user);
  logger.info({ userId: user.id, companyId: user.companyId }, "New company registered");
  return { user, ...tokens };
}

export async function loginWithPassword(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash) throw new ApiError(401, "Invalid email or password");
  if (!user.isActive) throw new ApiError(403, "This account has been deactivated");

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) throw new ApiError(401, "Invalid email or password");

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  const tokens = await issueTokenPair(user);
  return { user, ...tokens };
}

export async function refreshSession(refreshToken: string) {
  let payload: { sub: number; jti: string };
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new ApiError(401, "Invalid or expired refresh token");
  }

  const tokenHash = hashToken(refreshToken);
  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });
  if (!stored || stored.revoked || stored.expiresAt < new Date()) {
    throw new ApiError(401, "Refresh token is no longer valid");
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user || !user.isActive) throw new ApiError(401, "Account is no longer active");

  await prisma.refreshToken.update({ where: { id: stored.id }, data: { revoked: true } });
  const tokens = await issueTokenPair(user);
  return { user, ...tokens };
}

export async function logout(refreshToken: string) {
  const tokenHash = hashToken(refreshToken);
  await prisma.refreshToken.updateMany({ where: { tokenHash }, data: { revoked: true } });
}

export async function requestOtp(phone: string) {
  const code = generateOtpCode();
  await prisma.otpCode.create({
    data: {
      phone,
      codeHash: hashOtp(code),
      expiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000),
    },
  });

  // NOTE: no SMS provider is configured. The code is logged server-side only
  // until an SMS/OTP delivery integration (e.g. Twilio, MSG91) is connected.
  logger.info({ phone }, "OTP generated (SMS delivery not configured)");
  return { expiresInMinutes: OTP_TTL_MINUTES };
}

export async function verifyOtp(phone: string, code: string, name?: string) {
  const otp = await prisma.otpCode.findFirst({
    where: { phone, consumed: false },
    orderBy: { createdAt: "desc" },
  });

  if (!otp || otp.expiresAt < new Date()) throw new ApiError(400, "OTP has expired or was not requested");
  if (otp.attempts >= MAX_OTP_ATTEMPTS) throw new ApiError(429, "Too many incorrect attempts");

  if (otp.codeHash !== hashOtp(code)) {
    await prisma.otpCode.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } });
    throw new ApiError(400, "Incorrect OTP code");
  }

  await prisma.otpCode.update({ where: { id: otp.id }, data: { consumed: true } });

  let user = await prisma.user.findFirst({ where: { phone } });
  if (!user) {
    user = await prisma.user.create({
      data: { name: name ?? `User ${phone}`, email: `${phone}@otp.tracre.local`, phone, role: "agent" },
    });
  }

  const tokens = await issueTokenPair(user);
  return { user, ...tokens };
}

export function toPublicUser(user: { id: number; companyId: number | null; name: string; email: string; role: string; phone: string | null }) {
  return {
    id: user.id,
    companyId: user.companyId,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
  };
}
