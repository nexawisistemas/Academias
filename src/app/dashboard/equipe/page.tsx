import { MailPlus, ShieldCheck, UserRound, UserRoundPlus } from "lucide-react";
import { requireOrganization } from "@/lib/auth/session";
import { createOperationalClient, shortDate } from "@/lib/supabase/operational";
import { createTeamInvitationAction, updateTeamInvitationAction, updateTeamMembershipAction } from "../operational-actions";
import { ActionForm } from "../action-form";
import { buttonClass, inputClass, PageTitle } from "../ui";

export default async function TeamPage() {
  const context = await requireOrganization();
  const organization = context.activeOrganization as unknown as { id: string; name: string };
  const db = await createOperationalClient();
  const [{ data: memberships }, { data: roles }, { data: branches }, { data: invitations }] = await Promise.all([
    db.from("organization_memberships").select("id,status,profile_id,profile:profiles(id,full_name,phone),membership_roles(role:roles(code,name),branch:branches(name))").eq("organization_id", organization.id).order("created_at"),
    db.from("roles").select("id,code,name,scope").is("organization_id", null).neq("code", "student").order("name"),
    db.from("branches").select("id,name").eq("organization_id", organization.id).eq("status", "active").order("name"),
    db.from("team_invitations").select("id,email,status,expires_at,role:roles(name),branch:branches(name)").eq("organization_id", organization.id).order("created_at", { ascending: false }).limit(50),
  ]);

  return <>
    <PageTitle eyebrow="ACESSO E PERMISSÕES" title="Equipe" description="Convide profissionais, defina função, escopo por unidade e suspenda acessos." badge={`${memberships?.filter((item) => item.status === "active").length ?? 0} ATIVOS`} />
    <section className="dashboard-panel mt-8 p-5">
      <h2 className="flex items-center gap-2 font-semibold"><UserRoundPlus size={17} className="text-emerald-300" />Convidar profissional</h2>
      <ActionForm action={createTeamInvitationAction} className="mt-4 grid gap-3 md:grid-cols-[1.2fr_1fr_1fr_auto]">
        <input className={inputClass} required name="email" type="email" placeholder="E-mail profissional" />
        <select className={inputClass} required name="role_id"><option value="">Função</option>{roles?.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</select>
        <select className={inputClass} name="branch_id"><option value="">Toda a organização</option>{branches?.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</select>
        <button className={buttonClass}>Criar convite</button>
      </ActionForm>
      <p className="mt-3 text-[10px] leading-5 text-emerald-50/35">O profissional deve entrar ou criar a conta em academias.nexawi.com.br usando exatamente o e-mail convidado. O vínculo é aceito automaticamente no primeiro acesso.</p>
    </section>

    <section className="dashboard-panel mt-6 overflow-hidden">
      <div className="grid grid-cols-[1fr_auto] border-b border-emerald-100/10 px-5 py-4 text-[9px] font-bold tracking-[.12em] text-emerald-50/30 sm:grid-cols-[1.2fr_1fr_1fr_auto]"><span>PROFISSIONAL</span><span className="hidden sm:block">FUNÇÃO</span><span className="hidden sm:block">ESCOPO</span><span>ACESSO</span></div>
      {memberships?.map((membership) => {
        const profile = membership.profile as unknown as { full_name?: string } | null;
        const assignment = (membership.membership_roles as unknown as Array<{ role?: { name?: string }; branch?: { name?: string } | null }>)[0];
        return <article key={membership.id} className="grid grid-cols-[1fr_auto] items-center gap-3 border-b border-emerald-100/[.06] px-5 py-4 last:border-0 sm:grid-cols-[1.2fr_1fr_1fr_auto]">
          <div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-full bg-emerald-300/10 text-emerald-300"><UserRound size={16} /></span><strong className="text-sm">{profile?.full_name || "Usuário"}</strong></div>
          <span className="hidden text-xs text-emerald-50/50 sm:block">{assignment?.role?.name || "Sem função"}</span>
          <span className="hidden text-xs text-emerald-50/35 sm:block">{assignment?.branch?.name || "Toda a organização"}</span>
          <ActionForm action={updateTeamMembershipAction} className="flex gap-2"><input type="hidden" name="membership_id" value={membership.id} /><select className={`${inputClass} py-2 text-[9px]`} name="status" defaultValue={membership.status}><option value="active">Ativo</option><option value="suspended">Suspenso</option></select><button className="rounded-lg border border-emerald-300/20 px-2 text-emerald-300" aria-label="Atualizar acesso"><ShieldCheck size={13} /></button></ActionForm>
        </article>;
      })}
    </section>

    <section className="dashboard-panel mt-6 overflow-hidden">
      <header className="border-b border-emerald-100/10 p-5"><h2 className="flex items-center gap-2 font-semibold"><MailPlus size={16} className="text-cyan-300" />Convites</h2></header>
      {invitations?.length ? invitations.map((invitation) => {
        const role = invitation.role as unknown as { name?: string }; const branch = invitation.branch as unknown as { name?: string } | null;
        const body = encodeURIComponent(`Você foi convidado para a equipe da ${organization.name} no NexaWi Academias. Crie sua conta com este mesmo e-mail em https://academias.nexawi.com.br/cadastro`);
        return <article className="grid gap-3 border-b border-emerald-100/[.06] p-4 last:border-0 md:grid-cols-[1fr_1fr_auto] md:items-center" key={invitation.id}><div><strong className="text-sm">{invitation.email}</strong><span className="block text-[10px] text-emerald-50/35">{role?.name} · {branch?.name || "Toda a organização"}</span></div><div><span className="text-[9px] font-bold text-emerald-300">{invitation.status.toUpperCase()}</span><span className="block text-[10px] text-emerald-50/30">Expira {shortDate(invitation.expires_at)}</span></div><div className="flex items-center gap-3">{invitation.status === "pending" && <a className="text-[10px] font-bold text-cyan-200" href={`mailto:${invitation.email}?subject=Convite NexaWi Academias&body=${body}`}>Enviar por e-mail</a>}{invitation.status === "pending" && <ActionForm action={updateTeamInvitationAction}><input type="hidden" name="invitation_id" value={invitation.id} /><input type="hidden" name="status" value="cancelled" /><button className="text-[10px] font-bold text-rose-200/70">Cancelar</button></ActionForm>}</div></article>;
      }) : <p className="p-8 text-center text-xs text-emerald-50/30">Nenhum convite pendente.</p>}
    </section>
  </>;
}
