"use server";

import { revalidatePath } from "next/cache";
import { requireOrganization } from "@/lib/auth/session";
import { createOperationalClient } from "@/lib/supabase/operational";
import type { ActionResult } from "../action-types";

const ok = (message: string): ActionResult => ({ ok: true, message });
const fail = (message: string): ActionResult => ({ ok: false, message });
const text = (data: FormData, key: string) => String(data.get(key) || "").trim();
const optional = (data: FormData, key: string) => text(data, key) || null;

async function scope() {
  const context = await requireOrganization();
  return { context, db: await createOperationalClient(), organizationId: (context.activeOrganization as unknown as { id: string }).id };
}
async function audit(db: Awaited<ReturnType<typeof createOperationalClient>>, organizationId: string, action: string, leadId: string, metadata: Record<string, unknown> = {}) {
  await db.rpc("record_audit_event", { p_organization_id: organizationId, p_action: action, p_entity_type: "crm_lead", p_entity_id: leadId, p_metadata: metadata, p_branch_id: null });
}

export async function createLeadAction(data: FormData): Promise<ActionResult> {
  const name = text(data, "full_name");
  if (name.length < 2) return fail("Informe o nome do lead.");
  const { context, db, organizationId } = await scope();
  const { data: lead, error } = await db.from("crm_leads").insert({ organization_id: organizationId, owner_profile_id: context.user.id, branch_id: optional(data, "branch_id"), full_name: name, email: optional(data, "email"), phone: optional(data, "phone"), interest: optional(data, "interest"), source: text(data, "source") || "manual", status: "new", next_action_at: optional(data, "next_action_at") }).select("id").single();
  if (error || !lead) return fail("Não foi possível cadastrar o lead. Confira os dados.");
  await audit(db, organizationId, "crm.lead_created", lead.id);
  revalidatePath("/dashboard/crm"); return ok("Lead cadastrado no funil.");
}

export async function updateLeadStatusAction(data: FormData): Promise<ActionResult> {
  const { db, organizationId } = await scope(); const leadId = text(data, "lead_id"), status = text(data, "status");
  if (!leadId || !["new", "contacting", "experimental_scheduled", "proposal", "won", "lost"].includes(status)) return fail("Etapa comercial inválida.");
  const now = new Date().toISOString();
  const { error } = await db.from("crm_leads").update({ status, last_contact_at: now, won_at: status === "won" ? now : null, lost_at: status === "lost" ? now : null }).eq("id", leadId).eq("organization_id", organizationId);
  if (error) return fail("Não foi possível mover o lead.");
  await audit(db, organizationId, "crm.lead_status_changed", leadId, { status }); revalidatePath("/dashboard/crm"); return ok("Etapa comercial atualizada.");
}

export async function updateLeadDetailsAction(data: FormData): Promise<ActionResult> {
  const { db, organizationId } = await scope(); const leadId = text(data, "lead_id"), name = text(data, "full_name");
  if (!leadId || name.length < 2) return fail("Informe um nome válido.");
  const source = text(data, "source") || "manual";
  if (!["manual", "site", "whatsapp", "instagram", "indicacao", "trafego_pago", "outro"].includes(source)) return fail("Origem inválida.");
  const { error } = await db.from("crm_leads").update({ full_name: name, email: optional(data, "email"), phone: optional(data, "phone"), interest: optional(data, "interest"), notes: optional(data, "notes"), branch_id: optional(data, "branch_id"), source, next_action_at: optional(data, "next_action_at") }).eq("id", leadId).eq("organization_id", organizationId);
  if (error) return fail("Não foi possível salvar os detalhes.");
  await audit(db, organizationId, "crm.lead_updated", leadId); revalidatePath("/dashboard/crm"); return ok("Dados e próxima ação atualizados.");
}

export async function addLeadActivityAction(data: FormData): Promise<ActionResult> {
  const { context, db, organizationId } = await scope(); const leadId = text(data, "lead_id"), content = text(data, "content");
  if (!leadId || !content) return fail("Escreva a interação realizada.");
  const type = text(data, "type") || "note";
  if (!["note", "call", "whatsapp", "email", "visit", "follow_up"].includes(type)) return fail("Tipo de interação inválido.");
  const { error } = await db.from("crm_activities").insert({ organization_id: organizationId, lead_id: leadId, actor_profile_id: context.user.id, type, content });
  if (error) return fail("Não foi possível registrar a interação.");
  await audit(db, organizationId, "crm.activity_created", leadId, { type }); revalidatePath("/dashboard/crm"); return ok("Interação adicionada ao histórico.");
}

export async function convertLeadAction(data: FormData): Promise<ActionResult> {
  const leadId = text(data, "lead_id"); if (!leadId) return fail("Lead não identificado.");
  const { db, organizationId } = await scope();
  const { data: memberId, error } = await db.rpc("convert_lead_to_member", { p_lead_id: leadId, p_plan_id: optional(data, "plan_id"), p_branch_id: optional(data, "branch_id") });
  if (error) return fail(error.message.includes("convertido") ? "Este lead já foi convertido." : "Não foi possível converter o lead.");
  await audit(db, organizationId, "crm.lead_converted", leadId, { member_id: memberId });
  revalidatePath("/dashboard/crm"); revalidatePath("/dashboard/alunos"); revalidatePath("/dashboard/financeiro"); revalidatePath("/dashboard"); return ok("Lead convertido em aluno com sucesso.");
}
