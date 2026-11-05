"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { Button, Card } from "@/components/ui/primitives";
import {
  CEFR_LABELS,
  CEFR_LEVELS,
  DAILY_MINUTES,
  GOAL_LABELS,
  LEARNING_GOALS,
  LEVEL_UNKNOWN,
  LEVEL_ZERO,
  type CefrLevel,
  type DailyMinutes,
  type LearningGoal,
} from "@/lib/learning-goals";
import { saveOnboarding } from "./actions";

type Level = CefrLevel | typeof LEVEL_UNKNOWN | typeof LEVEL_ZERO;

const STEPS = ["Level", "Tujuan", "Waktu"] as const;

function Option({ selected, onClick, title, description }: { selected: boolean; onClick: () => void; title: string; description?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`w-full min-h-[56px] px-4 py-3 rounded-control border text-left flex items-center gap-3 transition-colors ${
        selected ? "border-brand-solid bg-brand-tint" : "border-border bg-card hover:bg-muted"
      }`}
    >
      <span className="flex-1">
        <span className="block font-semibold text-foreground">{title}</span>
        {description && <span className="block text-sm text-muted-foreground">{description}</span>}
      </span>
      {selected && <Check className="w-5 h-5 text-brand-ink shrink-0" aria-hidden="true" />}
    </button>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [level, setLevel] = useState<Level | null>(null);
  const [goal, setGoal] = useState<LearningGoal | null>(null);
  const [minutes, setMinutes] = useState<DailyMinutes | null>(null);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const canNext = step === 0 ? level !== null : step === 1 ? goal !== null : minutes !== null;

  const submit = (skipped: boolean) => {
    setError("");
    startTransition(async () => {
      const res = await saveOnboarding({ level, goal, minutes, skipped });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      // Tanpa router.refresh(): halaman tujuan dirender ulang di server saat navigasi,
      // refresh tambahan hanya menggandakan pekerjaan server.
      router.push(res.next);
    });
  };

  return (
    <div className="px-4 md:px-6 py-6 lg:py-8 max-w-xl mx-auto pb-24">
      <div className="mb-6">
        <p className="text-[11px] md:text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground mb-1">Selamat datang</p>
        <h1 className="font-serif text-[28px] md:text-4xl font-medium leading-[1.15] text-foreground">Literary Lab</h1>
        <p className="text-muted-foreground mt-1">Tiga pertanyaan singkat supaya beranda kamu pas. Bisa diubah kapan saja di Pengaturan.</p>
      </div>

      <ol className="flex items-center gap-2 mb-4" aria-label="Langkah onboarding">
        {STEPS.map((label, i) => (
          <li key={label} className={`flex-1 text-center text-xs font-bold py-2 rounded-control ${i === step ? "bg-brand-solid text-on-brand" : i < step ? "bg-brand-tint text-brand-ink" : "bg-muted text-muted-foreground"}`}>
            {i + 1}. {label}
          </li>
        ))}
      </ol>

      <Card>
        {step === 0 && (
          <fieldset className="space-y-2">
            <legend className="font-serif text-xl font-medium text-foreground mb-3">Level bahasa Inggris kamu?</legend>
            <Option
              selected={level === LEVEL_ZERO}
              onClick={() => setLevel(LEVEL_ZERO)}
              title="Baru mulai dari nol"
              description="Belum pernah belajar atau lupa semua. Tidak perlu tes."
            />
            <Option
              selected={level === LEVEL_UNKNOWN}
              onClick={() => setLevel(LEVEL_UNKNOWN)}
              title="Belum tahu, tes dulu"
              description="Kamu akan diarahkan ke tes singkat setelah ini."
            />
            {CEFR_LEVELS.map((l) => (
              <Option key={l} selected={level === l} onClick={() => setLevel(l)} title={CEFR_LABELS[l]} />
            ))}
          </fieldset>
        )}

        {step === 1 && (
          <fieldset className="space-y-2">
            <legend className="font-serif text-xl font-medium text-foreground mb-3">Tujuan utama?</legend>
            {LEARNING_GOALS.map((g) => (
              <Option key={g} selected={goal === g} onClick={() => setGoal(g)} title={GOAL_LABELS[g].title} description={GOAL_LABELS[g].description} />
            ))}
          </fieldset>
        )}

        {step === 2 && (
          <fieldset className="space-y-2">
            <legend className="font-serif text-xl font-medium text-foreground mb-3">Waktu belajar per hari?</legend>
            {DAILY_MINUTES.map((m) => (
              <Option key={m} selected={minutes === m} onClick={() => setMinutes(m)} title={m === 30 ? "30 menit atau lebih" : `${m} menit`} />
            ))}
          </fieldset>
        )}

        {error && <p role="alert" className="mt-4 text-sm text-danger">{error}</p>}

        <div className="mt-6 flex items-center gap-2">
          {step > 0 && (
            <Button variant="secondary" onClick={() => setStep(step - 1)} disabled={pending}>
              Kembali
            </Button>
          )}
          <div className="flex-1" />
          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canNext}>
              Lanjut
            </Button>
          ) : (
            <Button onClick={() => submit(false)} disabled={!canNext} loading={pending}>
              Selesai
            </Button>
          )}
        </div>
      </Card>

      <div className="mt-4 text-center">
        <Button variant="ghost" onClick={() => submit(true)} disabled={pending}>
          Lewati untuk sekarang
        </Button>
      </div>
    </div>
  );
}
