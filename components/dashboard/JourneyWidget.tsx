"use client";

import { useState, useEffect } from "react";
import { Map, ChevronDown, CheckCircle2, Circle, ArrowRight, Trophy, Loader2, Sparkles, ClipboardCheck } from "lucide-react";
import Link from "next/link";

interface QuestData {
  id: string;
  title: string;
  description: string;
  icon: string;
  tool: string;
  toolPath: string;
  completed: boolean;
  completedAt: string | null;
}

interface JourneyData {
  cefrLevel: string;
  journeyLevel: number;
  title: string;
  subtitle: string;
  quests: QuestData[];
  completedCount: number;
  totalQuests: number;
  milestone: { badge: string; xpBonus: number };
  hasPlacementTest: boolean;
  allLevels: { level: number; cefr: string; title: string }[];
}

const LEVEL_GRADIENTS: Record<string, string> = {
  A1: "from-sky-500 to-blue-600",
  A2: "from-emerald-500 to-teal-600",
  B1: "from-amber-500 to-orange-600",
  B2: "from-purple-500 to-violet-600",
  C1: "from-rose-500 to-pink-600",
  C2: "from-yellow-400 to-amber-500",
};

export default function JourneyWidget() {
  const [data, setData] = useState<JourneyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLevelPicker, setShowLevelPicker] = useState(false);
  const [changingLevel, setChangingLevel] = useState(false);

  useEffect(() => {
    fetchJourney();
  }, []);

  const fetchJourney = async () => {
    try {
      const res = await fetch('/api/journey');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleChangeLevel = async (level: number) => {
    setChangingLevel(true);
    try {
      await fetch('/api/journey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'change_level', journeyLevel: level }),
      });
      await fetchJourney();
      setShowLevelPicker(false);
    } catch (e) {
      console.error(e);
    } finally {
      setChangingLevel(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-3xl p-6 shadow-sm flex items-center justify-center min-h-[200px]">
        <Loader2 className="w-6 h-6 animate-spin text-brand" />
      </div>
    );
  }

  // No placement test yet — show CTA
  if (!data || !data.hasPlacementTest) {
    return (
      <div className="bg-card border border-brand/20 rounded-3xl p-6 shadow-sm relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand/5 to-transparent" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-brand/10 rounded-2xl">
              <Map className="w-6 h-6 text-brand" />
            </div>
            <div>
              <h3 className="text-lg font-serif font-bold text-foreground">Reading Journey</h3>
              <p className="text-xs text-muted-foreground">Temukan level Anda & mulai petualangan</p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
            Ikuti <strong>Placement Test</strong> untuk menemukan level bahasa Inggris Anda, atau pilih level manual untuk langsung memulai Journey.
          </p>

          <div className="flex flex-col sm:flex-row gap-2">
            <Link
              href="/english-lab/placement-test"
              className="flex-1 py-3 bg-brand text-white font-bold rounded-2xl hover:shadow-[0_0_20px_rgba(62,207,142,0.4)] transition-all flex items-center justify-center gap-2 text-sm"
            >
              <ClipboardCheck className="w-4 h-4" /> Mulai Placement Test
            </Link>
            <button
              onClick={() => setShowLevelPicker(!showLevelPicker)}
              className="flex-1 py-3 bg-muted border border-border text-foreground font-bold rounded-2xl hover:bg-muted/80 transition-colors flex items-center justify-center gap-2 text-sm"
            >
              Pilih Level Manual <ChevronDown className={`w-4 h-4 transition-transform ${showLevelPicker ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {showLevelPicker && (
            <div className="mt-3 grid grid-cols-3 sm:grid-cols-6 gap-2">
              {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((cefr, i) => (
                <button
                  key={cefr}
                  onClick={() => handleChangeLevel(i + 1)}
                  disabled={changingLevel}
                  className={`py-2 rounded-xl text-sm font-bold text-white bg-gradient-to-br ${LEVEL_GRADIENTS[cefr]} hover:opacity-90 transition-opacity`}
                >
                  {changingLevel ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : cefr}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Has journey data — show progress
  const progress = Math.round((data.completedCount / data.totalQuests) * 100);
  const gradient = LEVEL_GRADIENTS[data.cefrLevel] || LEVEL_GRADIENTS.A1;
  const nextQuest = data.quests.find(q => !q.completed);
  const remaining = data.totalQuests - data.completedCount;

  return (
    <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-2xl bg-gradient-to-br ${gradient} shadow-lg`}>
            <Map className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-serif font-bold text-foreground">Reading Journey</h3>
            <p className="text-xs text-muted-foreground">
              Level {data.cefrLevel} — <span className="italic">{data.title}</span>
            </p>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full bg-gradient-to-br ${gradient} text-white text-xs font-bold`}>
          {data.cefrLevel}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-bold text-muted-foreground">{data.completedCount}/{data.totalQuests} Quest</span>
          <span className="text-xs font-bold text-brand">{progress}%</span>
        </div>
        <div className="h-2.5 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r ${gradient} rounded-full transition-all duration-700`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Quest List */}
      <div className="space-y-2 mb-4 max-h-[280px] overflow-y-auto custom-scrollbar pr-1">
        {data.quests.map(quest => (
          <div
            key={quest.id}
            className={`flex items-center gap-3 p-3 rounded-2xl transition-colors ${
              quest.completed
                ? 'bg-brand/5 border border-brand/10'
                : quest.id === nextQuest?.id
                  ? 'bg-muted/80 border border-brand/20'
                  : 'bg-muted/40 border border-transparent'
            }`}
          >
            <span className="text-lg shrink-0">{quest.icon}</span>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-bold ${quest.completed ? 'text-brand line-through' : 'text-foreground'}`}>
                {quest.title}
              </p>
              <p className="text-[10px] text-muted-foreground truncate">{quest.description}</p>
            </div>
            {quest.completed ? (
              <CheckCircle2 className="w-5 h-5 text-brand shrink-0" />
            ) : quest.id === nextQuest?.id ? (
              <Link href={quest.toolPath} className="px-3 py-1.5 bg-brand text-white text-xs font-bold rounded-xl hover:shadow-md transition-all shrink-0 flex items-center gap-1">
                Mulai <ArrowRight className="w-3 h-3" />
              </Link>
            ) : (
              <Circle className="w-5 h-5 text-muted-foreground/30 shrink-0" />
            )}
          </div>
        ))}
      </div>

      {/* Milestone & Actions */}
      {remaining > 0 ? (
        <div className="bg-muted/50 rounded-2xl p-3 flex items-center gap-3 mb-3">
          <Trophy className="w-5 h-5 text-amber-400 shrink-0" />
          <div className="flex-1">
            <p className="text-xs font-bold text-foreground">{data.milestone.badge}</p>
            <p className="text-[10px] text-muted-foreground">{remaining} quest lagi — +{data.milestone.xpBonus} XP bonus!</p>
          </div>
        </div>
      ) : (
        <div className="bg-brand/10 border border-brand/20 rounded-2xl p-3 flex items-center gap-3 mb-3">
          <Sparkles className="w-5 h-5 text-brand shrink-0" />
          <div className="flex-1">
            <p className="text-xs font-bold text-brand">🎉 Level Selesai!</p>
            <p className="text-[10px] text-muted-foreground">Anda mendapat {data.milestone.badge} + {data.milestone.xpBonus} XP!</p>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => setShowLevelPicker(!showLevelPicker)}
          className="flex-1 py-2.5 bg-muted border border-border text-foreground text-xs font-bold rounded-xl hover:bg-muted/80 transition-colors flex items-center justify-center gap-1"
        >
          Ganti Level <ChevronDown className={`w-3 h-3 transition-transform ${showLevelPicker ? 'rotate-180' : ''}`} />
        </button>
        <Link
          href="/english-lab/placement-test"
          className="flex-1 py-2.5 bg-muted border border-border text-foreground text-xs font-bold rounded-xl hover:bg-muted/80 transition-colors text-center"
        >
          Ulang Tes
        </Link>
      </div>

      {showLevelPicker && (
        <div className="mt-3 grid grid-cols-3 sm:grid-cols-6 gap-2">
          {data.allLevels.map(l => (
            <button
              key={l.level}
              onClick={() => handleChangeLevel(l.level)}
              disabled={changingLevel || l.level === data.journeyLevel}
              className={`py-2 rounded-xl text-xs font-bold transition-all ${
                l.level === data.journeyLevel
                  ? 'bg-gradient-to-br ' + (LEVEL_GRADIENTS[l.cefr] || '') + ' text-white ring-2 ring-offset-2 ring-brand'
                  : 'bg-muted border border-border text-foreground hover:border-brand/50'
              }`}
            >
              {changingLevel ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : l.cefr}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
