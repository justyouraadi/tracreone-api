import { z } from "zod";

export const registerSchema = z.object({
  companyName: z.string().min(2).max(255),
  name: z.string().min(2).max(255),
  email: z.string().email(),
  password: z.string().min(8).max(255),
  phone: z.string().min(6).max(32).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export const otpRequestSchema = z.object({
  phone: z.string().min(6).max(32),
});

export const otpVerifySchema = z.object({
  phone: z.string().min(6).max(32),
  code: z.string().length(6),
  name: z.string().min(2).max(255).optional(),
});

export const googleAuthSchema = z.object({
  idToken: z.string().min(10),
});
