import { Building2, MapPin, Pencil, Plus } from "lucide-react";
import { requireOrganization } from "@/lib/auth/session";
import { createOperationalClient } from "@/lib/supabase/operational";
import { createBranchAction, updateBranchAction } from "../operational-actions";
import { ActionForm } from "../action-form";
import { buttonClass, inputClass, PageTitle } from "../ui";

type Address = { street?: string; number?: string; neighborhood?: string; city?: string; state?: string; zip?: string };

export default async function BranchesPage() {
  const context = await requireOrganization(); const organization = context.activeOrganization as unknown as { id: string }; const db = await createOperationalClient();
  const { data: branches } = await db.from("branches").select("id,name,slug,status,is_main,timezone,address,phone,email").eq("organization_id", organization.id).order("is_main", { ascending: false }).order("name");
  return <>
    <PageTitle eyebrow="ESTRUTURA DA REDE" title="Unidades" description="Cadastre endereços, contatos, horários e situação de cada operação física." badge={`${branches?.length ?? 0} UNIDADES`} />
    <section className="dashboard-panel mt-8 p-5"><h2 className="flex items-center gap-2 font-semibold"><Plus size={16} className="text-emerald-300" />Nova unidade</h2><ActionForm action={createBranchAction} className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4"><input className={inputClass} required name="name" placeholder="Nome da unidade" /><input className={inputClass} name="phone" placeholder="Telefone" /><input className={inputClass} name="email" type="email" placeholder="E-mail" /><input className={inputClass} name="street" placeholder="Rua/avenida" /><input className={inputClass} name="number" placeholder="Número" /><input className={inputClass} name="neighborhood" placeholder="Bairro" /><input className={inputClass} name="city" placeholder="Cidade" /><div className="grid grid-cols-2 gap-2"><input className={inputClass} name="state" maxLength={2} placeholder="UF" /><input className={inputClass} name="zip" placeholder="CEP" /></div><button className={buttonClass}>Criar unidade</button></ActionForm></section>
    <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {branches?.map((branch) => { const address = branch.address as Address | null; return <article className="dashboard-panel p-5" key={branch.id}>
        <div className="flex items-center justify-between"><span className="grid size-10 place-items-center rounded-xl bg-emerald-300/10 text-emerald-300"><Building2 size={19} /></span><span className="rounded-full border border-emerald-300/15 px-2 py-1 text-[8px] font-bold text-emerald-300">{branch.is_main ? "PRINCIPAL" : branch.status.toUpperCase()}</span></div>
        <h2 className="mt-5 font-semibold">{branch.name}</h2>
        <p className="mt-2 flex items-start gap-2 text-xs leading-5 text-emerald-50/35"><MapPin size={13} className="mt-1 shrink-0" />{[address?.street, address?.number, address?.neighborhood, address?.city, address?.state].filter(Boolean).join(" · ") || "Endereço não informado"}</p>
        <div className="mt-4 border-t border-emerald-100/10 pt-4 text-[10px] text-emerald-50/30"><span className="block">{branch.phone || "Telefone não informado"}</span><span className="block">{branch.email || "E-mail não informado"}</span><span className="block">{branch.timezone}</span></div>
        <details className="mt-4 rounded-xl bg-black/15 p-3"><summary className="flex cursor-pointer items-center gap-2 text-[10px] font-bold text-cyan-200"><Pencil size={13} />Editar unidade</summary><ActionForm action={updateBranchAction} className="mt-3 grid gap-2 sm:grid-cols-2"><input type="hidden" name="branch_id" value={branch.id} /><input className={inputClass} required name="name" defaultValue={branch.name} /><select className={inputClass} name="status" defaultValue={branch.status}><option value="active">Ativa</option><option value="inactive">Inativa</option></select><input className={inputClass} name="phone" defaultValue={branch.phone || ""} placeholder="Telefone" /><input className={inputClass} name="email" type="email" defaultValue={branch.email || ""} placeholder="E-mail" /><input className={inputClass} name="street" defaultValue={address?.street || ""} placeholder="Rua" /><input className={inputClass} name="number" defaultValue={address?.number || ""} placeholder="Número" /><input className={inputClass} name="neighborhood" defaultValue={address?.neighborhood || ""} placeholder="Bairro" /><input className={inputClass} name="city" defaultValue={address?.city || ""} placeholder="Cidade" /><input className={inputClass} name="state" maxLength={2} defaultValue={address?.state || ""} placeholder="UF" /><input className={inputClass} name="zip" defaultValue={address?.zip || ""} placeholder="CEP" /><input className={inputClass} name="timezone" defaultValue={branch.timezone} placeholder="Fuso horário" /><button className={buttonClass}>Salvar unidade</button></ActionForm></details>
      </article>; })}
    </section>
  </>;
}
