"use client";

import { useActionState, useEffect } from "react";
import type { ActionResult } from "./action-types";

type Props = Omit<React.FormHTMLAttributes<HTMLFormElement>, "action"> & {
  action: (formData: FormData) => Promise<ActionResult>;
};

export function ActionForm({ action, children, ...props }: Props) {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    async (_previous, formData) => {
      try {
        return await action(formData);
      } catch {
        return { ok: false, message: "Não foi possível concluir a operação. Tente novamente." };
      }
    },
    null,
  );

  useEffect(() => {
    if (state?.ok && state.redirectTo) window.location.assign(state.redirectTo);
  }, [state]);

  return (
    <form {...props} action={formAction} aria-busy={pending}>
      {children}
      {pending && <p className="action-message action-pending">Processando…</p>}
      {state && !pending && (
        <p className={`action-message ${state.ok ? "action-success" : "action-error"}`} role="status">
          {state.message}
        </p>
      )}
    </form>
  );
}
