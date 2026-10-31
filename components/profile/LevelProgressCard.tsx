"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Circle, GraduationCap } from "lucide-react";
import { ButtonLink } from "@/components/ui/primitives";

export interface LevelSummary {
  schemaReady: boolean;
  level: string | null;
  skills?: { skill: string; label: string; level: string; lastSource: string | null; lastAt: string | null }[];
  readiness?: { level: string; target: string | null; ready: boolean; criteria: { key: string; label: string; met: boolean; progressText: string }[] };
  test?: { allowed: boolean; daysLeft: number; nextAt: string | null; canStart: boolean };
}

/** Level per keterampilan + syarat menuju level berikutnya (daftar bercentang) + akses Tes Naik Level. */
export default function LevelProgressCard() {
  const [data, setData] = useState<LevelSummary | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/levels/summary")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled && d) setData(d);
      })
      .catch(() => {
        // kartu opsional: abaikan jika gagal
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Migrasi 0008 belum dijalankan, level belum ditentukan, atau gagal memuat: kartu disembunyikan
  if (!data || !data.schemaReady || !data.level || !data.skills || !data.readiness) return null;
  const { skills, readiness, test } = data;

  return (
    <div className="space-y-6 mb-8">
      <div className="bg-card border border-border rounded-3xl p-6">
        <h2 className="text-lg font-bold mb-1 flex items-center gap-2"><GraduationCap className="w-5 h-5 text-brand" /> Level per keterampilan</h2>
        <p className="text-xs text-muted-foreground mb-4">Estimasi untuk belajar, bukan sertifikat CEFR. Level tidak turun otomatis.</p>
        <ul className="divide-y divide-border">
          {skills.map((s) => (
            <li key={s.skill} className="flex items-center gap-3 py-3 min-h-[48px]">
              <span className="flex-1 min-w-0">
                <span className="block font-medium text-foreground">{s.label}</span>
                <span className="block text-xs text-muted-foreground">
                  {s.lastSource ? `Bukti terakhir: ${s.lastSource}` : "Belum ada bukti"}
                </span>
              </span>
              <span className="text-sm font-bold px-3 py-1 rounded-full bg-brand/10 text-brand">{s.level}</span>
            </li>
          ))}
        </ul>
      </div>

      {readiness.target ? (
        <div className="bg-card border border-border rounded-3xl p-6">
          <h2 className="text-lg font-bold mb-4">Progres menuju {readiness.target}</h2>
          <ul className="space-y-3 mb-5">
            {readiness.criteria.map((c) => (
              <li key={c.key} className="flex items-start gap-3">
                {c.met ? <CheckCircle2 className="w-5 h-5 text-brand shrink-0 mt-0.5" aria-label="Terpenuhi" /> : <Circle className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" aria-label="Belum terpenuhi" />}
                <span>
                  <span className="block text-sm text-foreground">{c.label}</span>
                  <span className="block text-xs text-muted-foreground">{c.progressText}</span>
                </span>
              </li>
            ))}
          </ul>
          {test?.canStart ? (
            <ButtonLink href="/english-lab/level-test">Ikuti Tes Naik Level ke {readiness.target}</ButtonLink>
          ) : readiness.ready && test && !test.allowed ? (
            <p className="text-sm text-muted-foreground">Tes ulang tersedia dalam {test.daysLeft} hari.</p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Penuhi semua syarat di atas untuk membuka{" "}
              <Link href="/english-lab/level-test" className="text-brand underline">Tes Naik Level</Link>.
            </p>
          )}
        </div>
      ) : (
        <div className="bg-card border border-border rounded-3xl p-6 text-sm text-muted-foreground">Kamu sudah di level tertinggi (C2).</div>
      )}
    </div>
  );
}
