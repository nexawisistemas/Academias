import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "./server";

export async function createOperationalClient() {
  return (await createClient()) as unknown as SupabaseClient;
}

export function money(cents: number | null | undefined) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format((cents ?? 0) / 100);
}

export function shortDate(value: string | null | undefined) {
  return value ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(value)) : "—";
}
