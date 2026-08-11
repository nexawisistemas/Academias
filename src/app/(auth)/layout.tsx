import { Dumbbell } from "lucide-react";
import Link from "next/link";
import "./auth.css";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <Link className="auth-brand" href="/">
          <span className="auth-brand-mark"><Dumbbell size={19} /></span>
          <span>NEXAWI <strong>ACADEMIAS</strong></span>
        </Link>
        {children}
      </section>
      <aside className="auth-visual" aria-label="Visão da plataforma">
        <div className="auth-visual-orbit" />
        <div className="auth-visual-card">
          <span>GESTÃO QUE SE MOVE COM VOCÊ</span>
          <h2>Toda a operação. Uma única visão.</h2>
          <p>Transforme dados em decisões e cada contato em uma jornada que gera resultado.</p>
          <div className="auth-stat-grid">
            <div><strong>360°</strong><small>VISÃO DA REDE</small></div>
            <div><strong>24/7</strong><small>OPERAÇÃO VIVA</small></div>
            <div><strong>1×</strong><small>FONTE DE DADOS</small></div>
          </div>
        </div>
      </aside>
    </main>
  );
}
