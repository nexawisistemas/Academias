import { Mail, Pencil, Phone, Plus, Search, UserRound } from "lucide-react";
import { requireOrganization } from "@/lib/auth/session";
import { createOperationalClient, shortDate } from "@/lib/supabase/operational";
import { createMemberAction, updateMemberAction, updateMemberStatusAction } from "../operational-actions";
import { ActionForm } from "../action-form";
import { buttonClass, inputClass, PageTitle } from "../ui";

type Search = { q?: string; status?: string };
type Branch = { id: string; name: string };

export default async function MembersPage({ searchParams }: { searchParams: Promise<Search> }) {
  const query = await searchParams;
  const context = await requireOrganization();
  const organization = context.activeOrganization as unknown as { id: string };
  const db = await createOperationalClient();
  let membersQuery = db.from("members").select("id,full_name,email,phone,cpf,birth_date,status,goal,medical_notes,joined_at,branch_id,branch:branches(name)").eq("organization_id", organization.id).order("created_at", { ascending: false });
  if (query.status && query.status !== "all") membersQuery = membersQuery.eq("status", query.status);
  if (query.q?.trim()) {
    const term = query.q.trim().replace(/[,%()]/g, "");
    membersQuery = membersQuery.or(`full_name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%,cpf.ilike.%${term}%`);
  }
  const [{ data: members }, { data: branches }] = await Promise.all([
    membersQuery.limit(200),
    db.from("branches").select("id,name").eq("organization_id", organization.id).eq("status", "active").order("name"),
  ]);

  return <>
    <PageTitle eyebrow="BASE DE RELACIONAMENTO" title="Alunos" description="Cadastro, contato, situação e histórico operacional em uma única base." badge={`${members?.length ?? 0} EXIBIDOS`} />
    <section className="dashboard-panel mt-8 p-5">
      <div className="grid gap-5 xl:grid-cols-[1.25fr_.75fr]">
        <div>
          <h2 className="flex items-center gap-2 font-semibold"><Plus size={17} className="text-emerald-300" />Novo aluno</h2>
          <ActionForm action={createMemberAction} className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <input className={inputClass} name="full_name" required placeholder="Nome completo" />
            <input className={inputClass} name="email" type="email" placeholder="E-mail" />
            <input className={inputClass} name="phone" placeholder="WhatsApp" />
            <input className={inputClass} name="cpf" placeholder="CPF" />
            <input className={inputClass} name="birth_date" type="date" aria-label="Data de nascimento" />
            <select className={inputClass} name="branch_id"><option value="">Sem unidade</option>{branches?.map((branch: Branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</select>
            <input className={inputClass} name="goal" placeholder="Objetivo principal" />
            <input className={inputClass} name="medical_notes" placeholder="Observação de saúde" />
            <button className={buttonClass}>Cadastrar aluno</button>
          </ActionForm>
        </div>
        <div className="rounded-2xl border border-emerald-100/10 bg-black/10 p-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold"><Search size={16} className="text-cyan-300" />Localizar aluno</h2>
          <form className="mt-4 grid gap-3" method="get">
            <input className={inputClass} name="q" defaultValue={query.q} placeholder="Nome, e-mail, telefone ou CPF" />
            <select className={inputClass} name="status" defaultValue={query.status || "all"}>
              <option value="all">Todas as situações</option><option value="active">Ativos</option><option value="paused">Pausados</option><option value="inactive">Inativos</option><option value="cancelled">Cancelados</option>
            </select>
            <button className="rounded-xl border border-cyan-300/20 px-4 py-3 text-xs font-bold text-cyan-200">Filtrar base</button>
          </form>
        </div>
      </div>
    </section>

    <section className="mt-6 grid gap-4 xl:grid-cols-2">
      {members?.length ? members.map((member) => {
        const branch = member.branch as unknown as { name?: string } | null;
        return <article className="dashboard-panel p-5" key={member.id}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-emerald-300/10 text-emerald-300"><UserRound size={17} /></span>
              <div className="min-w-0"><strong className="block truncate text-sm">{member.full_name}</strong><span className="text-[10px] text-emerald-50/35">{member.goal || "Objetivo não informado"} · {branch?.name || "Sem unidade"}</span></div>
            </div>
            <span className="rounded-full bg-emerald-300/10 px-2 py-1 text-[9px] font-bold text-emerald-300">{member.status.toUpperCase()}</span>
          </div>
          <div className="mt-4 grid gap-2 text-[11px] text-emerald-50/45 sm:grid-cols-2">
            <span className="flex items-center gap-2"><Mail size={13} />{member.email || "E-mail não informado"}</span>
            <span className="flex items-center gap-2"><Phone size={13} />{member.phone || "Telefone não informado"}</span>
            <span>CPF: {member.cpf || "não informado"}</span><span>Desde {shortDate(member.joined_at)}</span>
          </div>
          <div className="mt-4 border-t border-emerald-100/10 pt-4">
            <ActionForm action={updateMemberStatusAction} className="flex flex-wrap gap-2">
              <input type="hidden" name="member_id" value={member.id} />
              <select className={`${inputClass} min-w-40 py-2 text-xs`} name="status" defaultValue={member.status}>
                <option value="active">Ativo</option><option value="paused">Pausado</option><option value="inactive">Inativo</option><option value="cancelled">Cancelado</option>
              </select>
              <button className="rounded-xl border border-emerald-300/20 px-3 py-2 text-[10px] font-bold text-emerald-300">Atualizar situação</button>
            </ActionForm>
            <details className="mt-3 rounded-xl bg-black/15 p-3">
              <summary className="flex cursor-pointer items-center gap-2 text-[10px] font-bold text-cyan-200"><Pencil size={13} />Editar cadastro completo</summary>
              <ActionForm action={updateMemberAction} className="mt-3 grid gap-2 sm:grid-cols-2">
                <input type="hidden" name="member_id" value={member.id} />
                <input className={inputClass} name="full_name" required defaultValue={member.full_name} />
                <input className={inputClass} name="email" type="email" defaultValue={member.email || ""} placeholder="E-mail" />
                <input className={inputClass} name="phone" defaultValue={member.phone || ""} placeholder="Telefone" />
                <input className={inputClass} name="cpf" defaultValue={member.cpf || ""} placeholder="CPF" />
                <input className={inputClass} name="birth_date" type="date" defaultValue={member.birth_date || ""} />
                <select className={inputClass} name="branch_id" defaultValue={member.branch_id || ""}><option value="">Sem unidade</option>{branches?.map((item: Branch) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
                <input className={inputClass} name="goal" defaultValue={member.goal || ""} placeholder="Objetivo" />
                <input className={inputClass} name="medical_notes" defaultValue={member.medical_notes || ""} placeholder="Observação de saúde" />
                <button className={buttonClass}>Salvar alterações</button>
              </ActionForm>
            </details>
          </div>
        </article>;
      }) : <div className="dashboard-panel col-span-full grid min-h-48 place-items-center text-sm text-emerald-50/30">Nenhum aluno encontrado com esses filtros.</div>}
    </section>
  </>;
}
