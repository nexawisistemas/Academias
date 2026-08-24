import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function getCurrentUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  return error ? null : data.user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function getUserContext() {
  const user = await requireUser();
  const supabase = await createClient();

  const [{ data: profile }, { data: memberships, error }] = await Promise.all([
    supabase.from("profiles").select("id, full_name, phone, avatar_path, platform_role").eq("id", user.id).maybeSingle(),
    supabase
      .from("organization_memberships")
      .select("id, organization_id, status, organization:organizations(id, name, slug, status, saas_plan, trial_ends_at), membership_roles(id, branch_id, role:roles(id, code, name, scope), branch:branches(id, name, slug, is_main))")
      .eq("profile_id", user.id)
      .eq("status", "active")
      .order("created_at", { ascending: true }),
  ]);

  if (error) throw new Error("Não foi possível carregar o contexto da organização.");

  return {
    user,
    profile,
    memberships: memberships ?? [],
    activeMembership: memberships?.[0] ?? null,
    activeOrganization: memberships?.[0]?.organization ?? null,
  };
}

export async function requireOrganization() {
  const context = await getUserContext();
  if (!context.activeOrganization) redirect("/onboarding");
  return context;
}

export async function requirePlatformAdmin() {
  const context = await getUserContext();
  if (!isPlatformOperator(context)) redirect("/dashboard");
  return context;
}

export function isPlatformOperator(context: Awaited<ReturnType<typeof getUserContext>>) {
  if (context.profile?.platform_role === "super_admin") return true;
  return context.memberships.some((membership) => {
    const organization = membership.organization as unknown as { slug?: string } | null;
    const roles = (membership.membership_roles ?? []) as unknown as Array<{ role?: { code?: string } | null }>;
    return organization?.slug === "smart-tech" && roles.some((item) => item.role?.code === "owner");
  });
}
