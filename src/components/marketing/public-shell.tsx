import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Dumbbell, Mail, MessageCircle } from "lucide-react";
import { getPlatformSiteSettings } from "@/lib/platform-site";
import { whatsappUrl } from "@/lib/marketing-config";

const navigation = [
  { href: "/plataforma", label: "Plataforma" },
  { href: "/site-da-academia", label: "Site da academia" },
  { href: "/planos", label: "Planos" },
  { href: "/faq", label: "FAQ" },
  { href: "/sobre", label: "NexaWi" },
];

export async function PublicShell({ children }: { children: React.ReactNode }) {
  const { company } = await getPlatformSiteSettings();
  return (
    <div className="public-shell">
      <div className="public-grid" aria-hidden="true" />
      <header className="public-header">
        <Link className="brand" href="/" aria-label="NexaWi Academias — início">
          <span className="brand-mark">{company.logoUrl ? <Image src={company.logoUrl} alt="" width={24} height={24} /> : <Dumbbell size={20} strokeWidth={2.4} />}</span>
          <span>NEXAWI <strong>ACADEMIAS</strong></span>
        </Link>
        <nav className="public-nav" aria-label="Navegação principal">
          {navigation.map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}
        </nav>
        <div className="public-actions">
          <Link className="public-login" href="/login">Entrar</Link>
          <Link className="nav-cta" href="/demonstracao">Agendar demonstração <ArrowUpRight size={16} /></Link>
        </div>
      </header>
      {children}
      <footer className="public-footer">
        <div className="footer-brand"><strong>{company.tradeName}</strong><span>Gestão e presença digital para academias que querem crescer.</span><span>{company.city} · {company.state}</span></div>
        <div className="footer-links">
          {navigation.map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}
          <Link href="/privacidade">Privacidade</Link>
          <Link href="/termos">Termos</Link>
          <Link href="/cookies">Cookies</Link>
          <Link href="/contrato">Modelo de contrato</Link>
        </div>
        <div className="footer-links">
          <a href={`mailto:${company.email}`}><Mail size={13} /> {company.email}</a>
          <a href={whatsappUrl()} target="_blank" rel="noreferrer"><MessageCircle size={13} /> {company.whatsappDisplay}</a>
        </div>
        <small>© {new Date().getFullYear()} {company.legalName} · CNPJ {company.taxId}. Todos os direitos reservados.</small>
      </footer>
    </div>
  );
}

export function SectionHeading({ eyebrow, title, copy }: { eyebrow: string; title: string; copy: string }) {
  return <header className="section-heading"><span>{eyebrow}</span><h2>{title}</h2><p>{copy}</p></header>;
}
