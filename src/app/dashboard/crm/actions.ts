"use server";

import { revalidatePath } from "next/cache";
import { requireOrganization } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export async function createLeadAction(formData: FormData) {
  const name = String(formData.get("full_name") || "").trim();
  if (name.length < 2) return;
  const context = await requireOrganization();
  const organization = context.activeOrganization as unknown as { id: string };
  const supabase = await createClient();
  await supabase.from("crm_leads" as never).insert({ organization_id: organization.id, full_name: name, email: String(formData.get("email") || "").trim() || null, phone: String(formData.get("phone") || "").trim() || null, interest: String(formData.get("interest") || "").trim() || null, source: String(formData.get("source") || "manual"), status: "new" } as never);
  revalidatePath("/dashboard/crm");
}

export async function updateLeadStatusAction(formData: FormData) {
  const context = await requireOrganization(); const organization = context.activeOrganization as unknown as { id: string };
  const leadId=String(formData.get("lead_id")||""); const status=String(formData.get("status")||"");
  if(!leadId||!["new","contacting","experimental_scheduled","proposal","won","lost"].includes(status))return;
  const supabase=await createClient(); await supabase.from("crm_leads" as never).update({status,last_contact_at:new Date().toISOString(),...(status==="lost"?{lost_at:new Date().toISOString()}:{})} as never).eq("id",leadId).eq("organization_id",organization.id); revalidatePath("/dashboard/crm");
}

export async function addLeadActivityAction(formData: FormData) {
  const context=await requireOrganization(); const organization=context.activeOrganization as unknown as{id:string}; const leadId=String(formData.get("lead_id")||"");const content=String(formData.get("content")||"").trim();if(!leadId||!content)return;
  const supabase=await createClient();await supabase.from("crm_activities" as never).insert({organization_id:organization.id,lead_id:leadId,actor_profile_id:context.user.id,type:"note",content} as never);revalidatePath("/dashboard/crm");
}

export async function convertLeadAction(formData: FormData) {
  const leadId=String(formData.get("lead_id")||"");if(!leadId)return;const supabase=await createClient();await supabase.rpc("convert_lead_to_member" as never,{p_lead_id:leadId,p_plan_id:String(formData.get("plan_id")||"")||null,p_branch_id:String(formData.get("branch_id")||"")||null} as never);revalidatePath("/dashboard/crm");revalidatePath("/dashboard/alunos");revalidatePath("/dashboard/financeiro");revalidatePath("/dashboard");
}
