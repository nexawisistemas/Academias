import Link from "next/link";
import { Sparkles } from "lucide-react";
import { LoginForm } from "../forms";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const params = await searchParams;
  return (
    <div className="auth-card">
      <span className="auth-kicker"><Sparkles size={13} /> Bem-vindo de volta</span>
      <h1>Entre no comando.</h1>
      <p>Acesse sua operação, acompanhe a rede e transforme o próximo movimento em resultado.</p>
      {params.error === "callback" ? <p className="auth-message error">O link é inválido ou expirou. Tente entrar novamente.</p> : null}
      <LoginForm next={params.next} />
      <p className="auth-switch">Ainda não tem acesso? <Link href="/cadastro">Criar conta</Link></p>
    </div>
  );
}
