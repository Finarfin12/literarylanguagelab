"use client";

import { useRef, useState } from "react";
import { Ear, RotateCcw } from "lucide-react";
import { Button, Card, CardTitle, ProgressBar } from "@/components/ui/primitives";
import ExerciseSession from "@/components/exercises/ExerciseSession";
import PronunciationLab from "@/components/PronunciationLab";
import { choiceClass } from "@/components/exercises/shared";
import { SpeakButtons } from "@/components/course/StepViews";
import { gradePairChoice, pickPairRounds, MINIMAL_PAIR_TAG, type MinimalPair, type PairRound } from "@/lib/l1";
import { mulberry32 } from "@/lib/exercises/session";

const ROUNDS = 10;

/** Pasangan Bunyi: latihan dengar (pilih kata yang didengar), daftar pasangan + IPA, dikte, dan Pronunciation Clinic. */
export default function PairsDrill({ pairs }: { pairs: MinimalPair[] }) {
  const [rounds, setRounds] = useState<PairRound[]>([]);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState<"idle" | "running" | "done">("idle");
  const [wrongPairs, setWrongPairs] = useState<string[]>([]);
  const counter = useRef(0);

  const start = () => {
    counter.current += 1;
    const seed = (Date.now() ^ Math.floor(Math.random() * 0xffffffff) ^ counter.current) >>> 0;
    setRounds(pickPairRounds(pairs, ROUNDS, mulberry32(seed)));
    setIndex(0);
    setPicked(null);
    setScore(0);
    setWrongPairs([]);
    setPhase("running");
  };

  const round = rounds[index];
  const answered = picked !== null;
  const pairOf = (slug: string) => pairs.find((p) => p.slug === slug);

  const choose = (word: string) => {
    if (answered || !round) return;
    setPicked(word);
    if (gradePairChoice(round, word)) setScore((s) => s + 1);
    else setWrongPairs((w) => (w.includes(round.pairSlug) ? w : [...w, round.pairSlug]));
  };

  const next = () => {
    if (index + 1 < rounds.length) {
      setIndex(index + 1);
      setPicked(null);
    } else setPhase("done");
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardTitle icon={<Ear className="w-5 h-5 text-brand-ink" />}>Latihan dengar</CardTitle>
        {phase === "idle" && (
          <div>
            <p className="text-sm text-muted-foreground mb-3">Kamu akan mendengar satu kata. Pilih kata yang kamu dengar dari dua pilihan yang bunyinya mirip. {ROUNDS} ronde.</p>
            <Button onClick={start} disabled={pairs.length === 0}>Mulai latihan</Button>
          </div>
        )}

        {phase === "running" && round && (
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-muted-foreground mb-2">
              <span>Ronde {index + 1} dari {rounds.length}</span>
              <span className="nums">Benar: {score}</span>
            </div>
            <ProgressBar value={(index / rounds.length) * 100} label="Kemajuan latihan dengar" className="mb-5" />
            <p className="font-serif text-xl text-foreground mb-3">Kata mana yang kamu dengar?</p>
            <SpeakButtons text={round.word} label="kata yang harus ditebak" />
            <div className="mt-4 grid grid-cols-2 gap-3" role="group" aria-label="Pilihan kata">
              {round.options.map((w) => {
                const right = answered && w === round.word;
                const wrong = answered && picked === w && w !== round.word;
                return (
                  <button
                    key={w}
                    type="button"
                    disabled={answered}
                    onClick={() => choose(w)}
                    className={`${choiceClass(right ? "correct" : wrong ? "wrong" : answered ? "muted" : "idle")} !text-center font-serif !text-xl min-h-[56px]`}
                  >
                    {w}
                    {right && <span className="sr-only"> (jawaban benar)</span>}
                    {wrong && <span className="sr-only"> (jawabanmu salah)</span>}
                  </button>
                );
              })}
            </div>
            {answered && (
              <div role="status" aria-live="polite" className="mt-4 space-y-3">
                <p className={`font-bold ${gradePairChoice(round, picked) ? "text-brand-ink" : "text-danger"}`}>
                  {gradePairChoice(round, picked) ? "Benar!" : `Belum tepat. Yang diperdengarkan: ${round.word}`}
                </p>
                {pairOf(round.pairSlug) && (
                  <p className="text-sm text-foreground leading-relaxed">
                    {pairOf(round.pairSlug)!.word_a} {pairOf(round.pairSlug)!.ipa_a} dan {pairOf(round.pairSlug)!.word_b} {pairOf(round.pairSlug)!.ipa_b}. {pairOf(round.pairSlug)!.note_id}
                  </p>
                )}
                <Button onClick={next}>{index + 1 < rounds.length ? "Berikutnya" : "Lihat hasil"}</Button>
              </div>
            )}
          </div>
        )}

        {phase === "done" && (
          <div className="space-y-4">
            <p className="font-serif text-[32px] leading-none font-medium text-foreground nums">
              {score} <span className="text-base font-sans font-normal text-muted-foreground">dari {rounds.length} benar</span>
            </p>
            <ProgressBar value={rounds.length ? (score / rounds.length) * 100 : 0} label="Skor latihan dengar" />
            {wrongPairs.length > 0 && (
              <p className="text-sm text-foreground">Pasangan yang perlu diulang: {wrongPairs.map((s) => { const p = pairOf(s); return p ? `${p.word_a}/${p.word_b}` : s; }).join(", ")}.</p>
            )}
            <Button variant="secondary" onClick={start}><RotateCcw className="w-4 h-4" aria-hidden="true" /> Latihan lagi</Button>
          </div>
        )}
      </Card>

      <section aria-labelledby="daftar-pasangan">
        <h2 id="daftar-pasangan" className="font-serif text-[22px] md:text-[26px] font-medium leading-[1.2] text-foreground mb-3">Semua pasangan</h2>
        <ul className="border-t border-rule">
          {pairs.map((p) => (
            <li key={p.slug} className="border-b border-rule py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {([[p.word_a, p.ipa_a], [p.word_b, p.ipa_b]] as const).map(([w, ipa]) => (
                  <div key={w} className="flex items-center gap-3 min-h-[44px]">
                    <div className="min-w-0 flex-1">
                      <p className="font-serif text-xl text-foreground">{w}</p>
                      <p className="text-sm text-muted-foreground">{ipa}</p>
                    </div>
                    <SpeakButtons text={w} label={w} />
                  </div>
                ))}
              </div>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{p.note_id}</p>
            </li>
          ))}
        </ul>
      </section>

      <ExerciseSession tag={MINIMAL_PAIR_TAG} count={6} title="Dikte: dengar lalu ketik kata" />

      <section aria-labelledby="ucapkan">
        <h2 id="ucapkan" className="font-serif text-[22px] md:text-[26px] font-medium leading-[1.2] text-foreground mb-1">Sekarang ucapkan</h2>
        <p className="text-sm text-muted-foreground mb-3">Ketik salah satu kata atau kalimat berisi pasangan di atas, lalu ucapkan dan lihat nilainya di Pronunciation Clinic.</p>
        <Card className="!p-0 overflow-hidden"><PronunciationLab /></Card>
      </section>
    </div>
  );
}
