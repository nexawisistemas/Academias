import { Bell, Dumbbell, LogOut, Search } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserContext, isPlatformOperator } from "@/lib/auth/session";
import { logoutAction } from "@/app/(auth)/actions";
import { DashboardNav } from "./dashboard-nav";
import "./dashboard.css";

type Organization = { id: string; name: string; slug: string; status: string; saas_plan: string };

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const context = await getUserContext();
  const platformAdmin = isPlatformOperator(context);
  const organization = context.activeOrganization as unknown as Organization | null;
  if (!organization && !platformAdmin) redirect("/onboarding");
  const contextLabel = organization?.name || "Administração NexaWi";
  const name = String(context.profile?.full_name || context.user.email || "Usuário");
  const initials = name.split(" ").map((part: string) => part[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <a href={organization ? "/dashboard" : "/dashboard/plataforma"} className="dashboard-brand"><span><Dumbbell size={18} /></span><div>NEXAWI <strong>ACADEMIAS</strong></div></a>
        <div className="organization-switcher"><small>{organization ? "ORGANIZAÇÃO ATIVA" : "PAINEL INTERNO"}</small><strong>{contextLabel}</strong></div>
        <DashboardNav isPlatformAdmin={platformAdmin} hasOrganization={Boolean(organization)} />
        <div className="sidebar-bottom"><form action={logoutAction}><button><LogOut size={16} /> Sair da plataforma</button></form></div>
      </aside>
      <main className="dashboard-main">
        <header className="dashboard-topbar">
          <div><small>{organization ? "OPERAÇÃO CONECTADA" : "GESTÃO DA PLATAFORMA"}</small><strong>{contextLabel}</strong></div>
          <div className="topbar-actions"><Link href="/dashboard/busca" className="topbar-icon" aria-label="Buscar"><Search size={16} /></Link><Link href="/dashboard/relacionamento" className="topbar-icon" aria-label="Alertas e relacionamento"><Bell size={16} /></Link><span className="profile-orb" title={name}>{initials}</span></div>
        </header>
        <div className="dashboard-content">{children}</div>
      </main>
    </div>
  );
}
