"use server";

import { revalidatePath } from "next/cache";
import { requireOrganization } from "@/lib/auth/session";
import { createOperationalClient } from "@/lib/supabase/operational";
import type { ActionResult } from "./action-types";

type DatabaseError = { message?: string; code?: string } | null | undefined;

async function scope() {
  const context = await requireOrganization();
  return {
    organizationId: (context.activeOrganization as unknown as { id: string }).id,
    profileId: context.user.id,
    db: await createOperationalClient(),
  };
}

const text = (data: FormData, key: string) => String(data.get(key) || "").trim();
const optional = (data: FormData, key: string) => text(data, key) || null;
const number = (data: FormData, key: string) => {
  const parsed = Number(text(data, key).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
};
const cents = (value: string) => Math.round(Number(value.replace(",", ".")) * 100);
const ok = (message: string): ActionResult => ({ ok: true, message });
const fail = (message: string): ActionResult => ({ ok: false, message });
const errorMessage = (error: DatabaseError, fallback: string) => {
  if (!error) return fallback;
  if (error.code === "23505") return "Já existe um registro com esses dados.";
  if (error.code === "23503") return "O registro está vinculado a outro item e não pode ser alterado assim.";
  return fallback;
};

async function audit(
  db: Awaited<ReturnType<typeof createOperationalClient>>,
  organizationId: string,
  action: string,
  entityType: string,
  entityId?: string | number | null,
  metadata: Record<string, unknown> = {},
  branchId?: string | null,
) {
  await db.rpc("record_audit_event", {
    p_organization_id: organizationId,
    p_action: action,
    p_entity_type: entityType,
    p_entity_id: entityId == null ? null : String(entityId),
    p_metadata: metadata,
    p_branch_id: branchId || null,
  });
}

function refresh(...paths: string[]) {
  paths.forEach((path) => revalidatePath(path));
}

export async function createMemberAction(data: FormData): Promise<ActionResult> {
  const { db, organizationId } = await scope();
  const fullName = text(data, "full_name");
  if (fullName.length < 2) return fail("Informe o nome completo do aluno.");
  const branchId = optional(data, "branch_id");
  const { data: member, error } = await db.from("members").insert({ organization_id: organizationId, branch_id: branchId, full_name: fullName, email: optional(data, "email"), phone: optional(data, "phone"), cpf: optional(data, "cpf"), birth_date: optional(data, "birth_date"), goal: optional(data, "goal"), medical_notes: optional(data, "medical_notes"), status: "active" }).select("id").single();
  if (error || !member) return fail(errorMessage(error, "Não foi possível cadastrar o aluno."));
  await audit(db, organizationId, "members.created", "member", member.id, { full_name: fullName }, branchId);
  refresh("/dashboard/alunos", "/dashboard");
  return ok("Aluno cadastrado com sucesso.");
}

export async function updateMemberAction(data: FormData): Promise<ActionResult> {
  const { db, organizationId } = await scope();
  const memberId = text(data, "member_id");
  const fullName = text(data, "full_name");
  if (!memberId || fullName.length < 2) return fail("Dados do aluno inválidos.");
  const branchId = optional(data, "branch_id");
  const { error } = await db.from("members").update({ full_name: fullName, email: optional(data, "email"), phone: optional(data, "phone"), cpf: optional(data, "cpf"), birth_date: optional(data, "birth_date"), goal: optional(data, "goal"), medical_notes: optional(data, "medical_notes"), branch_id: branchId }).eq("id", memberId).eq("organization_id", organizationId);
  if (error) return fail(errorMessage(error, "Não foi possível atualizar o aluno."));
  await audit(db, organizationId, "members.updated", "member", memberId, {}, branchId);
  refresh("/dashboard/alunos", "/dashboard");
  return ok("Cadastro do aluno atualizado.");
}

export async function updateMemberStatusAction(data: FormData): Promise<ActionResult> {
  const { db, organizationId } = await scope();
  const memberId = text(data, "member_id");
  const status = text(data, "status");
  if (!memberId || !["active", "paused", "inactive", "cancelled"].includes(status)) return fail("Situação inválida.");
  const { error } = await db.from("members").update({ status, inactive_at: status === "active" ? null : new Date().toISOString() }).eq("id", memberId).eq("organization_id", organizationId);
  if (error) return fail("Não foi possível alterar a situação do aluno.");
  if (status === "cancelled") await db.from("subscriptions").update({ status: "cancelled", ends_on: new Date().toISOString().slice(0, 10) }).eq("member_id", memberId).eq("organization_id", organizationId).in("status", ["active", "paused", "overdue"]);
  await audit(db, organizationId, "members.status_changed", "member", memberId, { status });
  refresh("/dashboard/alunos", "/dashboard/planos-matriculas", "/dashboard");
  return ok("Situação do aluno atualizada.");
}

export async function createPlanAction(data: FormData): Promise<ActionResult> {
  const { db, organizationId } = await scope();
  const name = text(data, "name");
  const price = cents(text(data, "price"));
  if (name.length < 2 || !Number.isFinite(price) || price < 0) return fail("Informe nome e preço válidos.");
  const benefits = text(data, "benefits").split("\n").map((item) => item.trim()).filter(Boolean);
  const { data: plan, error } = await db.from("membership_plans").insert({ organization_id: organizationId, name, description: optional(data, "description"), price_cents: price, enrollment_fee_cents: Math.max(0, cents(text(data, "enrollment_fee") || "0")), billing_cycle: text(data, "billing_cycle") || "monthly", access_limit_per_week: number(data, "access_limit"), benefits }).select("id").single();
  if (error || !plan) return fail(errorMessage(error, "Não foi possível criar o plano."));
  await audit(db, organizationId, "plans.created", "membership_plan", plan.id, { name, price_cents: price });
  refresh("/dashboard/planos-matriculas");
  return ok("Plano criado e publicado no site da academia.");
}

export async function updatePlanStatusAction(data: FormData): Promise<ActionResult> {
  const { db, organizationId } = await scope();
  const planId = text(data, "plan_id");
  const active = text(data, "active") === "true";
  if (!planId) return fail("Plano inválido.");
  const { error } = await db.from("membership_plans").update({ active }).eq("id", planId).eq("organization_id", organizationId);
  if (error) return fail("Não foi possível alterar o plano.");
  await audit(db, organizationId, "plans.status_changed", "membership_plan", planId, { active });
  refresh("/dashboard/planos-matriculas", "/dashboard");
  return ok(active ? "Plano reativado." : "Plano arquivado para novas matrículas.");
}

export async function createSubscriptionAction(data: FormData): Promise<ActionResult> {
  const { db, organizationId } = await scope();
  const memberId = text(data, "member_id");
  const planId = text(data, "plan_id");
  if (!memberId || !planId) return fail("Selecione o aluno e o plano.");
  const { data: plan } = await db.from("membership_plans").select("price_cents").eq("id", planId).eq("organization_id", organizationId).eq("active", true).single();
  if (!plan) return fail("Plano não encontrado ou inativo.");
  const startsOn = text(data, "starts_on") || new Date().toISOString().slice(0, 10);
  const { data: subscription, error } = await db.from("subscriptions").insert({ organization_id: organizationId, member_id: memberId, plan_id: planId, branch_id: optional(data, "branch_id"), status: "active", starts_on: startsOn, next_billing_on: text(data, "next_billing_on") || startsOn, amount_cents: plan.price_cents, discount_cents: Math.max(0, cents(text(data, "discount") || "0")) }).select("id").single();
  if (error || !subscription) return fail(errorMessage(error, "Não foi possível ativar a matrícula."));
  await audit(db, organizationId, "subscriptions.created", "subscription", subscription.id, { member_id: memberId, plan_id: planId });
  refresh("/dashboard/planos-matriculas", "/dashboard/financeiro", "/dashboard");
  return ok("Matrícula ativada e primeira cobrança gerada.");
}

export async function updateSubscriptionStatusAction(data: FormData): Promise<ActionResult> {
  const { db, organizationId } = await scope();
  const subscriptionId = text(data, "subscription_id");
  const status = text(data, "status");
  if (!subscriptionId || !["active", "paused", "overdue", "cancelled", "ended"].includes(status)) return fail("Situação de matrícula inválida.");
  const { error } = await db.from("subscriptions").update({ status, ends_on: ["cancelled", "ended"].includes(status) ? new Date().toISOString().slice(0, 10) : null }).eq("id", subscriptionId).eq("organization_id", organizationId);
  if (error) return fail("Não foi possível atualizar a matrícula.");
  await audit(db, organizationId, "subscriptions.status_changed", "subscription", subscriptionId, { status });
  refresh("/dashboard/planos-matriculas", "/dashboard/financeiro", "/dashboard");
  return ok("Situação da matrícula atualizada.");
}

export async function registerPaymentAction(data: FormData): Promise<ActionResult> {
  const { db, organizationId } = await scope();
  const invoiceId = text(data, "invoice_id");
  if (!invoiceId) return fail("Cobrança inválida.");
  const { data: invoice } = await db.from("invoices").select("amount_cents,status").eq("id", invoiceId).eq("organization_id", organizationId).single();
  if (!invoice || invoice.status === "paid") return fail("Cobrança não encontrada ou já recebida.");
  const { error } = await db.from("payments").insert({ organization_id: organizationId, invoice_id: invoiceId, amount_cents: invoice.amount_cents, method: text(data, "method") || "pix", status: "confirmed", transaction_reference: optional(data, "reference") });
  if (error) return fail("Não foi possível registrar o pagamento.");
  await db.from("invoices").update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", invoiceId).eq("organization_id", organizationId);
  await audit(db, organizationId, "billing.payment_confirmed", "invoice", invoiceId, { method: text(data, "method") || "pix", amount_cents: invoice.amount_cents });
  refresh("/dashboard/financeiro", "/dashboard", "/dashboard/relatorios");
  return ok("Recebimento confirmado.");
}

export async function updateInvoiceStatusAction(data: FormData): Promise<ActionResult> {
  const { db, organizationId } = await scope();
  const invoiceId = text(data, "invoice_id");
  const status = text(data, "status");
  if (!invoiceId || !["open", "cancelled", "refunded"].includes(status)) return fail("Situação de cobrança inválida.");
  const { error } = await db.from("invoices").update({ status, paid_at: null }).eq("id", invoiceId).eq("organization_id", organizationId);
  if (error) return fail("Não foi possível atualizar a cobrança.");
  await audit(db, organizationId, "billing.invoice_status_changed", "invoice", invoiceId, { status });
  refresh("/dashboard/financeiro", "/dashboard");
  return ok("Cobrança atualizada.");
}

export async function createExpenseAction(data: FormData): Promise<ActionResult> {
  const { db, organizationId, profileId } = await scope();
  const description = text(data, "description");
  const amountCents = cents(text(data, "amount"));
  if (description.length < 2 || !Number.isFinite(amountCents) || amountCents <= 0) return fail("Informe descrição e valor válidos.");
  const branchId = optional(data, "branch_id");
  const status = text(data, "status") === "paid" ? "paid" : "planned";
  const { data: expense, error } = await db.from("expenses").insert({ organization_id: organizationId, branch_id: branchId, category: text(data, "category") || "operational", description, supplier: optional(data, "supplier"), amount_cents: amountCents, due_date: text(data, "due_date") || new Date().toISOString().slice(0, 10), status, payment_method: optional(data, "payment_method"), paid_at: status === "paid" ? new Date().toISOString() : null, notes: optional(data, "notes"), created_by: profileId }).select("id").single();
  if (error || !expense) return fail(errorMessage(error, "Não foi possível registrar a despesa."));
  await audit(db, organizationId, "billing.expense_created", "expense", expense.id, { amount_cents: amountCents }, branchId);
  refresh("/dashboard/financeiro", "/dashboard/relatorios");
  return ok("Despesa registrada.");
}

export async function updateExpenseStatusAction(data: FormData): Promise<ActionResult> {
  const { db, organizationId } = await scope();
  const expenseId = text(data, "expense_id");
  const status = text(data, "status");
  if (!expenseId || !["planned", "paid", "cancelled"].includes(status)) return fail("Situação de despesa inválida.");
  const { error } = await db.from("expenses").update({ status, paid_at: status === "paid" ? new Date().toISOString() : null }).eq("id", expenseId).eq("organization_id", organizationId);
  if (error) return fail("Não foi possível atualizar a despesa.");
  await audit(db, organizationId, "billing.expense_status_changed", "expense", expenseId, { status });
  refresh("/dashboard/financeiro", "/dashboard/relatorios");
  return ok("Despesa atualizada.");
}

export async function createClassAction(data: FormData): Promise<ActionResult> {
  const { db, organizationId } = await scope();
  const title = text(data, "title"), startsAt = text(data, "starts_at"), branchId = text(data, "branch_id");
  if (!title || !startsAt || !branchId) return fail("Informe aula, unidade e horário.");
  const start = new Date(startsAt);
  if (Number.isNaN(start.getTime())) return fail("Horário inválido.");
  const end = new Date(start.getTime() + (number(data, "duration") || 60) * 60000);
  const { data: session, error } = await db.from("class_sessions").insert({ organization_id: organizationId, branch_id: branchId, title, starts_at: start.toISOString(), ends_at: end.toISOString(), capacity: number(data, "capacity") || 20, status: "scheduled" }).select("id").single();
  if (error || !session) return fail(errorMessage(error, "Não foi possível agendar a aula."));
  await audit(db, organizationId, "classes.created", "class_session", session.id, { title }, branchId);
  refresh("/dashboard/agenda", "/dashboard");
  return ok("Aula agendada.");
}

export async function updateClassStatusAction(data: FormData): Promise<ActionResult> {
  const { db, organizationId } = await scope();
  const sessionId = text(data, "session_id"), status = text(data, "status");
  if (!sessionId || !["scheduled", "in_progress", "completed", "cancelled"].includes(status)) return fail("Situação de aula inválida.");
  const { error } = await db.from("class_sessions").update({ status }).eq("id", sessionId).eq("organization_id", organizationId);
  if (error) return fail("Não foi possível atualizar a aula.");
  if (status === "cancelled") await db.from("class_bookings").update({ status: "cancelled" }).eq("session_id", sessionId).eq("organization_id", organizationId).in("status", ["booked", "waitlist"]);
  await audit(db, organizationId, "classes.status_changed", "class_session", sessionId, { status });
  refresh("/dashboard/agenda", "/dashboard");
  return ok("Aula atualizada.");
}

export async function bookClassAction(data: FormData): Promise<ActionResult> {
  const { db, organizationId } = await scope();
  const sessionId = text(data, "session_id"), memberId = text(data, "member_id");
  if (!sessionId || !memberId) return fail("Selecione aula e aluno.");
  const [{ data: session }, { count }] = await Promise.all([db.from("class_sessions").select("capacity,status").eq("id", sessionId).eq("organization_id", organizationId).single(), db.from("class_bookings").select("id", { count: "exact", head: true }).eq("session_id", sessionId).in("status", ["booked", "attended"])]);
  if (!session || session.status !== "scheduled") return fail("Aula indisponível para reserva.");
  const status = (count || 0) >= session.capacity ? "waitlist" : "booked";
  const { error } = await db.from("class_bookings").upsert({ organization_id: organizationId, session_id: sessionId, member_id: memberId, status }, { onConflict: "session_id,member_id" });
  if (error) return fail(errorMessage(error, "Não foi possível confirmar a reserva."));
  await audit(db, organizationId, "classes.booking_created", "class_session", sessionId, { member_id: memberId, status });
  refresh("/dashboard/agenda");
  return ok(status === "waitlist" ? "Turma cheia: aluno incluído na lista de espera." : "Reserva confirmada.");
}

export async function updateBookingStatusAction(data: FormData): Promise<ActionResult> {
  const { db, organizationId } = await scope();
  const bookingId = text(data, "booking_id"), status = text(data, "status");
  if (!bookingId || !["booked", "waitlist", "attended", "no_show", "cancelled"].includes(status)) return fail("Situação de reserva inválida.");
  const { error } = await db.from("class_bookings").update({ status, checked_in_at: status === "attended" ? new Date().toISOString() : null }).eq("id", bookingId).eq("organization_id", organizationId);
  if (error) return fail("Não foi possível atualizar a presença.");
  await audit(db, organizationId, "classes.booking_status_changed", "class_booking", bookingId, { status });
  refresh("/dashboard/agenda");
  return ok("Presença atualizada.");
}

export async function createExerciseAction(data: FormData): Promise<ActionResult> {
  const { db, organizationId } = await scope(); const name = text(data, "name");
  if (!name) return fail("Informe o nome do exercício.");
  const { data: exercise, error } = await db.from("exercises").insert({ organization_id: organizationId, name, muscle_group: optional(data, "muscle_group"), equipment: optional(data, "equipment"), instructions: optional(data, "instructions") }).select("id").single();
  if (error || !exercise) return fail(errorMessage(error, "Não foi possível adicionar o exercício."));
  await audit(db, organizationId, "training.exercise_created", "exercise", exercise.id, { name }); refresh("/dashboard/treinos"); return ok("Exercício adicionado à biblioteca.");
}

export async function createWorkoutAction(data: FormData): Promise<ActionResult> {
  const { db, organizationId } = await scope(); const name = text(data, "name");
  if (!name) return fail("Informe o nome da ficha.");
  const { data: workout, error } = await db.from("workout_templates").insert({ organization_id: organizationId, name, goal: optional(data, "goal"), level: optional(data, "level"), notes: optional(data, "notes") }).select("id").single();
  if (error || !workout) return fail("Não foi possível criar a ficha.");
  await audit(db, organizationId, "training.workout_created", "workout", workout.id, { name }); refresh("/dashboard/treinos"); return ok("Ficha de treino criada.");
}

export async function addWorkoutItemAction(data: FormData): Promise<ActionResult> {
  const { db, organizationId } = await scope(); const workoutId = text(data, "workout_id"), exerciseId = text(data, "exercise_id");
  if (!workoutId || !exerciseId) return fail("Selecione a ficha e o exercício.");
  const { error } = await db.from("workout_items").insert({ workout_id: workoutId, exercise_id: exerciseId, sequence: number(data, "sequence") || 1, sets: number(data, "sets"), reps: optional(data, "reps"), load_guidance: optional(data, "load_guidance"), rest_seconds: number(data, "rest_seconds"), notes: optional(data, "notes") });
  if (error) return fail(errorMessage(error, "Não foi possível incluir o exercício."));
  await audit(db, organizationId, "training.workout_item_created", "workout", workoutId, { exercise_id: exerciseId }); refresh("/dashboard/treinos"); return ok("Exercício incluído na ficha.");
}

export async function assignWorkoutAction(data: FormData): Promise<ActionResult> {
  const { db, organizationId, profileId } = await scope(); const memberId = text(data, "member_id"), workoutId = text(data, "workout_id");
  if (!memberId || !workoutId) return fail("Selecione o aluno e a ficha.");
  await db.from("member_workouts").update({ status: "completed", ends_on: new Date().toISOString().slice(0, 10) }).eq("organization_id", organizationId).eq("member_id", memberId).eq("status", "active");
  const { data: assignment, error } = await db.from("member_workouts").insert({ organization_id: organizationId, member_id: memberId, workout_id: workoutId, assigned_by: profileId, starts_on: text(data, "starts_on") || new Date().toISOString().slice(0, 10), ends_on: optional(data, "ends_on"), status: "active" }).select("id").single();
  if (error || !assignment) return fail("Não foi possível prescrever o treino.");
  await audit(db, organizationId, "training.workout_assigned", "member_workout", assignment.id, { member_id: memberId, workout_id: workoutId }); refresh("/dashboard/treinos"); return ok("Treino prescrito ao aluno.");
}

export async function updateWorkoutAssignmentAction(data: FormData): Promise<ActionResult> {
  const { db, organizationId } = await scope(); const assignmentId = text(data, "assignment_id"), status = text(data, "status");
  if (!assignmentId || !["active", "completed", "cancelled"].includes(status)) return fail("Situação de treino inválida.");
  const { error } = await db.from("member_workouts").update({ status, ends_on: status === "active" ? null : new Date().toISOString().slice(0, 10) }).eq("id", assignmentId).eq("organization_id", organizationId);
  if (error) return fail("Não foi possível atualizar a prescrição.");
  await audit(db, organizationId, "training.assignment_status_changed", "member_workout", assignmentId, { status }); refresh("/dashboard/treinos"); return ok("Prescrição atualizada.");
}

export async function createAssessmentAction(data: FormData): Promise<ActionResult> {
  const { db, organizationId, profileId } = await scope(); const memberId = text(data, "member_id");
  if (!memberId) return fail("Selecione o aluno.");
  const measurements = { chest: number(data, "chest"), waist: number(data, "waist"), hip: number(data, "hip"), arm: number(data, "arm"), thigh: number(data, "thigh") };
  const { data: assessment, error } = await db.from("physical_assessments").insert({ organization_id: organizationId, member_id: memberId, assessor_profile_id: profileId, weight_kg: number(data, "weight"), height_cm: number(data, "height"), body_fat_percent: number(data, "body_fat"), measurements, notes: optional(data, "notes") }).select("id").single();
  if (error || !assessment) return fail("Não foi possível registrar a avaliação.");
  await audit(db, organizationId, "training.assessment_created", "physical_assessment", assessment.id, { member_id: memberId }); refresh("/dashboard/avaliacoes"); return ok("Avaliação física registrada.");
}

export async function registerAccessAction(data: FormData): Promise<ActionResult> {
  const { db, organizationId } = await scope(); const memberId = text(data, "member_id"), branchId = text(data, "branch_id"), requestedDirection = text(data, "direction") || "entry";
  if (!memberId || !branchId || !["entry", "exit"].includes(requestedDirection)) return fail("Selecione aluno, unidade e movimento.");
  const [{ data: member }, { data: subscription }, { data: overdue }, { data: settings }] = await Promise.all([db.from("members").select("status").eq("id", memberId).eq("organization_id", organizationId).single(), db.from("subscriptions").select("id").eq("organization_id", organizationId).eq("member_id", memberId).eq("status", "active").limit(1).maybeSingle(), db.from("invoices").select("id").eq("organization_id", organizationId).eq("member_id", memberId).in("status", ["open", "overdue"]).lt("due_date", new Date().toISOString().slice(0, 10)).limit(1), db.from("organization_settings").select("features").eq("organization_id", organizationId).single()]);
  if (!member) return fail("Aluno não encontrado.");
  const features = (settings?.features ?? {}) as { require_active_subscription?: boolean; block_overdue_access?: boolean };
  let direction = requestedDirection, reason = optional(data, "reason");
  if (requestedDirection === "entry" && text(data, "override") !== "true") { if (member.status !== "active") { direction = "denied"; reason = "Aluno inativo"; } else if (features.require_active_subscription !== false && !subscription) { direction = "denied"; reason = "Sem matrícula ativa"; } else if (features.block_overdue_access === true && overdue?.length) { direction = "denied"; reason = "Pendência financeira"; } }
  const { data: event, error } = await db.from("access_events").insert({ organization_id: organizationId, branch_id: branchId, member_id: memberId, direction, method: "manual", reason }).select("id").single();
  if (error || !event) return fail("Não foi possível registrar o acesso.");
  await audit(db, organizationId, direction === "denied" ? "access.denied" : `access.${direction}`, "access_event", event.id, { member_id: memberId, reason, override: text(data, "override") === "true" }, branchId); refresh("/dashboard/acesso", "/dashboard");
  return ok(direction === "denied" ? `Acesso negado: ${reason}.` : direction === "exit" ? "Saída registrada." : "Acesso liberado.");
}

export async function generateInvoicesAction(): Promise<ActionResult> {
  const { db, organizationId } = await scope(); const { data, error } = await db.rpc("generate_due_invoices", { p_organization_id: organizationId });
  if (error) return fail("Não foi possível gerar as recorrências.");
  await audit(db, organizationId, "billing.recurring_invoices_generated", "invoice", null, { count: data || 0 }); refresh("/dashboard/financeiro", "/dashboard"); return ok(`${data || 0} nova(s) cobrança(s) gerada(s).`);
}

export async function createContractAction(data: FormData): Promise<ActionResult> {
  const { db, organizationId } = await scope(); const memberId = text(data, "member_id");
  if (!memberId) return fail("Selecione o aluno.");
  const { data: contract, error } = await db.from("member_contracts").insert({ organization_id: organizationId, member_id: memberId, subscription_id: optional(data, "subscription_id"), title: text(data, "title") || "Contrato de prestação de serviços", terms_version: text(data, "terms_version") || "1.0", status: "pending" }).select("id").single();
  if (error || !contract) return fail("Não foi possível gerar o contrato.");
  await audit(db, organizationId, "contracts.created", "member_contract", contract.id, { member_id: memberId }); refresh("/dashboard/planos-matriculas"); return ok("Pendência de aceite criada.");
}

export async function updateContractStatusAction(data: FormData): Promise<ActionResult> {
  const { db, organizationId } = await scope(); const contractId = text(data, "contract_id"), status = text(data, "status");
  if (!contractId || !["pending", "accepted", "cancelled", "expired"].includes(status)) return fail("Situação de contrato inválida.");
  const { error } = await db.from("member_contracts").update({ status, accepted_at: status === "accepted" ? new Date().toISOString() : null }).eq("id", contractId).eq("organization_id", organizationId);
  if (error) return fail("Não foi possível atualizar o contrato.");
  await audit(db, organizationId, "contracts.status_changed", "member_contract", contractId, { status }); refresh("/dashboard/planos-matriculas"); return ok("Contrato atualizado.");
}

export async function createCampaignAction(data: FormData): Promise<ActionResult> {
  const { db, organizationId, profileId } = await scope(); const name = text(data, "name"), message = text(data, "message");
  if (!name || !message) return fail("Informe nome e mensagem.");
  const { data: campaign, error } = await db.from("communication_campaigns").insert({ organization_id: organizationId, name, channel: text(data, "channel") || "whatsapp", audience: text(data, "audience") || "active", message, status: "draft", scheduled_at: optional(data, "scheduled_at"), created_by: profileId }).select("id").single();
  if (error || !campaign) return fail("Não foi possível salvar a campanha.");
  await audit(db, organizationId, "relationship.campaign_created", "campaign", campaign.id, { name }); refresh("/dashboard/relacionamento"); return ok("Campanha salva como rascunho.");
}

export async function updateCampaignStatusAction(data: FormData): Promise<ActionResult> {
  const { db, organizationId } = await scope(); const campaignId = text(data, "campaign_id"), status = text(data, "status");
  if (!campaignId || !["draft", "scheduled", "sent", "cancelled"].includes(status)) return fail("Situação de campanha inválida.");
  const { error } = await db.from("communication_campaigns").update({ status, sent_at: status === "sent" ? new Date().toISOString() : null, scheduled_at: status === "scheduled" ? optional(data, "scheduled_at") || new Date().toISOString() : null }).eq("id", campaignId).eq("organization_id", organizationId);
  if (error) return fail("Não foi possível atualizar a campanha.");
  await audit(db, organizationId, "relationship.campaign_status_changed", "campaign", campaignId, { status }); refresh("/dashboard/relacionamento"); return ok(status === "sent" ? "Campanha marcada como executada manualmente." : "Campanha atualizada.");
}

export async function refreshRetentionAction(): Promise<ActionResult> {
  const { db, organizationId } = await scope(); const { data, error } = await db.rpc("refresh_retention_tasks", { p_organization_id: organizationId });
  if (error) return fail("Não foi possível atualizar as oportunidades de retenção."); refresh("/dashboard/relacionamento"); return ok(`${data || 0} nova(s) ação(ões) identificada(s).`);
}

export async function updateRetentionTaskAction(data: FormData): Promise<ActionResult> {
  const { db, organizationId } = await scope(); const taskId = text(data, "task_id"), status = text(data, "status") || "done";
  if (!taskId || !["open", "in_progress", "done", "cancelled"].includes(status)) return fail("Situação de tarefa inválida.");
  const { error } = await db.from("retention_tasks").update({ status, notes: optional(data, "notes") }).eq("id", taskId).eq("organization_id", organizationId);
  if (error) return fail("Não foi possível atualizar a ação."); await audit(db, organizationId, "relationship.task_status_changed", "retention_task", taskId, { status }); refresh("/dashboard/relacionamento"); return ok("Ação de retenção atualizada.");
}

export const completeRetentionTaskAction = updateRetentionTaskAction;

export async function createBranchAction(data: FormData): Promise<ActionResult> {
  const { db, organizationId } = await scope(); const name = text(data, "name");
  if (name.length < 2) return fail("Informe o nome da unidade.");
  const baseSlug = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); const slug = `${baseSlug}-${Date.now().toString(36).slice(-4)}`;
  const address = { street: optional(data, "street"), number: optional(data, "number"), neighborhood: optional(data, "neighborhood"), city: optional(data, "city"), state: text(data, "state").toUpperCase() || null, zip: optional(data, "zip") };
  const { data: branch, error } = await db.from("branches").insert({ organization_id: organizationId, name, slug, status: "active", phone: optional(data, "phone"), email: optional(data, "email"), address }).select("id").single();
  if (error || !branch) return fail(errorMessage(error, "Não foi possível criar a unidade.")); await audit(db, organizationId, "branches.created", "branch", branch.id, { name }, branch.id); refresh("/dashboard/unidades", "/dashboard/configuracoes", "/dashboard"); return ok("Unidade criada.");
}

