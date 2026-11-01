// Mengambil objek JSON dari keluaran AI yang kadang dibungkus pagar kode ```json ... ``` atau diberi kalimat pengantar.
// Fungsi murni (tanpa import) agar bisa diuji unit; dipakai route analyze-tone dan wotd.

export function extractJsonObject(content: string | null | undefined): unknown | null {
  if (!content) return null;
  const text = content.replace(/```(?:json)?/gi, "").trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}
