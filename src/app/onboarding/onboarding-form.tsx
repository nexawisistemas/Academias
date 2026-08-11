"use client";

import { useActionState, useState } from "react";
import { ArrowRight, Building2, MapPin } from "lucide-react";
import { createOrganizationAction } from "./actions";
import type { ActionState } from "@/lib/auth/validation";

function toSlug(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 64);
}

function ErrorText({ errors }: { errors?: string[] }) {
  return errors?.[0] ? <span className="text-[11px] text-rose-300">{errors[0]}</span> : null;
}

export function OnboardingForm() {
  const [state, action, pending] = useActionState(createOrganizationAction, {} as ActionState);
  const [slug, setSlug] = useState("");

  return (
    <form action={action} className="mt-8 grid gap-7">
      {state.message ? <p className="rounded-xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">{state.message}</p> : null}

      <section className="rounded-2xl border border-emerald-200/10 bg-white/[.025] p-5 sm:p-6">
        <div className="mb-5 flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-emerald-300/10 text-emerald-300"><Building2 size={18} /></span><div><h2 className="font-semibold">Identidade da academia</h2><p className="text-xs text-emerald-50/40">Dados centrais da organização</p></div></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-xs text-emerald-50/65 sm:col-span-2">Nome da academia<input name="name" required onChange={(event) => setSlug(toSlug(event.target.value))} className="h-12 rounded-xl border border-emerald-100/10 bg-black/20 px-4 text-sm text-white outline-none transition focus:border-emerald-300/50" placeholder="Academia Alpha" /><ErrorText errors={state.errors?.name} /></label>
          <label className="grid gap-2 text-xs text-emerald-50/65">Razão social<input name="legalName" className="h-12 rounded-xl border border-emerald-100/10 bg-black/20 px-4 text-sm text-white outline-none transition focus:border-emerald-300/50" placeholder="Alpha Fitness Ltda." /></label>
          <label className="grid gap-2 text-xs text-emerald-50/65">CNPJ<input name="taxId" inputMode="numeric" className="h-12 rounded-xl border border-emerald-100/10 bg-black/20 px-4 text-sm text-white outline-none transition focus:border-emerald-300/50" placeholder="00.000.000/0001-00" /></label>
          <label className="grid gap-2 text-xs text-emerald-50/65 sm:col-span-2">Endereço digital<div className="flex h-12 overflow-hidden rounded-xl border border-emerald-100/10 bg-black/20 focus-within:border-emerald-300/50"><input name="slug" value={slug} onChange={(event) => setSlug(toSlug(event.target.value))} required className="min-w-0 flex-1 bg-transparent px-4 text-sm text-white outline-none" /><span className="flex items-center border-l border-emerald-100/10 px-3 text-[11px] text-emerald-50/35">.academias.nexawi.com.br</span></div><ErrorText errors={state.errors?.slug} /></label>
        </div>
      </section>

      <section className="rounded-2xl border border-emerald-200/10 bg-white/[.025] p-5 sm:p-6">
        <div className="mb-5 flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-cyan-300/10 text-cyan-300"><MapPin size={18} /></span><div><h2 className="font-semibold">Primeira unidade</h2><p className="text-xs text-emerald-50/40">Você poderá adicionar outras depois</p></div></div>
        <div className="grid gap-4 sm:grid-cols-[1.5fr_1fr_100px]">
          <label className="grid gap-2 text-xs text-emerald-50/65">Nome da unidade<input name="branchName" defaultValue="Unidade principal" required className="h-12 rounded-xl border border-emerald-100/10 bg-black/20 px-4 text-sm text-white outline-none transition focus:border-emerald-300/50" /><ErrorText errors={state.errors?.branchName} /></label>
          <label className="grid gap-2 text-xs text-emerald-50/65">Cidade<input name="city" required className="h-12 rounded-xl border border-emerald-100/10 bg-black/20 px-4 text-sm text-white outline-none transition focus:border-emerald-300/50" placeholder="Vitória da Conquista" /><ErrorText errors={state.errors?.city} /></label>
          <label className="grid gap-2 text-xs text-emerald-50/65">UF<input name="state" required maxLength={2} className="h-12 rounded-xl border border-emerald-100/10 bg-black/20 px-4 text-sm uppercase text-white outline-none transition focus:border-emerald-300/50" placeholder="BA" /><ErrorText errors={state.errors?.state} /></label>
        </div>
      </section>

      <button disabled={pending} className="flex h-13 items-center justify-center gap-2 rounded-full bg-emerald-300 font-bold text-emerald-950 shadow-[0_0_40px_rgba(93,255,159,.15)] transition hover:-translate-y-0.5 hover:shadow-[0_0_48px_rgba(93,255,159,.28)] disabled:cursor-wait disabled:opacity-60">
        {pending ? "Criando seu ambiente..." : "Criar academia e acessar o painel"}<ArrowRight size={18} />
      </button>
    </form>
  );
}
