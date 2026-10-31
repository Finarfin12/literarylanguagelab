// lib/ai/crypto.ts
// Enkripsi API key provider dengan AES-256-GCM. Hanya dipakai di server.
// Kunci dari env AI_SECRETS_KEY (32 byte, base64). Format simpan: iv:tag:cipher (base64).

import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

function getKey(): Buffer | null {
  const raw = process.env.AI_SECRETS_KEY;
  if (!raw) return null;
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new Error("AI_SECRETS_KEY harus 32 byte dalam format base64.");
  }
  return key;
}

export function isSecretsKeyConfigured(): boolean {
  try {
    return getKey() !== null;
  } catch {
    return false;
  }
}

export function encryptSecret(plain: string): string {
  const key = getKey();
  if (!key) throw new Error("AI_SECRETS_KEY belum dikonfigurasi; API key tidak bisa disimpan.");

  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, encrypted].map((b) => b.toString("base64")).join(":");
}

export function decryptSecret(stored: string): string {
  const key = getKey();
  if (!key) throw new Error("AI_SECRETS_KEY belum dikonfigurasi; API key tidak bisa dibaca.");

  const [ivB64, tagB64, dataB64] = stored.split(":");
  if (!ivB64 || !tagB64 || !dataB64) throw new Error("Format secret tidak valid.");

  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(dataB64, "base64")), decipher.final()]).toString("utf8");
}

/** Tampilan aman untuk UI, mis. "sk-…abcd". */
export function maskSecret(plain: string): string {
  if (plain.length <= 8) return "••••";
  return `${plain.slice(0, 3)}…${plain.slice(-4)}`;
}
