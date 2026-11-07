"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/primitives";
import { saveLearningGoal } from "@/app/(dashboard)/onboarding/actions";
import { useToastOn } from "@/lib/swal";
import {
  DAILY_MINUTES,
  GOAL_LABELS,
  LEARNING_GOALS,
  type DailyMinutes,
  type LearningGoal,
} from "@/lib/learning-goals";

/** Bagian "Tujuan belajar" di Pengaturan. Menyimpan sendiri (tidak ikut tombol Simpan halaman). */
export default function LearningGoalSection({ initialGoal, initialMinutes }: { initialGoal: LearningGoal | null; initialMinutes: DailyMinutes | null }) {
  const [goal, setGoal] = useState<LearningGoal>(initialGoal ?? "umum");
  const [minutes, setMinutes] = useState<DailyMinutes>(initialMinutes ?? 20);
  const [message, setMessage] = useState("");
  useToastOn(message, "info");
  const [pending, startTransition] = useTransition();

  const save = () => {
    setMessage("");
    startTransition(async () => {
      const res = await saveLearningGoal(goal, minutes);
      setMessage(res.ok ? "Tersimpan. Beranda akan menyesuaikan." : res.error);
    });
  };

  return (
    <div>
      <h3 className="text-lg font-bold text-foreground mb-4">Tujuan belajar</h3>
      <div className="space-y-3">
        <div className="space-y-1">
          <label htmlFor="learning-goal" className="text-sm font-medium">Tujuan utama</label>
          <select
            id="learning-goal"
            value={goal}
            onChange={(e) => setGoal(e.target.value as LearningGoal)}
            className="w-full min-h-[44px] bg-foreground/5 border border-foreground/10 rounded-control px-3 py-2 text-sm"
          >
            {LEARNING_GOALS.map((g) => (
              <option key={g} value={g}>{GOAL_LABELS[g].title}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor="daily-minutes" className="text-sm font-medium">Waktu belajar per hari</label>
          <select
            id="daily-minutes"
            value={minutes}
            onChange={(e) => setMinutes(Number(e.target.value) as DailyMinutes)}
            className="w-full min-h-[44px] bg-foreground/5 border border-foreground/10 rounded-control px-3 py-2 text-sm"
          >
            {DAILY_MINUTES.map((m) => (
              <option key={m} value={m}>{m === 30 ? "30 menit atau lebih" : `${m} menit`}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-3">
          <Button type="button" variant="secondary" onClick={save} loading={pending}>Simpan tujuan</Button>
        </div>
      </div>
    </div>
  );
}