export async function updateBranchAction(data: FormData): Promise<ActionResult> {
  const { db, organizationId } = await scope(); const branchId = text(data, "branch_id"), name = text(data, "name"), status = text(data, "status") || "active";
  if (!branchId || name.length < 2 || !["active", "inactive"].includes(status)) return fail("Dados da unidade inválidos.");
  const address = { street: optional(data, "street"), number: optional(data, "number"), neighborhood: optional(data, "neighborhood"), city: optional(data, "city"), state: text(data, "state").toUpperCase() || null, zip: optional(data, "zip") };
  const { error } = await db.from("branches").update({ name, status, phone: optional(data, "phone"), email: optional(data, "email"), timezone: text(data, "timezone") || "America/Bahia", address }).eq("id", branchId).eq("organization_id", organizationId);
  if (error) return fail("Não foi possível atualizar a unidade."); await audit(db, organizationId, "branches.updated", "branch", branchId, { name, status }, branchId); refresh("/dashboard/unidades", "/dashboard/configuracoes", "/dashboard"); return ok("Unidade atualizada.");
}

export async function createTeamInvitationAction(data: FormData): Promise<ActionResult> {
  const { db, organizationId } = await scope(); const email = text(data, "email").toLowerCase(), roleId = text(data, "role_id");
  if (!email || !roleId) return fail("Informe e-mail e função.");
  const { error } = await db.rpc("create_team_invitation", { p_organization_id: organizationId, p_email: email, p_role_id: roleId, p_branch_id: optional(data, "branch_id") });
  if (error) return fail(errorMessage(error, "Não foi possível criar o convite.")); refresh("/dashboard/equipe"); return ok("Convite criado. O profissional entra ou cria a conta usando esse mesmo e-mail.");
}

