import Link from "next/link";
import { ArrowUpRight, Dumbbell } from "lucide-react";

const navigation = [
  { href: "/plataforma", label: "Plataforma" },
  { href: "/site-da-academia", label: "Site da academia" },
  { href: "/planos", label: "Planos" },
  { href: "/faq", label: "FAQ" },
  { href: "/sobre", label: "NexaWi" },
];

export function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="public-shell">
      <div className="public-grid" aria-hidden="true" />
      <header className="public-header">
        <Link className="brand" href="/" aria-label="NexaWi Academias — início">
          <span className="brand-mark"><Dumbbell size={20} strokeWidth={2.4} /></span>
          <span>NEXAWI <strong>ACADEMIAS</strong></span>
        </Link>
        <nav className="public-nav" aria-label="Navegação principal">
          {navigation.map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}
        </nav>
        <div className="public-actions">
          <Link className="public-login" href="/login">Entrar</Link>
          <Link className="nav-cta" href="/cadastro">Criar minha operação <ArrowUpRight size={16} /></Link>
        </div>
      </header>
      {children}
      <footer className="public-footer">
        <div className="footer-brand"><strong>NexaWi Academias</strong><span>Arquitetura para academias que querem crescer.</span></div>
        <div className="footer-links">
          {navigation.map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}
          <Link href="/privacidade">Privacidade</Link>
          <Link href="/termos">Termos</Link>
        </div>
        <small>© {new Date().getFullYear()} NexaWi Sistemas.</small>
      </footer>
    </div>
  );
}

export function SectionHeading({ eyebrow, title, copy }: { eyebrow: string; title: string; copy: string }) {
  return <header className="section-heading"><span>{eyebrow}</span><h2>{title}</h2><p>{copy}</p></header>;
}
