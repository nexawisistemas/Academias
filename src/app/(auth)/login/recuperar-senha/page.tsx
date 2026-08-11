import Link from "next/link";
import { KeyRound } from "lucide-react";
import { ResetRequestForm } from "../../forms";

export default function RecoverPasswordPage() {
  return (
    <div className="auth-card">
      <span className="auth-kicker"><KeyRound size={13} /> Recuperar acesso</span>
      <h1>Volte para o controle.</h1>
      <p>Informe seu e-mail. Se houver uma conta associada, enviaremos um link seguro.</p>
      <ResetRequestForm />
      <p className="auth-switch"><Link href="/login">Voltar para o login</Link></p>
    </div>
  );
}