export async function updateTeamInvitationAction(data: FormData): Promise<ActionResult> {
  const { db, organizationId } = await scope(); const invitationId = text(data, "invitation_id"), status = text(data, "status");
  if (!invitationId || !["pending", "cancelled"].includes(status)) return fail("Convite inválido.");
  const { error } = await db.from("team_invitations").update({ status }).eq("id", invitationId).eq("organization_id", organizationId);
  if (error) return fail("Não foi possível atualizar o convite."); await audit(db, organizationId, "team.invitation_status_changed", "team_invitation", invitationId, { status }); refresh("/dashboard/equipe"); return ok("Convite atualizado.");
}

export async function updateTeamMembershipAction(data: FormData): Promise<ActionResult> {
  const { db, organizationId, profileId } = await scope(); const membershipId = text(data, "membership_id"), status = text(data, "status");
  if (!membershipId || !["active", "suspended"].includes(status)) return fail("Situação de acesso inválida.");
  const { data: membership } = await db.from("organization_memberships").select("profile_id").eq("id", membershipId).eq("organization_id", organizationId).single();
  if (!membership) return fail("Profissional não encontrado."); if (membership.profile_id === profileId && status === "suspended") return fail("Você não pode suspender o próprio acesso.");
  const { error } = await db.from("organization_memberships").update({ status }).eq("id", membershipId).eq("organization_id", organizationId);
  if (error) return fail("Não foi possível alterar o acesso."); await audit(db, organizationId, "team.membership_status_changed", "membership", membershipId, { status }); refresh("/dashboard/equipe"); return ok("Acesso da equipe atualizado.");
}

