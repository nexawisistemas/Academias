import { Activity, ArrowUpRight, Building2, CircleDollarSign, Target, UsersRound } from "lucide-react";
import { requireOrganization } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

type Organization = { id: string; name: string; status: string; trial_ends_at: string | null };

const metrics = [
  { label: "Alunos ativos", value: "0", note: "módulo em preparação", icon: UsersRound },
  { label: "Check-ins hoje", value: "0", note: "controle de acesso", icon: Activity },
  { label: "Leads no funil", value: "0", note: "CRM será o próximo MVP", icon: Target },
  { label: "Receita do mês", value: "R$ 0", note: "financeiro protegido", icon: CircleDollarSign },
];

export default async function DashboardPage() {
  const context = await requireOrganization();
  const organization = context.activeOrganization as unknown as Organization;
  const supabase = await createClient();
  const { data: branches } = await supabase.from("branches").select("id, name, slug, status, is_main, address").eq("organization_id", organization.id).order("is_main", { ascending: false });

  return (
    <>
      <section className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><span className="text-[10px] font-bold tracking-[.16em] text-emerald-300">FUNDAÇÃO ATIVA</span><h1 className="mt-2 text-3xl font-semibold tracking-[-.045em] sm:text-5xl">O centro da sua operação.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-emerald-50/45">A estrutura multiempresa está pronta para receber os módulos comerciais e operacionais.</p></div>
        <a href="/dashboard/configuracoes" className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-emerald-200/15 bg-white/[.025] px-4 text-xs font-bold text-emerald-100 transition hover:border-emerald-300/40"><span className="size-2 rounded-full bg-emerald-300 shadow-[0_0_12px_#5dff9f]" />Configurar academia<ArrowUpRight size={15} /></a>
      </section>

      <section className="metric-dashboard-grid">{metrics.map(({ label, value, note, icon: Icon }) => <article className="dashboard-metric" key={label}><header>{label}<span><Icon size={16} /></span></header><strong>{value}</strong><small>{note}</small></article>)}</section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[1.35fr_.65fr]">
        <article className="dashboard-panel p-5 sm:p-6"><div className="flex items-center justify-between"><div><h2 className="font-semibold">Rede de unidades</h2><p className="mt-1 text-xs text-emerald-50/35">Estrutura criada no onboarding</p></div><Building2 size={19} className="text-emerald-300" /></div><div className="mt-5 grid gap-3 sm:grid-cols-2">{branches?.map((branch) => <div key={branch.id} className="rounded-2xl border border-emerald-100/10 bg-black/15 p-4"><div className="flex items-center justify-between"><strong className="text-sm">{branch.name}</strong><span className="rounded-full bg-emerald-300/10 px-2 py-1 text-[8px] font-bold text-emerald-300">{branch.is_main ? "PRINCIPAL" : branch.status.toUpperCase()}</span></div><p className="mt-2 text-[11px] text-emerald-50/35">/{branch.slug}</p></div>)}</div></article>
        <article className="dashboard-panel p-5 sm:p-6"><h2 className="font-semibold">Progresso da fundação</h2><div className="mt-5 grid gap-4">{[["Conta e sessão",100],["Organização e unidade",100],["RBAC e RLS",100],["Módulos operacionais",10]].map(([label, progress]) => <div key={String(label)}><div className="mb-2 flex justify-between text-[10px] text-emerald-50/45"><span>{label}</span><span>{progress}%</span></div><div className="h-1.5 overflow-hidden rounded-full bg-white/5"><i className="block h-full rounded-full bg-gradient-to-r from-emerald-300 to-cyan-300" style={{ width: `${progress}%` }} /></div></div>)}</div></article>
      </section>
    </>
  );
}
