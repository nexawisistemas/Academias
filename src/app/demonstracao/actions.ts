"use server";

import { redirect } from "next/navigation";
import { createOperationalClient } from "@/lib/supabase/operational";

const value = (form: FormData, key: string) => String(form.get(key) || "").trim();

export async function capturePlatformLeadAction(formData: FormData) {
  if (value(formData, "website")) redirect("/demonstracao?enviado=1");
  const fullName = value(formData, "full_name");
  const email = value(formData, "email");
  const phone = value(formData, "phone");
  if (fullName.length < 2 || (!email && !phone)) redirect("/demonstracao?erro=dados");
  const db = await createOperationalClient();
  const { error } = await db.rpc("capture_platform_lead", {
    p_full_name: fullName,
    p_business_name: value(formData, "business_name") || null,
    p_email: email || null,
    p_phone: phone || null,
    p_units_count: Math.max(1, Number(value(formData, "units_count")) || 1),
    p_students_count: Number(value(formData, "students_count")) || null,
    p_interest: value(formData, "interest") || null,
  });
  redirect(`/demonstracao?${error ? "erro=envio" : "enviado=1"}`);
}
