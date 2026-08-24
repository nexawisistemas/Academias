import Link from "next/link";
import { PublicShell } from "./public-shell";

export function LegalPage({ eyebrow, title, intro, children }: { eyebrow: string; title: string; intro: string; children: React.ReactNode }) {
  return <PublicShell><main className="legal-shell"><header><span>{eyebrow}</span><h1>{title}</h1><p>{intro}</p><small>Versão 1.0 · atualizada em 24 de agosto de 2026</small></header><article className="legal-content"><aside><strong>Navegação jurídica</strong><Link href="/privacidade">Privacidade</Link><Link href="/termos">Termos de Uso</Link><Link href="/cookies">Cookies</Link><Link href="/contrato">Modelo de contrato</Link></aside><div>{children}<div className="legal-review"><strong>Revisão jurídica recomendada</strong><p>Este documento é uma estrutura operacional preparada para o lançamento. Antes de vincular uma contratação definitiva, a NexaWi deve submetê-lo à validação de advogado e adequá-lo ao fluxo real de pagamento, integrações e tratamento de dados contratado.</p></div></div></article></main></PublicShell>;
}
