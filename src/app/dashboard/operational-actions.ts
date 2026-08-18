"use server";

import { revalidatePath } from "next/cache";
import { requireOrganization } from "@/lib/auth/session";
import { createOperationalClient } from "@/lib/supabase/operational";

async function scope() {
  const context = await requireOrganization();
  return { organizationId: (context.activeOrganization as unknown as { id: string }).id, profileId: context.user.id, db: await createOperationalClient() };
}
const text = (data: FormData, key: string) => String(data.get(key) || "").trim();
const cents = (value: string) => Math.round(Number(value.replace(",", ".")) * 100);

export async function createMemberAction(data: FormData) {
  const { db, organizationId } = await scope(); const fullName = text(data,"full_name"); if(fullName.length < 2) return;
  await db.from("members").insert({ organization_id: organizationId, branch_id: text(data,"branch_id") || null, full_name: fullName, email: text(data,"email") || null, phone: text(data,"phone") || null, cpf: text(data,"cpf") || null, goal: text(data,"goal") || null, status:"active" });
  revalidatePath("/dashboard/alunos"); revalidatePath("/dashboard");
}
export async function createPlanAction(data: FormData) {
  const { db, organizationId } = await scope(); const name=text(data,"name"); if(name.length<2) return;
  await db.from("membership_plans").insert({ organization_id:organizationId,name,description:text(data,"description")||null,price_cents:cents(text(data,"price")),billing_cycle:text(data,"billing_cycle")||"monthly",access_limit_per_week:Number(text(data,"access_limit"))||null });
  revalidatePath("/dashboard/planos-matriculas");
}
export async function createSubscriptionAction(data: FormData) {
  const { db, organizationId }=await scope(); const memberId=text(data,"member_id"),planId=text(data,"plan_id"); if(!memberId||!planId) return;
  const { data: plan }=await db.from("membership_plans").select("price_cents").eq("id",planId).eq("organization_id",organizationId).single();
  await db.from("subscriptions").insert({organization_id:organizationId,member_id:memberId,plan_id:planId,branch_id:text(data,"branch_id")||null,status:"active",starts_on:new Date().toISOString().slice(0,10),next_billing_on:new Date().toISOString().slice(0,10),amount_cents:plan?.price_cents??0});
  revalidatePath("/dashboard/planos-matriculas"); revalidatePath("/dashboard/financeiro");
}
export async function registerPaymentAction(data: FormData) {
  const { db,organizationId }=await scope(); const invoiceId=text(data,"invoice_id"); if(!invoiceId)return;
  const { data: invoice }=await db.from("invoices").select("amount_cents").eq("id",invoiceId).eq("organization_id",organizationId).single(); if(!invoice)return;
  await db.from("payments").insert({organization_id:organizationId,invoice_id:invoiceId,amount_cents:invoice.amount_cents,method:text(data,"method")||"pix",status:"confirmed"});
  await db.from("invoices").update({status:"paid",paid_at:new Date().toISOString()}).eq("id",invoiceId).eq("organization_id",organizationId);
  revalidatePath("/dashboard/financeiro"); revalidatePath("/dashboard");
}
export async function createClassAction(data: FormData) {
  const { db,organizationId }=await scope(); const title=text(data,"title"),startsAt=text(data,"starts_at"); if(!title||!startsAt)return;
  const start=new Date(startsAt); const end=new Date(start.getTime()+(Number(text(data,"duration"))||60)*60000);
  await db.from("class_sessions").insert({organization_id:organizationId,branch_id:text(data,"branch_id"),title,starts_at:start.toISOString(),ends_at:end.toISOString(),capacity:Number(text(data,"capacity"))||20,status:"scheduled"});
  revalidatePath("/dashboard/agenda");
}
export async function createExerciseAction(data: FormData) {
  const {db,organizationId}=await scope(); const name=text(data,"name"); if(!name)return;
  await db.from("exercises").insert({organization_id:organizationId,name,muscle_group:text(data,"muscle_group")||null,equipment:text(data,"equipment")||null,instructions:text(data,"instructions")||null}); revalidatePath("/dashboard/treinos");
}
export async function createWorkoutAction(data: FormData) {
  const {db,organizationId}=await scope(); const name=text(data,"name"); if(!name)return;
  await db.from("workout_templates").insert({organization_id:organizationId,name,goal:text(data,"goal")||null,level:text(data,"level")||null,notes:text(data,"notes")||null}); revalidatePath("/dashboard/treinos");
}
export async function assignWorkoutAction(data: FormData) {
  const {db,organizationId,profileId}=await scope(); const memberId=text(data,"member_id"),workoutId=text(data,"workout_id"); if(!memberId||!workoutId)return;
  await db.from("member_workouts").insert({organization_id:organizationId,member_id:memberId,workout_id:workoutId,assigned_by:profileId,status:"active"}); revalidatePath("/dashboard/treinos");
}
export async function createAssessmentAction(data: FormData) {
  const {db,organizationId,profileId}=await scope(); const memberId=text(data,"member_id"); if(!memberId)return;
  await db.from("physical_assessments").insert({organization_id:organizationId,member_id:memberId,assessor_profile_id:profileId,weight_kg:Number(text(data,"weight"))||null,height_cm:Number(text(data,"height"))||null,body_fat_percent:Number(text(data,"body_fat"))||null,notes:text(data,"notes")||null}); revalidatePath("/dashboard/avaliacoes");
}
export async function registerAccessAction(data: FormData) {
  const {db,organizationId}=await scope(); const memberId=text(data,"member_id"),branchId=text(data,"branch_id"); if(!memberId||!branchId)return;
  const {data: overdue}=await db.from("invoices").select("id").eq("organization_id",organizationId).eq("member_id",memberId).in("status",["open","overdue"]).lt("due_date",new Date().toISOString().slice(0,10)).limit(1);
  await db.from("access_events").insert({organization_id:organizationId,branch_id:branchId,member_id:memberId,direction:overdue?.length?"denied":"entry",method:"manual",reason:overdue?.length?"Pendência financeira":null}); revalidatePath("/dashboard/acesso"); revalidatePath("/dashboard");
}
export async function generateInvoicesAction(){const{db,organizationId}=await scope();await db.rpc("generate_due_invoices",{p_organization_id:organizationId});revalidatePath("/dashboard/financeiro");revalidatePath("/dashboard");}
export async function createContractAction(data:FormData){const{db,organizationId}=await scope();const memberId=text(data,"member_id");if(!memberId)return;await db.from("member_contracts").insert({organization_id:organizationId,member_id:memberId,subscription_id:text(data,"subscription_id")||null,title:text(data,"title")||"Contrato de prestação de serviços",terms_version:text(data,"terms_version")||"1.0",status:"pending"});revalidatePath("/dashboard/planos-matriculas");}
export async function bookClassAction(data:FormData){const{db,organizationId}=await scope();const sessionId=text(data,"session_id"),memberId=text(data,"member_id");if(!sessionId||!memberId)return;await db.from("class_bookings").upsert({organization_id:organizationId,session_id:sessionId,member_id:memberId,status:"booked"},{onConflict:"session_id,member_id"});revalidatePath("/dashboard/agenda");}
export async function addWorkoutItemAction(data:FormData){const{db}=await scope();const workoutId=text(data,"workout_id"),exerciseId=text(data,"exercise_id");if(!workoutId||!exerciseId)return;await db.from("workout_items").insert({workout_id:workoutId,exercise_id:exerciseId,sequence:Number(text(data,"sequence"))||1,sets:Number(text(data,"sets"))||null,reps:text(data,"reps")||null,rest_seconds:Number(text(data,"rest_seconds"))||null});revalidatePath("/dashboard/treinos");}
export async function createCampaignAction(data:FormData){const{db,organizationId,profileId}=await scope();const name=text(data,"name"),message=text(data,"message");if(!name||!message)return;await db.from("communication_campaigns").insert({organization_id:organizationId,name,channel:text(data,"channel")||"whatsapp",audience:text(data,"audience")||"active",message,status:"draft",created_by:profileId});revalidatePath("/dashboard/relacionamento");}
export async function refreshRetentionAction(){const{db,organizationId}=await scope();await db.rpc("refresh_retention_tasks",{p_organization_id:organizationId});revalidatePath("/dashboard/relacionamento");}
export async function completeRetentionTaskAction(data:FormData){const{db,organizationId}=await scope();await db.from("retention_tasks").update({status:"done"}).eq("id",text(data,"task_id")).eq("organization_id",organizationId);revalidatePath("/dashboard/relacionamento");}
export async function createBranchAction(data:FormData){const{db,organizationId}=await scope();const name=text(data,"name");if(name.length<2)return;const slug=name.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");await db.from("branches").insert({organization_id:organizationId,name,slug,status:"active",phone:text(data,"phone")||null,email:text(data,"email")||null,address:{city:text(data,"city")||null,state:text(data,"state").toUpperCase()||null}});revalidatePath("/dashboard/unidades");}
export async function updateOrganizationAction(data:FormData){const{db,organizationId}=await scope();await db.from("organizations").update({name:text(data,"name"),phone:text(data,"phone")||null,email:text(data,"email")||null}).eq("id",organizationId);await db.from("organization_settings").update({branding:{headline:text(data,"headline")||null,description:text(data,"description")||null,primary_color:text(data,"primary_color")||"#5dff9f"}}).eq("organization_id",organizationId);revalidatePath("/dashboard/configuracoes");revalidatePath("/dashboard");}
