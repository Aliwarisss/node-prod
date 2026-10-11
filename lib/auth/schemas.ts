import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Enter a valid email address.").trim().toLowerCase(),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export const registerSchema = z.object({
  firstName: z.string().trim().min(2, "First name must be at least 2 characters."),
  lastName: z.string().trim().min(2, "Last name must be at least 2 characters."),
  email: z.email("Enter a valid email address.").trim().toLowerCase(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .regex(/[A-Z]/, "Password must include an uppercase letter.")
    .regex(/[a-z]/, "Password must include a lowercase letter.")
    .regex(/[0-9]/, "Password must include a number."),
  primaryTrack: z.string().trim().min(3, "Choose a primary track."),
  ref: z.string().trim().max(20).optional().default(""), // a referral code, if someone invited them
});

/* a partial profile save: the onboarding saves step by step, and any step can be skipped — so every field is optional,
   and an empty one clears it; a filled one must be valid */
const blank = z.literal("");
const opt = <T extends z.ZodType>(s: T) => z.union([blank, s]).optional();
const choices = z.array(z.string().trim().min(1).max(60)).max(12).optional();
export const profilePatchSchema = z.object({
  name: opt(z.string().trim().min(3, "Enter your full name.").max(80)),
  phone: opt(z.string().trim().regex(/^\+?[0-9 ()-]{7,20}$/, "Enter a phone number, e.g. +92 300 1234567.")),
  linkedin: opt(
    z.string().trim()
      .transform((v) => (/^https?:\/\//i.test(v) ? v : `https://${v}`))
      .pipe(z.url("Enter your LinkedIn profile link.").refine((v) => /(^|\.)linkedin\.com$/i.test(new URL(v).hostname), "That isn’t a LinkedIn link — e.g. linkedin.com/in/your-name.")),
  ),
  timezone: opt(z.string().trim().min(2).max(40)),
  experienceLevel: opt(z.string().trim().min(2).max(40)),
  bio: opt(z.string().trim().min(24, "Write at least a couple of lines (24 characters).").max(1200)),
  primaryTrack: opt(z.string().trim().min(3).max(40)),
  weeklyHours: opt(z.string().trim().min(1).max(20)),
  learningGoal: opt(z.string().trim().min(12, "Say a little more (12 characters).").max(400)),
  aiTools: choices,
  device: opt(z.string().trim().min(2).max(40)),
  sessionTimes: choices,
  targetRole: opt(z.string().trim().min(2).max(60)),
  interests: choices,
});

export type ProfilePatch = z.infer<typeof profilePatchSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
