import { Globe2, Palette, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { requireOrganization } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const context = await requireOrganization();
  const organization = context.activeOrganization as unknown as { id: string; name: string; slug: string; status: string; saas_plan: string };
  const supabase = await createClient();
  const [{ data: settings }, { data: domains }] = await Promise.all([
    supabase.from("organization_settings").select("locale, timezone, branding, lgpd, features").eq("organization_id", organization.id).maybeSingle(),
    supabase.from("domains").select("id, hostname, kind, status").eq("organization_id", organization.id).order("created_at"),
  ]);
  const cards = [{ icon: SlidersHorizontal, title: "Dados da academia", copy: `${organization.name} · plano ${organization.saas_plan}` },{ icon: Globe2, title: "Domínios", copy: domains?.map((item) => item.hostname).join(", ") || "Aguardando configuração" },{ icon: Palette, title: "Aparência", copy: "Identidade futurista inicial ativa" },{ icon: ShieldCheck, title: "LGPD e segurança", copy: settings?.locale ? `${settings.locale} · ${settings.timezone}` : "Políticas em preparação" }];
  return <><header><span className="text-[10px] font-bold tracking-[.16em] text-emerald-300">CENTRAL DA ORGANIZAÇÃO</span><h1 className="mt-2 text-4xl font-semibold tracking-[-.05em]">Configurações</h1><p className="mt-2 text-sm text-emerald-50/40">Fundação preparada para branding, domínios, integrações e LGPD.</p></header><section className="mt-8 grid gap-4 md:grid-cols-2">{cards.map(({ icon: Icon, title, copy }) => <article className="dashboard-panel p-5" key={title}><span className="grid size-10 place-items-center rounded-xl bg-emerald-300/10 text-emerald-300"><Icon size={18} /></span><h2 className="mt-5 font-semibold">{title}</h2><p className="mt-2 text-xs leading-5 text-emerald-50/35">{copy}</p><span className="mt-5 inline-block rounded-full border border-emerald-200/10 px-2 py-1 text-[8px] font-bold tracking-[.08em] text-emerald-100/35">BASE CONFIGURADA</span></article>)}</section></>;
}
