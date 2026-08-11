import { Bell, Dumbbell, LogOut, Search } from "lucide-react";
import { requireOrganization } from "@/lib/auth/session";
import { logoutAction } from "@/app/(auth)/actions";
import { DashboardNav } from "./dashboard-nav";
import "./dashboard.css";

type Organization = { id: string; name: string; slug: string; status: string; saas_plan: string };

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const context = await requireOrganization();
  const organization = context.activeOrganization as unknown as Organization;
  const name = String(context.profile?.full_name || context.user.email || "Usuário");
  const initials = name.split(" ").map((part: string) => part[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <a href="/dashboard" className="dashboard-brand"><span><Dumbbell size={18} /></span><div>NEXAWI <strong>ACADEMIAS</strong></div></a>
        <div className="organization-switcher"><small>ORGANIZAÇÃO ATIVA</small><strong>{organization.name}</strong></div>
        <DashboardNav />
        <div className="sidebar-bottom"><form action={logoutAction}><button><LogOut size={16} /> Sair da plataforma</button></form></div>
      </aside>
      <main className="dashboard-main">
        <header className="dashboard-topbar">
          <div><small>OPERAÇÃO CONECTADA</small><strong>{organization.name}</strong></div>
          <div className="topbar-actions"><button className="topbar-icon" aria-label="Buscar"><Search size={16} /></button><button className="topbar-icon" aria-label="Notificações"><Bell size={16} /></button><span className="profile-orb" title={name}>{initials}</span></div>
        </header>
        <div className="dashboard-content">{children}</div>
      </main>
    </div>
  );
}
