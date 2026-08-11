import Link from "next/link";
import { Rocket } from "lucide-react";
import { SignupForm } from "../forms";

export default function SignupPage() {
  return (
    <div className="auth-card">
      <span className="auth-kicker"><Rocket size={13} /> Comece a evolução</span>
      <h1>Construa sua nova operação.</h1>
      <p>Crie a conta do proprietário. A academia e a primeira unidade serão configuradas no próximo passo.</p>
      <SignupForm />
      <p className="auth-switch">Já possui uma conta? <Link href="/login">Entrar</Link></p>
    </div>
  );
}
