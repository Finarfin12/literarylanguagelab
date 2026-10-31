// lib/ai/url-guard.ts
// Mencegah SSRF: base URL provider wajib https dan tidak boleh mengarah ke IP privat,
// loopback, link-local, atau metadata cloud, kecuali admin mengizinkan endpoint lokal.

import { lookup } from "dns/promises";
import { isIP } from "net";

function isPrivateIPv4(ip: string): boolean {
  const [a, b] = ip.split(".").map(Number);
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) || // CGNAT
    (a === 169 && b === 254) ||           // link-local / metadata
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    a >= 224                              // multicast & reserved
  );
}

function isPrivateIPv6(ip: string): boolean {
  const lower = ip.toLowerCase();
  if (lower === "::" || lower === "::1") return true;
  if (lower.startsWith("fe80") || lower.startsWith("fc") || lower.startsWith("fd")) return true;
  const mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  return mapped ? isPrivateIPv4(mapped[1]) : false;
}

export function isPrivateAddress(ip: string): boolean {
  return isIP(ip) === 6 ? isPrivateIPv6(ip) : isPrivateIPv4(ip);
}

/**
 * Memvalidasi base URL provider. Melempar Error dengan pesan yang bisa ditampilkan ke admin.
 */
export async function assertSafeBaseUrl(rawUrl: string, allowPrivateNetwork = false): Promise<URL> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error("Base URL tidak valid.");
  }

  if (allowPrivateNetwork) {
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      throw new Error("Base URL harus memakai http:// atau https://.");
    }
    return url;
  }

  if (url.protocol !== "https:") {
    throw new Error("Base URL wajib memakai https:// (nyalakan 'izinkan endpoint lokal' untuk Ollama/LM Studio).");
  }

  const host = url.hostname.replace(/^\[|\]$/g, "");
  const addresses = isIP(host) ? [host] : (await lookup(host, { all: true })).map((r) => r.address);
  if (addresses.length === 0 || addresses.some(isPrivateAddress)) {
    throw new Error("Base URL mengarah ke jaringan privat/lokal dan diblokir.");
  }
  return url;
}
