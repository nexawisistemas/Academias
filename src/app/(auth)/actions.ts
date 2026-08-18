"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  emailSchema,
  loginSchema,
  passwordSchema,
  safeNextPath,
  signupSchema,
  type ActionState,
} from "@/lib/auth/validation";

function fields(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

function signupErrorMessage(error: { message: string; code?: string; status?: number }) {
  const message = error.message.toLowerCase();

  if (message.includes("already registered") || message.includes("already exists")) {
    return "Este e-mail já possui uma conta. Entre ou recupere sua senha para continuar.";
  }

  if (message.includes("rate limit") || message.includes("security purposes")) {
    return "Muitas tentativas foram feitas agora. Aguarde alguns minutos antes de tentar novamente.";
  }

  if (message.includes("signup is disabled") || message.includes("signups not allowed")) {
    return "O cadastro por e-mail está desativado no momento. Verifique essa opção no Supabase.";
  }

  if (message.includes("redirect") || message.includes("redirect_to")) {
    return "A URL de confirmação ainda não está autorizada. Verifique a configuração de URLs no Supabase.";
  }

  return "Não foi possível criar a conta agora. Tente novamente em alguns minutos.";
}

export async function loginAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse(fields(formData));
  if (!parsed.success) return { status: "error", errors: parsed.error.flatten().fieldErrors };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) return { status: "error", message: "E-mail ou senha inválidos." };
  redirect(safeNextPath(parsed.data.next));
}

export async function signupAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = signupSchema.safeParse(fields(formData));
  if (!parsed.success) return { status: "error", errors: parsed.error.flatten().fieldErrors };

  const supabase = await createClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
      emailRedirectTo: `${appUrl}/auth/callback?next=/onboarding`,
    },
  });

  if (error) {
    console.error("[auth.signup]", { code: error.code, status: error.status });
    return { status: "error", message: signupErrorMessage(error) };
  }
  if (!data.session) return { status: "success", message: "Conta criada. Confirme seu e-mail para continuar." };
  redirect("/onboarding");
}

export async function requestPasswordResetAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = emailSchema.safeParse(fields(formData));
  if (!parsed.success) return { status: "error", errors: parsed.error.flatten().fieldErrors };

  const supabase = await createClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${appUrl}/auth/callback?next=/login/nova-senha`,
  });

  return { status: "success", message: "Se o e-mail estiver cadastrado, você receberá as instruções de recuperação." };
}

export async function updatePasswordAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = passwordSchema.safeParse(fields(formData));
  if (!parsed.success) return { status: "error", errors: parsed.error.flatten().fieldErrors };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { status: "error", message: "O link expirou ou a senha não pôde ser atualizada." };
  redirect("/dashboard");
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
