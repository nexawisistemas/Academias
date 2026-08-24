"use server";

import { revalidatePath } from "next/cache";
import { requirePlatformAdmin } from "@/lib/auth/session";
import { createOperationalClient } from "@/lib/supabase/operational";
import { company, marketingPlans } from "@/lib/marketing-config";

const value=(form:FormData,key:string)=>String(form.get(key)||"").trim();
const optional=(form:FormData,key:string)=>value(form,key)||undefined;

export async function updatePlatformSiteAction(formData:FormData){
  await requirePlatformAdmin();
  const db=await createOperationalClient();
  const companySettings={...company,tradeName:value(formData,"trade_name")||company.tradeName,legalName:value(formData,"legal_name")||company.legalName,taxId:value(formData,"tax_id")||company.taxId,city:value(formData,"city")||company.city,state:value(formData,"state")||company.state,email:value(formData,"email")||company.email,supportEmail:value(formData,"support_email")||company.supportEmail,whatsapp:value(formData,"whatsapp").replace(/\D/g,"")||company.whatsapp,whatsappDisplay:value(formData,"whatsapp_display")||company.whatsappDisplay,serviceHours:value(formData,"service_hours")||company.serviceHours,logoUrl:optional(formData,"logo_url")};
  const analytics={googleAnalyticsId:optional(formData,"google_analytics_id"),googleTagManagerId:optional(formData,"google_tag_manager_id"),metaPixelId:optional(formData,"meta_pixel_id"),searchConsoleVerification:optional(formData,"search_console_verification"),chatWidgetUrl:optional(formData,"chat_widget_url")};
  await db.from("platform_site_settings").upsert({id:"main",company:companySettings,plans:marketingPlans,analytics,conversion:{primary:"demo",trialDays:7,commitmentMonths:6},legal:{privacyVersion:"1.0",termsVersion:"1.0",contact:companySettings.email}});
  revalidatePath("/","layout"); revalidatePath("/planos"); revalidatePath("/dashboard/plataforma");
}

export async function updatePlatformLeadStatusAction(formData:FormData){
  await requirePlatformAdmin();const db=await createOperationalClient();
  const id=value(formData,"id"),status=value(formData,"status");
  if(!id||!["new","contacting","demo_scheduled","proposal","won","lost"].includes(status))return;
  await db.from("platform_leads").update({status}).eq("id",id);revalidatePath("/dashboard/plataforma");
}
