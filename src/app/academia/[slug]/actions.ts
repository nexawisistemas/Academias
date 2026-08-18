"use server";

import { redirect } from "next/navigation";
import { createOperationalClient } from "@/lib/supabase/operational";

export async function captureGymLeadAction(formData: FormData) {
  const slug=String(formData.get("slug")||"");const fullName=String(formData.get("full_name")||"").trim();if(!slug||fullName.length<2)return;
  const db=await createOperationalClient();const {error}=await db.rpc("capture_public_lead",{p_slug:slug,p_full_name:fullName,p_email:String(formData.get("email")||"")||null,p_phone:String(formData.get("phone")||"")||null,p_interest:String(formData.get("interest")||"")||null});
  redirect(`/academia/${slug}?${error?"erro=1":"enviado=1"}`);
}