export async function updateOrganizationAction(data: FormData): Promise<ActionResult> {
  const { db, organizationId } = await scope(); const { data: current } = await db.from("organization_settings").select("branding,features,lgpd").eq("organization_id", organizationId).single();
  const lines = (key: string) => text(data, key).split("\n").map((item) => item.trim()).filter(Boolean); const structured = (key: string, fields: string[]) => lines(key).map((line) => { const parts = line.split("|").map((item) => item.trim()); return Object.fromEntries(fields.map((field, index) => [field, parts[index] || ""])); });
  const branding = { ...((current?.branding || {}) as Record<string, unknown>), logo_url: optional(data, "logo_url"), hero_image_url: optional(data, "hero_image_url"), eyebrow: optional(data, "eyebrow"), headline: optional(data, "headline"), headline_accent: optional(data, "headline_accent"), description: optional(data, "description"), primary_color: text(data, "primary_color") || "#5dff9f", instagram: optional(data, "instagram"), hours: lines("hours"), modalities: structured("modalities", ["title", "description"]), team: structured("team", ["name", "role", "specialty"]), faq: structured("faq", ["question", "answer"]), differentials: lines("differentials"), seo_title: optional(data, "seo_title"), seo_description: optional(data, "seo_description") };
  const features = { ...((current?.features || {}) as Record<string, unknown>), block_overdue_access: text(data, "block_overdue_access") === "true", require_active_subscription: text(data, "require_active_subscription") !== "false", trial_class_enabled: text(data, "trial_class_enabled") !== "false" };
  const lgpd = { ...((current?.lgpd || {}) as Record<string, unknown>), contact: optional(data, "lgpd_contact"), privacy_version: text(data, "privacy_version") || "1.0" }; const name = text(data, "name");
  if (name.length < 2) return fail("Informe o nome da academia.");
  const [{ error: organizationError }, { error: settingsError }] = await Promise.all([db.from("organizations").update({ name, legal_name: optional(data, "legal_name"), tax_id: optional(data, "tax_id"), phone: optional(data, "phone"), email: optional(data, "email") }).eq("id", organizationId), db.from("organization_settings").update({ branding, features, lgpd, locale: text(data, "locale") || "pt-BR", timezone: text(data, "timezone") || "America/Bahia" }).eq("organization_id", organizationId)]);
  if (organizationError || settingsError) return fail(errorMessage(organizationError || settingsError, "Não foi possível salvar as configurações.")); await audit(db, organizationId, "organization.settings_updated", "organization", organizationId); refresh("/dashboard/configuracoes", "/dashboard", `/academia/${text(data, "slug")}`); return ok("Configurações salvas e site atualizado.");
}
