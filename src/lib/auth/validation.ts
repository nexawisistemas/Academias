import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email("Informe um e-mail válido."),
  password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres."),
  next: z.string().optional(),
});

export const signupSchema = z.object({
  fullName: z.string().trim().min(2, "Informe seu nome completo."),
  email: z.string().trim().email("Informe um e-mail válido."),
  password: z
    .string()
    .min(8, "Use pelo menos 8 caracteres.")
    .regex(/[A-Z]/, "Inclua uma letra maiúscula.")
    .regex(/[a-z]/, "Inclua uma letra minúscula.")
    .regex(/[0-9]/, "Inclua um número."),
  terms: z.literal("on", { error: "Você precisa aceitar os termos e a política de privacidade." }),
});

export const emailSchema = z.object({
  email: z.string().trim().email("Informe um e-mail válido."),
});

export const passwordSchema = z.object({
  password: z
    .string()
    .min(8, "Use pelo menos 8 caracteres.")
    .regex(/[A-Z]/, "Inclua uma letra maiúscula.")
    .regex(/[a-z]/, "Inclua uma letra minúscula.")
    .regex(/[0-9]/, "Inclua um número."),
});

export function safeNextPath(value: unknown, fallback = "/dashboard") {
  const path = typeof value === "string" ? value : "";
  return path.startsWith("/") && !path.startsWith("//") ? path : fallback;
}

export type ActionState = {
  status?: "error" | "success";
  message?: string;
  errors?: Record<string, string[]>;
};
