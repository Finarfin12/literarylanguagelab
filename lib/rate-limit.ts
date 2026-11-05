import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getRateLimit } from "@/lib/ai-config";
import { isFeatureOn } from "@/lib/ai/flags";
import { DEFAULT_PER_DAY, isMissingRpc, isOverLimit, limitMessage, windowSpecs } from "@/lib/rate-limit-rules";

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

function tooMany(message: string, retryAfter: number) {
  return NextResponse.json({ error: message }, { status: 429, headers: { "Retry-After": String(retryAfter) } });
}

type Limits = { perMinute: number; perHour: number; perDay: number };

/**
 * Penghitung lintas instance (migrasi 0019, fungsi consume_rate_limit).
 * Hasil: "unavailable" = migrasi belum dijalankan (pakai perilaku lama), "ok", atau respons galat (429/503).
 */
async function consumeFromDatabase(useCase: string, limits: Limits): Promise<"unavailable" | "ok" | NextResponse> {
  try {
    const supabase = await createClient();
    const specs = windowSpecs(limits);
    // Menit dulu: bila sudah penuh, jendela jam/hari tidak ikut bertambah oleh permintaan yang ditolak.
    for (const group of [[specs[0]], [specs[1], specs[2]]]) {
      const results = await Promise.all(
        group.map(async (w) => ({
          w,
          res: await supabase.rpc("consume_rate_limit", {
            p_key: `ai:${useCase}`,
            p_window_seconds: w.seconds,
            p_limit: w.limit,
          }),
        }))
      );
      for (const { w, res } of results) {
        if (res.error) {
          if (isMissingRpc(res.error)) return "unavailable";
          console.error("consume_rate_limit gagal:", res.error);
          return NextResponse.json(
            { error: "Penghitung batas pemakaian AI sedang bermasalah. Silakan coba lagi sebentar." },
            { status: 503, headers: { "Retry-After": "30" } }
          );
        }
        if (typeof res.data === "number" && isOverLimit(res.data, w.limit)) {
          return tooMany(limitMessage(w.name, w.limit), w.retryAfter);
        }
      }
    }
    return "ok";
  } catch (err) {
    console.error("consume_rate_limit error:", err);
    return NextResponse.json(
      { error: "Penghitung batas pemakaian AI sedang bermasalah. Silakan coba lagi sebentar." },
      { status: 503, headers: { "Retry-After": "30" } }
    );
  }
}

/**
 * Memeriksa apakah pengguna telah melebihi batas kuota AI per menit, jam, atau hari.
 * Mengembalikan NextResponse (429/503) jika ditolak, atau null jika lolos.
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
  const config = await getRateLimit(useCase);
  const limitPerMinute = config.requests_per_minute || 30;
  const limitPerHour = config.requests_per_hour || 500;
  const limitPerDay = config.requests_per_day || DEFAULT_PER_DAY;

  // 1. Cek in-memory sliding window
  const memCountMinute = getRecentCountFromMemory(userId, 60 * 1000);
  const memCountHour = getRecentCountFromMemory(`${userId}:hour`, 60 * 60 * 1000);

  if (memCountMinute >= limitPerMinute) {
    return tooMany(limitMessage("minute", limitPerMinute), 60);
  }

  if (memCountHour >= limitPerHour) {
    return tooMany(limitMessage("hour", limitPerHour), 3600);
  }

  // 2. Penghitung database lintas instance (0019). Jika belum dimigrasi: perilaku lama lewat count_recent_usage.
  const consumed = await consumeFromDatabase(useCase, {
    perMinute: limitPerMinute,
    perHour: limitPerHour,
    perDay: limitPerDay,
  });
  if (consumed instanceof NextResponse) return consumed;

  if (consumed === "unavailable") {
    try {
      const supabase = await createClient();
      const { data: dbCountMinute, error: rpcError } = await supabase.rpc("count_recent_usage", {
        target_user_id: userId,
        interval_text: "1 minute",
      });

      if (!rpcError && typeof dbCountMinute === "number" && dbCountMinute >= limitPerMinute) {
        return tooMany(limitMessage("minute", limitPerMinute), 60);
      }
    } catch {
      // Abaikan jika RPC belum tersedia di database
    }
  }

  // Catat pemakaian
  recordUsageInMemory(userId);
  recordUsageInMemory(`${userId}:hour`);

  // Log ke tabel ai_usage_logs (best effort). Baris 'requested' ini hanya untuk statistik Admin,
  // bukan sumber hitungan batas bila 0019 sudah ada.
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
