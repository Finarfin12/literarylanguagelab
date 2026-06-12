"use client";

import { useState, useEffect } from "react";
import { PenTool, Flame, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";

export default function WritingChallengeWidget() {
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState(0);
  const [hasCompletedThisWeek, setHasCompletedThisWeek] = useState(false);

  useEffect(() => {
    fetchChallengeData();
  }, []);

  const fetchChallengeData = async () => {
    try {
      const res = await fetch("/api/writing-challenge");
      const data = await res.json();
      if (!data.error) {
        setStreak(data.streak || 0);
        setHasCompletedThisWeek(!!data.submission);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-3xl p-6 shadow-sm flex items-center justify-center min-h-[150px]">
        <Loader2 className="w-6 h-6 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <Link 
      href="/english-lab/writing-challenge"
      className="group block bg-card border border-border rounded-3xl p-6 hover:bg-muted transition-all relative overflow-hidden flex flex-col justify-center min-h-[140px] hover:-translate-y-1 hover:shadow-orange-500/20 duration-300 active:scale-[0.98]"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <PenTool className="w-8 h-8 text-orange-500" />
          <h2 className="text-lg font-bold text-foreground group-hover:text-orange-500 transition-colors">
            Writing Challenge
          </h2>
        </div>
        <div className="flex items-center gap-1 bg-orange-500/10 px-3 py-1 rounded-full text-orange-500 text-sm font-bold border border-orange-500/20">
          <Flame className="w-4 h-4" /> {streak}
        </div>
      </div>
      
      {hasCompletedThisWeek ? (
        <p className="text-sm text-emerald-500 font-bold mb-2">Minggu ini selesai! ✨</p>
      ) : (
        <p className="text-sm text-muted-foreground mb-2">Selesaikan prompt mingguan.</p>
      )}
      
      <div className="mt-auto flex items-center gap-2 text-xs font-bold text-brand group-hover:underline">
        Tantangan Menulis <ArrowRight className="w-3 h-3" />
      </div>
    </Link>
  );
}
