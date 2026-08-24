import Link from "next/link";
import { CircleDollarSign, Search, Target, UserRound } from "lucide-react";
import { requireOrganization } from "@/lib/auth/session";
import { createOperationalClient, money, shortDate } from "@/lib/supabase/operational";
import { inputClass, PageTitle } from "../ui";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const term = q.trim().replace(/[,%()]/g, "");
  const context = await requireOrganization();
  const organization = context.activeOrganization as unknown as { id: string };
  const db = await createOperationalClient();
  const empty = { data: [] as unknown[] };
  const [membersResult, leadsResult, invoicesResult] = term.length >= 2 ? await Promise.all([
    db.from("members").select("id,full_name,email,phone,status").eq("organization_id", organization.id).or(`full_name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%,cpf.ilike.%${term}%`).limit(20),
    db.from("crm_leads").select("id,full_name,email,phone,status,interest").eq("organization_id", organization.id).or(`full_name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%,interest.ilike.%${term}%`).limit(20),
    db.from("invoices").select("id,description,amount_cents,due_date,status,member:members(full_name)").eq("organization_id", organization.id).or(`description.ilike.%${term}%`).limit(20),
  ]) : [empty, empty, empty];
  const members = membersResult.data as Array<{ id: string; full_name: string; email?: string; phone?: string; status: string }>;
  const leads = leadsResult.data as Array<{ id: string; full_name: string; email?: string; phone?: string; status: string; interest?: string }>;
  const invoices = invoicesResult.data as Array<{ id: string; description: string; amount_cents: number; due_date: string; status: string; member?: { full_name?: string } | null }>;
  const total = members.length + leads.length + invoices.length;

  return <>
    <PageTitle eyebrow="BUSCA GLOBAL" title="Encontre qualquer registro" description="Pesquise alunos, leads e cobranças sem navegar por cada módulo." badge={term.length >= 2 ? `${total} RESULTADOS` : undefined} />
    <form className="dashboard-panel mt-8 flex gap-3 p-5" method="get"><input autoFocus className={`${inputClass} flex-1`} name="q" defaultValue={q} minLength={2} placeholder="Nome, telefone, e-mail, CPF, interesse ou cobrança" /><button className="inline-flex items-center gap-2 rounded-xl bg-emerald-300 px-5 text-xs font-bold text-emerald-950"><Search size={15} />Buscar</button></form>
    {term.length < 2 ? <p className="dashboard-panel mt-5 p-8 text-center text-sm text-emerald-50/35">Digite pelo menos dois caracteres para iniciar.</p> : <section className="mt-5 grid gap-5 xl:grid-cols-3">
      <ResultGroup icon={<UserRound size={17} />} title="Alunos" href="/dashboard/alunos" empty="Nenhum aluno encontrado.">{members.map((item) => <article key={item.id} className="rounded-xl bg-black/15 p-4"><strong className="text-sm">{item.full_name}</strong><span className="mt-1 block text-[10px] text-emerald-50/40">{item.phone || item.email || "Sem contato"}</span><span className="mt-2 block text-[9px] font-bold text-emerald-300">{item.status.toUpperCase()}</span></article>)}</ResultGroup>
      <ResultGroup icon={<Target size={17} />} title="Leads" href="/dashboard/crm" empty="Nenhum lead encontrado.">{leads.map((item) => <article key={item.id} className="rounded-xl bg-black/15 p-4"><strong className="text-sm">{item.full_name}</strong><span className="mt-1 block text-[10px] text-emerald-50/40">{item.interest || item.phone || "Interesse não informado"}</span><span className="mt-2 block text-[9px] font-bold text-cyan-300">{item.status.toUpperCase()}</span></article>)}</ResultGroup>
      <ResultGroup icon={<CircleDollarSign size={17} />} title="Cobranças" href="/dashboard/financeiro" empty="Nenhuma cobrança encontrada.">{invoices.map((item) => <article key={item.id} className="rounded-xl bg-black/15 p-4"><div className="flex justify-between gap-2"><strong className="text-sm">{item.member?.full_name || item.description}</strong><strong className="text-xs text-emerald-300">{money(item.amount_cents)}</strong></div><span className="mt-1 block text-[10px] text-emerald-50/40">Vence {shortDate(item.due_date)} · {item.status}</span></article>)}</ResultGroup>
    </section>}
  </>;
}

function ResultGroup({ icon, title, href, empty, children }: { icon: React.ReactNode; title: string; href: string; empty: string; children: React.ReactNode }) {
  const hasChildren = Array.isArray(children) ? children.length > 0 : Boolean(children);
  return <section className="dashboard-panel p-5"><header className="flex items-center justify-between"><h2 className="flex items-center gap-2 text-sm font-semibold text-emerald-300">{icon}{title}</h2><Link href={href} className="text-[10px] font-bold text-cyan-300">ABRIR MÓDULO</Link></header><div className="mt-4 grid gap-3">{hasChildren ? children : <p className="py-8 text-center text-xs text-emerald-50/30">{empty}</p>}</div></section>;
}
