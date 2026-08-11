"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, Gauge, History, Settings2, UsersRound } from "lucide-react";

const items = [
  { href: "/dashboard", label: "Visão geral", icon: Gauge },
  { href: "/dashboard/unidades", label: "Unidades", icon: Building2 },
  { href: "/dashboard/equipe", label: "Equipe", icon: UsersRound },
  { href: "/dashboard/auditoria", label: "Auditoria", icon: History },
  { href: "/dashboard/configuracoes", label: "Config.", icon: Settings2 },
];

export function DashboardNav() {
  const pathname = usePathname();
  return <nav className="dashboard-nav" aria-label="Navegação do painel">{items.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={pathname === href ? "active" : ""}><Icon size={17} />{label}{href !== "/dashboard" ? <span>BASE</span> : null}</Link>)}</nav>;
}
