import "server-only";
import { createCipheriv, createDecipheriv, randomBytes, timingSafeEqual } from "node:crypto";

function encryptionKey() {
  const raw = process.env.PAYMENT_CREDENTIALS_ENCRYPTION_KEY?.trim();
  if (!raw) throw new Error("PAYMENT_CREDENTIALS_ENCRYPTION_KEY não configurada.");
  const key = /^[a-f0-9]{64}$/i.test(raw) ? Buffer.from(raw, "hex") : Buffer.from(raw, "base64");
  if (key.length !== 32) throw new Error("A chave de criptografia de pagamentos deve possuir 32 bytes.");
  return key;
}

export function paymentEncryptionReady() {
  try { encryptionKey(); return true; } catch { return false; }
}

export function encryptPaymentCredentials(value: Record<string, string>) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()]);
  return ["v1", iv.toString("base64url"), cipher.getAuthTag().toString("base64url"), encrypted.toString("base64url")].join(".");
}

export function decryptPaymentCredentials(value: string | null | undefined): Record<string, string> {
  if (!value) return {};
  const [version, ivValue, tagValue, encryptedValue] = value.split(".");
  if (version !== "v1" || !ivValue || !tagValue || !encryptedValue) throw new Error("Credencial de pagamento inválida.");
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(ivValue, "base64url"));
  decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
  const plain = Buffer.concat([decipher.update(Buffer.from(encryptedValue, "base64url")), decipher.final()]).toString("utf8");
  return JSON.parse(plain) as Record<string, string>;
}

export function generateWebhookSecret() { return randomBytes(36).toString("base64url"); }

export function safeSecretEqual(received: string | null | undefined, expected: string | null | undefined) {
  if (!received || !expected) return false;
  const left = Buffer.from(received); const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function secretHint(secret: string) { return secret.length > 10 ? `${secret.slice(0, 6)}…${secret.slice(-4)}` : "configurada"; }
