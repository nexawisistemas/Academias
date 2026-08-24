import { ExternalLink, Globe2, Palette, Save, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { requireOrganization } from "@/lib/auth/session";
import { createOperationalClient } from "@/lib/supabase/operational";
import { ActionForm } from "../action-form";
import { updateOrganizationAction } from "../operational-actions";
import { buttonClass, inputClass, PageTitle } from "../ui";

type Branding = {
  logo_url?: string; hero_image_url?: string; eyebrow?: string; headline?: string; headline_accent?: string;
  description?: string; primary_color?: string; instagram?: string; hours?: string[];
  modalities?: Array<{ title: string; description: string }>;
  team?: Array<{ name: string; role: string; specialty: string }>;
  faq?: Array<{ question: string; answer: string }>; differentials?: string[]; seo_title?: string; seo_description?: string;
};
type FeatureSettings = { block_overdue_access?: boolean; require_active_subscription?: boolean; trial_class_enabled?: boolean };
type LgpdSettings = { contact?: string; privacy_version?: string };

export default async function SettingsPage() {
  const context = await requireOrganization();
  const activeOrganization = context.activeOrganization as unknown as { id: string; name: string; slug: string };
  const db = await createOperationalClient();
  const [{ data: organization }, { data: settings }, { data: domain }] = await Promise.all([
    db.from("organizations").select("name,legal_name,tax_id,email,phone,slug").eq("id", activeOrganization.id).single(),
    db.from("organization_settings").select("branding,features,lgpd,locale,timezone").eq("organization_id", activeOrganization.id).single(),
    db.from("domains").select("hostname,status").eq("organization_id", activeOrganization.id).order("created_at").limit(1).maybeSingle(),
  ]);
  const branding = (settings?.branding ?? {}) as Branding;
  const features = (settings?.features ?? {}) as FeatureSettings;
  const lgpd = (settings?.lgpd ?? {}) as LgpdSettings;

  return <>
    <PageTitle eyebrow="IDENTIDADE E OPERAÇÃO" title="Configurações da academia" description="Controle a marca, o site público, as regras operacionais, a privacidade e a localização em um único lugar." />
    <section className="mt-8 grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
      <ActionForm action={updateOrganizationAction} className="dashboard-panel grid gap-6 p-5">
        <input type="hidden" name="slug" value={organization?.slug ?? activeOrganization.slug} />
        <SettingsSection icon={<Palette size={19} />} title="Marca e contato" description="Informações institucionais e identidade exibidas aos alunos.">
          <Field label="NOME DA ACADEMIA" name="name" value={organization?.name ?? ""} required />
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="RAZÃO SOCIAL" name="legal_name" value={organization?.legal_name ?? ""} />
            <Field label="CNPJ" name="tax_id" value={organization?.tax_id ?? ""} />
            <Field label="E-MAIL" name="email" type="email" value={organization?.email ?? ""} />
            <Field label="TELEFONE / WHATSAPP" name="phone" value={organization?.phone ?? ""} />
          </div>
          <Field label="URL DA LOGO" name="logo_url" value={branding.logo_url ?? ""} placeholder="/images/minha-logo.svg ou https://..." />
          <Field label="IMAGEM PRINCIPAL DO SITE" name="hero_image_url" value={branding.hero_image_url ?? ""} placeholder="https://..." />
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="FRASE SUPERIOR" name="eyebrow" value={branding.eyebrow ?? ""} />
            <Field label="COR PRINCIPAL" name="primary_color" type="color" value={branding.primary_color ?? "#5dff9f"} />
          </div>
          <Field label="HEADLINE PRINCIPAL" name="headline" value={branding.headline ?? "Treine. Evolua. Viva melhor."} />
          <Field label="SEGUNDA LINHA DA HEADLINE" name="headline_accent" value={branding.headline_accent ?? "Sua melhor fase começa aqui."} />
          <Area label="DESCRIÇÃO" name="description" value={branding.description ?? ""} />
          <Field label="INSTAGRAM" name="instagram" value={branding.instagram ?? ""} />
        </SettingsSection>

        <SettingsSection icon={<Globe2 size={19} />} title="Conteúdo do site" description="Cada linha atualiza automaticamente a página pública da academia.">
          <Area label="HORÁRIOS — UMA LINHA POR ITEM" name="hours" value={(branding.hours ?? []).join("\n")} />
          <Area label="MODALIDADES — TÍTULO | DESCRIÇÃO" name="modalities" rows={5} value={(branding.modalities ?? []).map((item) => `${item.title} | ${item.description}`).join("\n")} />
          <Area label="EQUIPE — NOME | FUNÇÃO | ESPECIALIDADE" name="team" rows={5} value={(branding.team ?? []).map((item) => `${item.name} | ${item.role} | ${item.specialty}`).join("\n")} />
          <Area label="DIFERENCIAIS — UM POR LINHA" name="differentials" rows={5} value={(branding.differentials ?? []).join("\n")} />
          <Area label="FAQ — PERGUNTA | RESPOSTA" name="faq" rows={6} value={(branding.faq ?? []).map((item) => `${item.question} | ${item.answer}`).join("\n")} />
          <Field label="TÍTULO SEO" name="seo_title" value={branding.seo_title ?? ""} />
          <Area label="DESCRIÇÃO SEO" name="seo_description" value={branding.seo_description ?? ""} />
        </SettingsSection>

        <SettingsSection icon={<SlidersHorizontal size={19} />} title="Regras operacionais" description="Defina as proteções usadas nos fluxos de acesso e captação.">
          <div className="grid gap-3 md:grid-cols-2">
            <Select label="EXIGIR MATRÍCULA ATIVA" name="require_active_subscription" value={features.require_active_subscription === false ? "false" : "true"} options={[{ value: "true", label: "Sim" }, { value: "false", label: "Não" }]} />
            <Select label="BLOQUEAR INADIMPLENTES" name="block_overdue_access" value={features.block_overdue_access ? "true" : "false"} options={[{ value: "true", label: "Sim" }, { value: "false", label: "Não" }]} />
            <Select label="AULA EXPERIMENTAL" name="trial_class_enabled" value={features.trial_class_enabled === false ? "false" : "true"} options={[{ value: "true", label: "Ativa" }, { value: "false", label: "Desativada" }]} />
            <Field label="VERSÃO DA POLÍTICA" name="privacy_version" value={lgpd.privacy_version ?? "1.0"} />
          </div>
          <Field label="CONTATO LGPD" name="lgpd_contact" type="email" value={lgpd.contact ?? organization?.email ?? ""} />
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="IDIOMA / LOCALIDADE" name="locale" value={settings?.locale ?? "pt-BR"} />
            <Field label="FUSO HORÁRIO" name="timezone" value={settings?.timezone ?? "America/Bahia"} />
          </div>
        </SettingsSection>
        <button className={buttonClass}><Save size={15} />Salvar e atualizar site</button>
      </ActionForm>

      <aside className="dashboard-panel h-fit p-5 xl:sticky xl:top-24">
        <Globe2 size={20} className="text-cyan-300" /><h2 className="mt-5 font-semibold">Presença digital</h2>
        <div className="mt-5 grid gap-3 text-xs">
          <div className="rounded-xl bg-black/15 p-4"><span className="text-emerald-50/35">Site público</span><a className="mt-2 block font-bold text-emerald-300" target="_blank" rel="noreferrer" href={`/academia/${organization?.slug ?? activeOrganization.slug}`}>/academia/{organization?.slug ?? activeOrganization.slug} <ExternalLink className="inline" size={12} /></a></div>
          <div className="rounded-xl bg-black/15 p-4"><span className="text-emerald-50/35">Domínio</span><strong className="mt-2 block">{domain?.hostname ?? "Não configurado"}</strong><span className="mt-1 block text-[9px] text-emerald-300">{domain?.status?.toUpperCase() ?? "PENDENTE"}</span></div>
          <div className="rounded-xl bg-black/15 p-4"><span className="text-emerald-50/35">Localidade</span><strong className="mt-2 block">{settings?.locale ?? "pt-BR"} · {settings?.timezone ?? "America/Bahia"}</strong></div>
          <div className="rounded-xl border border-emerald-300/15 bg-emerald-300/5 p-4 text-emerald-50/60"><ShieldCheck size={16} className="mb-2 text-emerald-300" />As regras de acesso e privacidade são aplicadas à operação depois de salvar.</div>
          <div className="rounded-xl border border-amber-300/15 bg-amber-300/5 p-4 text-amber-100/65">Substitua todos os dados demonstrativos por informações reais antes de divulgar o endereço público.</div>
        </div>
      </aside>
    </section>
  </>;
}

function SettingsSection({ icon, title, description, children }: { icon: React.ReactNode; title: string; description: string; children: React.ReactNode }) {
  return <section className="grid gap-4 border-b border-emerald-100/10 pb-6 last:border-0 last:pb-0"><div className="flex items-center gap-3 text-emerald-300">{icon}<div><h2 className="font-semibold text-emerald-50">{title}</h2><p className="text-xs font-normal text-emerald-50/35">{description}</p></div></div>{children}</section>;
}
function Field({ label, name, value, type = "text", placeholder, required = false }: { label: string; name: string; value: string; type?: string; placeholder?: string; required?: boolean }) { return <label className="grid gap-2 text-[10px] font-bold text-emerald-50/45">{label}<input className={inputClass} name={name} type={type} defaultValue={value} placeholder={placeholder} required={required} /></label>; }
function Area({ label, name, value, rows = 3 }: { label: string; name: string; value: string; rows?: number }) { return <label className="grid gap-2 text-[10px] font-bold text-emerald-50/45">{label}<textarea className={inputClass} name={name} rows={rows} defaultValue={value} /></label>; }
function Select({ label, name, value, options }: { label: string; name: string; value: string; options: Array<{ value: string; label: string }> }) { return <label className="grid gap-2 text-[10px] font-bold text-emerald-50/45">{label}<select className={inputClass} name={name} defaultValue={value}>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>; }
