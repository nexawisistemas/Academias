"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  loginAction,
  requestPasswordResetAction,
  signupAction,
  updatePasswordAction,
} from "./actions";
import type { ActionState } from "@/lib/auth/validation";

const initialState: ActionState = {};

function Message({ state }: { state: ActionState }) {
  if (!state.message) return null;
  return <p className={`auth-message ${state.status ?? "error"}`} role="status">{state.message}</p>;
}

function FieldError({ errors }: { errors?: string[] }) {
  return errors?.length ? <span className="auth-error">{errors[0]}</span> : null;
}

export function LoginForm({ next = "/dashboard" }: { next?: string }) {
  const [state, action, pending] = useActionState(loginAction, initialState);
  return (
    <form className="auth-form" action={action}>
      <input type="hidden" name="next" value={next} />
      <Message state={state} />
      <div className="auth-field"><label htmlFor="email">E-mail</label><input id="email" name="email" type="email" autoComplete="email" placeholder="voce@academia.com.br" required /><FieldError errors={state.errors?.email} /></div>
      <div className="auth-field"><label htmlFor="password">Senha</label><input id="password" name="password" type="password" autoComplete="current-password" placeholder="Sua senha" required /><FieldError errors={state.errors?.password} /></div>
      <div className="auth-row"><span>Ambiente seguro e criptografado</span><Link href="/login/recuperar-senha">Esqueci minha senha</Link></div>
      <button className="auth-submit" disabled={pending}>{pending ? "Entrando..." : "Entrar na plataforma"}</button>
    </form>
  );
}

export function SignupForm() {
  const [state, action, pending] = useActionState(signupAction, initialState);
  return (
    <form className="auth-form" action={action}>
      <Message state={state} />
      <div className="auth-field"><label htmlFor="fullName">Nome completo</label><input id="fullName" name="fullName" autoComplete="name" placeholder="Seu nome" required /><FieldError errors={state.errors?.fullName} /></div>
      <div className="auth-field"><label htmlFor="email">E-mail profissional</label><input id="email" name="email" type="email" autoComplete="email" placeholder="voce@academia.com.br" required /><FieldError errors={state.errors?.email} /></div>
      <div className="auth-field"><label htmlFor="password">Crie uma senha</label><input id="password" name="password" type="password" autoComplete="new-password" placeholder="8+ caracteres, letras e número" required /><FieldError errors={state.errors?.password} /></div>
      <label className="auth-check"><input name="terms" type="checkbox" required /><span>Li e aceito os <Link href="/termos">Termos de Uso</Link> e a <Link href="/privacidade">Política de Privacidade</Link>.</span></label>
      <FieldError errors={state.errors?.terms} />
      <button className="auth-submit" disabled={pending}>{pending ? "Criando conta..." : "Criar minha conta"}</button>
    </form>
  );
}

export function ResetRequestForm() {
  const [state, action, pending] = useActionState(requestPasswordResetAction, initialState);
  return (
    <form className="auth-form" action={action}>
      <Message state={state} />
      <div className="auth-field"><label htmlFor="email">E-mail da conta</label><input id="email" name="email" type="email" autoComplete="email" placeholder="voce@academia.com.br" required /><FieldError errors={state.errors?.email} /></div>
      <button className="auth-submit" disabled={pending}>{pending ? "Enviando..." : "Enviar instruções"}</button>
    </form>
  );
}

export function UpdatePasswordForm() {
  const [state, action, pending] = useActionState(updatePasswordAction, initialState);
  return (
    <form className="auth-form" action={action}>
      <Message state={state} />
      <div className="auth-field"><label htmlFor="password">Nova senha</label><input id="password" name="password" type="password" autoComplete="new-password" placeholder="8+ caracteres, letras e número" required /><FieldError errors={state.errors?.password} /></div>
      <button className="auth-submit" disabled={pending}>{pending ? "Atualizando..." : "Definir nova senha"}</button>
    </form>
  );
}
