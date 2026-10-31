import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getRateLimit } from "@/lib/ai-config";
import { isFeatureOn } from "@/lib/ai/flags";

// In-memory sliding window cache for rate limiting (fallback & high-reliability)
const usageMemory = new Map<string, number[]>();

function getRecentCountFromMemory(key: string, windowMs: number): number {
  const now = Date.now();
  const timestamps = usageMemory.get(key) || [];
  const valid = timestamps.filter((t) => now - t < windowMs);
  usageMemory.set(key, valid);
  return valid.length;
}

function recordUsageInMemory(key: string) {
  const now = Date.now();
  const timestamps = usageMemory.get(key) || [];
  timestamps.push(now);
  if (timestamps.length > 1000) {
    timestamps.splice(0, timestamps.length - 1000);
  }
  usageMemory.set(key, timestamps);
}

function mapFeatureToUseCase(featureKey?: string): "lookup" | "translation" | "generation" | "tools" {
  if (!featureKey) return "tools";
  const k = featureKey.toLowerCase();
  if (k.includes("lookup") || k.includes("lexicon")) return "lookup";
  if (k.includes("translation") || k.includes("comparator")) return "translation";
  if (k.includes("generate")) return "generation";
  return "tools";
}

/**
 * Memeriksa apakah pengguna telah melebihi batas kuota AI per menit atau per hari.
 * Mengembalikan NextResponse (429) jika limit terlampaui, atau null jika lolos.
 */
export async function checkRateLimit(
  userId: string,
  featureKey: string = "tools"
): Promise<NextResponse | null> {
  // Fitur yang dimatikan admin (Admin → Fitur) tidak dihitung sebagai pemakaian
  if (!(await isFeatureOn(featureKey))) {
    return NextResponse.json({ error: "Fitur ini sedang dinonaktifkan oleh admin." }, { status: 503 });
  }

  const useCase = mapFeatureToUseCase(featureKey);
  const limits = await getRateLimit(useCase);
  const limitPerMinute = limits.requests_per_minute || 30;
  const limitPerHour = limits.requests_per_hour || 500;

  // 1. Cek in-memory sliding window
  const memCountMinute = getRecentCountFromMemory(userId, 60 * 1000);
  const memCountHour = getRecentCountFromMemory(`${userId}:hour`, 60 * 60 * 1000);

  if (memCountMinute >= limitPerMinute) {
    return NextResponse.json(
      {
        error: `Batas pemakaian AI tercapai (maksimum ${limitPerMinute} request/menit). Silakan tunggu sebentar.`,
      },
      {
        status: 429,
        headers: { "Retry-After": "60" },
      }
    );
  }

  if (memCountHour >= limitPerHour) {
    return NextResponse.json(
      {
        error: "Batas pemakaian AI harian tercapai. Silakan coba kembali nanti.",
      },
      {
        status: 429,
        headers: { "Retry-After": "3600" },
      }
    );
  }

  // 2. Cek database via RPC count_recent_usage jika tersedia
  try {
    const supabase = await createClient();
    const { data: dbCountMinute, error: rpcError } = await supabase.rpc(
      "count_recent_usage",
      {
        target_user_id: userId,
        interval_text: "1 minute",
      }
    );

    if (!rpcError && typeof dbCountMinute === "number") {
      if (dbCountMinute >= limitPerMinute) {
        return NextResponse.json(
          {
            error: `Batas pemakaian AI tercapai (maksimum ${limitPerMinute} request/menit). Silakan tunggu sebentar.`,
          },
          {
            status: 429,
            headers: { "Retry-After": "60" },
          }
        );
      }
    }
  } catch {
    // Abaikan jika RPC belum tersedia di database
  }

  // Catat pemakaian
  recordUsageInMemory(userId);
  recordUsageInMemory(`${userId}:hour`);

  // Asinkron log ke tabel ai_usage_logs (best effort)
  try {
    const supabase = await createClient();
    await supabase.from("ai_usage_logs").insert({
      user_id: userId,
      feature_key: featureKey,
      status: "requested",
    });
  } catch {
    // Diamkan jika tabel belum siap di database
  }

  return null;
}

/**
 * Rate limit per IP untuk route publik (mis. Gutenberg)
 */
export async function checkIpRateLimit(
  ip: string,
  limitPerMinute: number = 60
): Promise<NextResponse | null> {
  const count = getRecentCountFromMemory(`ip:${ip}`, 60 * 1000);
  if (count >= limitPerMinute) {
    return NextResponse.json(
      { error: "Terlalu banyak permintaan. Silakan tunggu sebentar." },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }
  recordUsageInMemory(`ip:${ip}`);
  return null;
}

