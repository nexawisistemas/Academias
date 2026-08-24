/* eslint-disable react-hooks/purity */
import { CalendarDays, Clock3, Plus, UserPlus, UsersRound } from "lucide-react";
import { requireOrganization } from "@/lib/auth/session";
import { createOperationalClient } from "@/lib/supabase/operational";
import { bookClassAction, createClassAction, updateBookingStatusAction, updateClassStatusAction } from "../operational-actions";
import { ActionForm } from "../action-form";
import { buttonClass, inputClass, PageTitle } from "../ui";

export default async function SchedulePage() {
  const context = await requireOrganization();
  const organization = context.activeOrganization as unknown as { id: string };
  const db = await createOperationalClient();
  const cutoff = new Date(Date.now() - 7 * 86400000);
  const [{ data: branches }, { data: sessions }, { data: members }] = await Promise.all([
    db.from("branches").select("id,name").eq("organization_id", organization.id).eq("status", "active"),
    db.from("class_sessions").select("id,title,starts_at,ends_at,capacity,status,branch:branches(name),bookings:class_bookings(id,status,member:members(full_name))").eq("organization_id", organization.id).order("starts_at").gte("starts_at", cutoff.toISOString()).limit(100),
    db.from("members").select("id,full_name").eq("organization_id", organization.id).eq("status", "active").order("full_name"),
  ]);
  const future = sessions?.filter((item) => new Date(item.starts_at) >= new Date() && item.status !== "cancelled") ?? [];

  return <>
    <PageTitle eyebrow="GRADE E OCUPAÇÃO" title="Agenda de aulas" description="Turmas, lista de espera, reservas, capacidade e presença por unidade." badge={`${future.length} PRÓXIMAS`} />
    <div className="mt-8 grid gap-5 xl:grid-cols-2">
      <section className="dashboard-panel p-5">
        <h2 className="flex items-center gap-2 font-semibold"><Plus size={17} className="text-emerald-300" />Nova aula</h2>
        <ActionForm action={createClassAction} className="mt-4 grid gap-3">
          <input className={inputClass} required name="title" placeholder="Nome da aula" />
          <select className={inputClass} required name="branch_id"><option value="">Selecione a unidade</option>{branches?.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</select>
          <div className="grid grid-cols-3 gap-3"><input className={`${inputClass} col-span-2`} required type="datetime-local" name="starts_at" /><input className={inputClass} type="number" min="1" name="capacity" placeholder="Vagas" /></div>
          <input className={inputClass} type="number" min="10" max="300" name="duration" defaultValue={60} placeholder="Duração em minutos" />
          <button className={buttonClass}>Agendar aula</button>
        </ActionForm>
      </section>
      <section className="dashboard-panel p-5">
        <h2 className="flex items-center gap-2 font-semibold"><UserPlus size={17} className="text-cyan-300" />Nova reserva</h2>
        <ActionForm action={bookClassAction} className="mt-4 grid gap-3">
          <select className={inputClass} required name="session_id"><option value="">Selecione a aula</option>{future.filter((session) => session.status === "scheduled").map((session) => <option key={session.id} value={session.id}>{session.title} · {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(session.starts_at))}</option>)}</select>
          <select className={inputClass} required name="member_id"><option value="">Selecione o aluno</option>{members?.map((member) => <option key={member.id} value={member.id}>{member.full_name}</option>)}</select>
          <button className={buttonClass}>Confirmar reserva</button>
        </ActionForm>
        <p className="mt-4 text-[10px] leading-5 text-emerald-50/35">Quando a turma atinge a capacidade, a reserva entra automaticamente na lista de espera.</p>
      </section>
    </div>

    <section className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {sessions?.map((session) => {
        const branch = session.branch as unknown as { name?: string }; const bookings = session.bookings as unknown as Array<{ id: string; status: string; member?: { full_name?: string } }>;
        const occupied = bookings.filter((item) => ["booked", "attended"].includes(item.status)).length;
        return <article className="dashboard-panel p-5" key={session.id}>
          <div className="flex items-center justify-between"><CalendarDays size={19} className="text-emerald-300" /><span className="text-[9px] font-bold text-emerald-300">{session.status.toUpperCase()}</span></div>
          <h2 className="mt-5 text-lg font-semibold">{session.title}</h2>
          <p className="mt-2 flex items-center gap-2 text-xs text-emerald-50/45"><Clock3 size={13} />{new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(session.starts_at))}</p>
          <div className="mt-4 flex items-center justify-between border-t border-emerald-100/10 pt-4 text-[10px] text-emerald-50/35"><span>{branch?.name}</span><span className="flex items-center gap-1"><UsersRound size={12} />{occupied}/{session.capacity}</span></div>
          <ActionForm action={updateClassStatusAction} className="mt-3 flex gap-2"><input type="hidden" name="session_id" value={session.id} /><select className={`${inputClass} min-w-0 flex-1 py-2 text-[10px]`} name="status" defaultValue={session.status}><option value="scheduled">Agendada</option><option value="in_progress">Em andamento</option><option value="completed">Concluída</option><option value="cancelled">Cancelada</option></select><button className="rounded-lg border border-emerald-300/20 px-3 text-[10px] font-bold text-emerald-300">Salvar</button></ActionForm>
          {!!bookings.length && <details className="mt-3 rounded-xl bg-black/15 p-3"><summary className="cursor-pointer text-[10px] font-bold text-cyan-200">Reservas e presença ({bookings.length})</summary><div className="mt-3 grid gap-2">{bookings.map((booking) => <ActionForm action={updateBookingStatusAction} className="grid grid-cols-[1fr_auto_auto] items-center gap-2" key={booking.id}><input type="hidden" name="booking_id" value={booking.id} /><span className="truncate text-[10px]">{booking.member?.full_name}</span><select className={`${inputClass} py-2 text-[9px]`} name="status" defaultValue={booking.status}><option value="booked">Reservado</option><option value="waitlist">Espera</option><option value="attended">Presente</option><option value="no_show">Faltou</option><option value="cancelled">Cancelado</option></select><button className="text-[9px] font-bold text-emerald-300">OK</button></ActionForm>)}</div></details>}
        </article>;
      })}
      {!sessions?.length && <div className="dashboard-panel col-span-full grid min-h-48 place-items-center text-sm text-emerald-50/30">Agende a primeira aula.</div>}
    </section>
  </>;
}
