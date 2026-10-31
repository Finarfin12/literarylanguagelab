// Ekspor CSV untuk Ruang Kerja Segmen. Fungsi murni, tanpa import.

/**
 * Satu sel CSV. Sel yang diawali = + - @ (atau tab/CR) diberi awalan apostrof agar tidak dibaca
 * sebagai rumus oleh Excel/Sheets (CSV injection); tanda kutip ganda digandakan.
 */
export function csvCell(value: unknown): string {
  let s = value === null || value === undefined ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** CSV dengan BOM UTF-8 (agar Excel membaca huruf non-ASCII dengan benar) dan baris CRLF. */
export function toCsv(rows: unknown[][]): string {
  return "﻿" + rows.map((r) => r.map(csvCell).join(",")).join("\r\n") + "\r\n";
}
