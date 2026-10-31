import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";

// Kode error Postgres/PostgREST saat kolom belum ada (migrasi 0005 belum dijalankan)
const MISSING_COLUMN_CODES = ["42703", "PGRST204"];

export async function POST(req: Request) {
  try {
    const authResult = await requireUser();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { supabase, user } = authResult;

    const { text_id, time_spent_seconds, block_index, total_blocks, title, author } = await req.json();

    if (!text_id || typeof text_id !== "string" || typeof time_spent_seconds === "undefined") {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // B-05: Batasi time_spent_seconds ke rentang 1–60 detik per panggilan
    const parsedSeconds = Number(time_spent_seconds);
    if (isNaN(parsedSeconds) || parsedSeconds <= 0) {
      return NextResponse.json({ error: "Invalid time_spent_seconds" }, { status: 400 });
    }
    const safeTimeSpent = Math.min(Math.max(Math.floor(parsedSeconds), 1), 60);

    // F-02: posisi baca (indeks blok) dan progres
    const blockIndex = Number.isInteger(block_index) && block_index >= 0 ? block_index : null;
    const totalBlocks = Number.isInteger(total_blocks) && total_blocks > 0 ? total_blocks : null;
    const position =
      blockIndex !== null
        ? {
            last_paragraph_index: blockIndex,
            progress_pct: totalBlocks ? Math.min(100, Math.round(((blockIndex + 1) / totalBlocks) * 1000) / 10) : null,
          }
        : {};

    // Buku Gutenberg tidak ada di tabel texts, jadi dicatat lewat source_key
    const isExternal = text_id.startsWith("gutenberg_");
    if (isExternal && !/^gutenberg_\d+$/.test(text_id)) {
      return NextResponse.json({ error: "Invalid text_id" }, { status: 400 });
    }
    const keyColumn = isExternal ? "source_key" : "text_id";
    const sourceMeta = isExternal
      ? {
          source_title: typeof title === "string" ? title.slice(0, 300) : null,
          source_author: typeof author === "string" ? author.slice(0, 300) : null,
        }
      : {};

    // B-05: Hindari kegagalan saat ada sesi ganda dengan order & maybeSingle
    const { data: session, error: selectError } = await supabase
      .from("reading_sessions")
      .select("id, time_spent_seconds")
      .eq("user_id", user.id)
      .eq(keyColumn, text_id)
      .order("last_active_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (selectError && MISSING_COLUMN_CODES.includes(selectError.code)) {
      // Sebelum migrasi 0005 buku Gutenberg tidak bisa dicatat; teks Library tetap jalan.
      return NextResponse.json({ success: false, recorded_seconds: 0, reason: "migration_pending" });
    }

    const now = new Date().toISOString();
    const write = async (extra: Record<string, unknown>) => {
      if (session) {
        return supabase
          .from("reading_sessions")
          .update({
            time_spent_seconds: (session.time_spent_seconds || 0) + safeTimeSpent,
            last_active_at: now,
            ...extra,
          })
          .eq("id", session.id);
      }
      return supabase.from("reading_sessions").insert({
        user_id: user.id,
        text_id: isExternal ? null : text_id,
        ...(isExternal ? { source_key: text_id } : {}),
        time_spent_seconds: safeTimeSpent,
        last_active_at: now,
        started_at: now,
        ...extra,
      });
    };

    let { error } = await write({ ...position, ...sourceMeta });
    if (error && MISSING_COLUMN_CODES.includes(error.code) && !isExternal) {
      // Kolom posisi belum ada: tetap catat waktu baca
      ({ error } = await write({}));
    }
    if (error) {
      console.error("Heartbeat write error:", error.message);
      return NextResponse.json({ error: "Gagal mencatat waktu baca" }, { status: 500 });
    }

    return NextResponse.json({ success: true, recorded_seconds: safeTimeSpent });
  } catch (error: unknown) {
    console.error("Heartbeat Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
