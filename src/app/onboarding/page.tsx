import { redirect } from "next/navigation";
import Link from "next/link";
import { Dumbbell, Sparkles } from "lucide-react";
import { getUserContext } from "@/lib/auth/session";
import { OnboardingForm } from "./onboarding-form";

export default async function OnboardingPage() {
  const context = await getUserContext();
  if (context.activeOrganization) redirect("/dashboard");

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_50%_-15%,#144432_0,#06110d_38%,#020706_78%)] px-4 py-8 text-white sm:px-7 sm:py-12">
      <div className="mx-auto max-w-3xl">
        <header className="flex items-center justify-between border-b border-emerald-100/10 pb-7">
          <Link href="/" className="flex items-center gap-3 text-xs font-extrabold tracking-[.13em]"><span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-emerald-300 to-cyan-300 text-emerald-950"><Dumbbell size={19} /></span>NEXAWI <strong className="text-emerald-300">ACADEMIAS</strong></Link>
          <span className="hidden text-[10px] font-bold tracking-[.16em] text-emerald-100/35 sm:block">CONFIGURAÇÃO INICIAL</span>
        </header>
        <section className="pt-12 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/[.06] px-3 py-2 text-[10px] font-bold tracking-[.14em] text-emerald-200"><Sparkles size={13} /> PRIMEIRO PASSO DA NOVA OPERAÇÃO</span>
          <h1 className="mx-auto mt-5 max-w-2xl text-4xl font-semibold tracking-[-.055em] sm:text-6xl">Vamos dar vida à sua academia.</h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-emerald-50/50">Criaremos a organização, a unidade principal, o endereço digital e seu acesso como proprietário em uma única operação segura.</p>
        </section>
        <OnboardingForm />
      </div>
    </main>
  );
}
