import { LockKeyhole } from "lucide-react";
import { UpdatePasswordForm } from "../../forms";

export default function NewPasswordPage() {
  return (
    <div className="auth-card">
      <span className="auth-kicker"><LockKeyhole size={13} /> Nova credencial</span>
      <h1>Proteja seu acesso.</h1>
      <p>Escolha uma nova senha forte para continuar na plataforma.</p>
      <UpdatePasswordForm />
    </div>
  );
}
