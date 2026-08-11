"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/auth/validation";

const onboardingSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome da academia."),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$/, "Use letras minúsculas, números e hífens."),
  legalName: z.string().trim().optional(),
  taxId: z.string().trim().optional(),
  branchName: z.string().trim().min(2, "Informe o nome da unidade principal."),
  city: z.string().trim().min(2, "Informe a cidade."),
  state: z.string().trim().length(2, "Use a sigla do estado."),
});

export async function createOrganizationAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = onboardingSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { status: "error", errors: parsed.error.flatten().fieldErrors };

  const supabase = await createClient();
  const { count } = await supabase
    .from("organization_memberships")
    .select("id", { count: "exact", head: true })
    .eq("profile_id", user.id)
    .eq("status", "active");

  if ((count ?? 0) > 0) redirect("/dashboard");

  const { error } = await supabase.rpc("create_organization_with_owner", {
    p_name: parsed.data.name,
    p_slug: parsed.data.slug,
    p_branch_name: parsed.data.branchName,
    p_legal_name: parsed.data.legalName || undefined,
    p_tax_id: parsed.data.taxId || undefined,
    p_city: parsed.data.city,
    p_state: parsed.data.state.toUpperCase(),
  });

  if (error) {
    const duplicate = error.code === "23505";
    return {
      status: "error",
      message: duplicate
        ? "Esse nome de endereço ou CNPJ já está em uso. Revise os dados."
        : "Não foi possível criar a academia. Tente novamente.",
    };
  }

  redirect("/dashboard");
}
