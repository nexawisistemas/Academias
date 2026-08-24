"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, BarChart3, Building2, CalendarDays, CircleDollarSign, ClipboardPlus, Dumbbell, Gauge, History, Layers3, MessageCircleMore, Settings2, SlidersHorizontal, Target, UsersRound } from "lucide-react";

const items = [
  { href: "/dashboard", label: "Visão geral", icon: Gauge },
  { href: "/dashboard/unidades", label: "Unidades", icon: Building2 },
  { href: "/dashboard/crm", label: "CRM", icon: Target },
  { href: "/dashboard/alunos", label: "Alunos", icon: UsersRound },
  { href: "/dashboard/planos-matriculas", label: "Planos", icon: Layers3 },
  { href: "/dashboard/financeiro", label: "Financeiro", icon: CircleDollarSign },
  { href: "/dashboard/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/dashboard/treinos", label: "Treinos", icon: Dumbbell },
  { href: "/dashboard/avaliacoes", label: "Avaliações", icon: ClipboardPlus },
  { href: "/dashboard/acesso", label: "Acesso", icon: Activity },
  { href: "/dashboard/relacionamento", label: "Relacionamento", icon: MessageCircleMore },
  { href: "/dashboard/relatorios", label: "Relatórios", icon: BarChart3 },
  { href: "/dashboard/equipe", label: "Equipe", icon: UsersRound },
  { href: "/dashboard/auditoria", label: "Auditoria", icon: History },
  { href: "/dashboard/configuracoes", label: "Config.", icon: Settings2 },
];

export function DashboardNav({ isPlatformAdmin = false }: { isPlatformAdmin?: boolean }) {
  const pathname = usePathname();
  const visibleItems = isPlatformAdmin ? [...items, { href: "/dashboard/plataforma", label: "NexaWi", icon: SlidersHorizontal }] : items;
  return <nav className="dashboard-nav" aria-label="Navegação do painel">{visibleItems.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={pathname === href || pathname.startsWith(`${href}/`) ? "active" : ""}><Icon size={17} />{label}</Link>)}</nav>;
}
