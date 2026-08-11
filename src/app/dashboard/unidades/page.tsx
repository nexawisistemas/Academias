import { Building2, MapPin, Plus } from "lucide-react";
import { requireOrganization } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export default async function BranchesPage() {
  const context = await requireOrganization();
  const organization = context.activeOrganization as unknown as { id: string };
  const supabase = await createClient();
  const { data: branches } = await supabase.from("branches").select("id, name, slug, status, is_main, timezone, address").eq("organization_id", organization.id).order("is_main", { ascending: false });

  return <><header className="flex items-end justify-between gap-4"><div><span className="text-[10px] font-bold tracking-[.16em] text-emerald-300">ESTRUTURA DA REDE</span><h1 className="mt-2 text-4xl font-semibold tracking-[-.05em]">Unidades</h1><p className="mt-2 text-sm text-emerald-50/40">A arquitetura já suporta uma ou dezenas de operações.</p></div><button disabled title="CRUD será habilitado na próxima etapa" className="hidden h-11 items-center gap-2 rounded-full bg-emerald-300 px-4 text-xs font-bold text-emerald-950 opacity-55 sm:flex"><Plus size={16} /> Nova unidade</button></header><section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{branches?.map((branch) => { const address = branch.address as { city?: string; state?: string } | null; return <article className="dashboard-panel p-5" key={branch.id}><div className="flex items-center justify-between"><span className="grid size-10 place-items-center rounded-xl bg-emerald-300/10 text-emerald-300"><Building2 size={19} /></span><span className="rounded-full border border-emerald-300/15 px-2 py-1 text-[8px] font-bold text-emerald-300">{branch.is_main ? "PRINCIPAL" : branch.status.toUpperCase()}</span></div><h2 className="mt-5 font-semibold">{branch.name}</h2><p className="mt-2 flex items-center gap-2 text-xs text-emerald-50/35"><MapPin size={13} />{address?.city || "Cidade não informada"}{address?.state ? ` · ${address.state}` : ""}</p><p className="mt-4 border-t border-emerald-100/10 pt-4 text-[10px] text-emerald-50/30">Fuso: {branch.timezone}</p></article>; })}</section></>;
}
