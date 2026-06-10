"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Trophy, Send, Loader2, Star, Users, Clock, CheckCircle } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import Swal from "sweetalert2";

interface Challenge {
  id: string;
  title: string;
  original_text: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
}
interface Submission {
  id: string;
  user_id: string;
  translation: string;
  ai_score: number | null;
  ai_feedback: string | null;
  user_votes: number;
  profiles?: { username: string };
}

export default function ChallengePage() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [active, setActive] = useState<Challenge | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [myTrans, setMyTrans] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [mySubmission, setMySubmission] = useState<Submission | null>(null);
  const supabase = createClient();

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: chs } = await supabase.from("challenges").select("*").order("start_date", { ascending: false });
    setChallenges(chs || []);
    const act = chs?.find(c => c.is_active);
    setActive(act || null);
    if (act && user) {
      const { data: subs } = await supabase.from("challenge_submissions").select("*, profiles(username)").eq("challenge_id", act.id).order("ai_score", { ascending: false });
      setSubmissions(subs || []);
      const mine = subs?.find(s => s.user_id === user.id) || null;
      setMySubmission(mine);
    }
    setLoading(false);
  }

  async function handleSubmit() {
    if (!myTrans.trim() || !active) return;
    setSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("challenge_submissions").insert({
      challenge_id: active.id, user_id: user?.id, translation: myTrans,
    });
    if (error) {
      Swal.fire({ title: "Gagal", text: error.message, icon: "error" });
    } else {
      Swal.fire({ title: "Terkirim!", text: "Terjemahan berhasil disubmit ke challenge.", icon: "success" });
      setMyTrans("");
      loadData();
    }
    setSubmitting(false);
  }

  async function handleVote(subId: string) {
    const { error } = await supabase.rpc("increment_votes", { row_id: subId });
    if (!error) loadData();
  }

  if (loading) return <div className="flex-1 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-brand" /></div>;

  const ended = challenges.filter(c => !c.is_active);

  return (
    <div className="p-4 md:p-8 min-h-full animate-in fade-in duration-300">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/tools" className="flex items-center gap-2 text-muted-foreground hover:text-foreground"><ArrowLeft className="w-4 h-4" /> Kembali</Link>
        <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground flex items-center gap-3"><Trophy className="w-7 h-7 text-yellow-400" />Weekly Challenge</h1>
      </div>

      {active ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card border border-border rounded-2xl p-4 md:p-6">
            <div className="flex items-center gap-2 mb-4"><Clock className="w-4 h-4 text-brand" /><span className="text-xs text-muted-foreground">Ends: {new Date(active.end_date).toLocaleDateString("id-ID")}</span></div>
            <h2 className="text-xl font-serif font-bold text-foreground mb-4">{active.title}</h2>
            <blockquote className="border-l-2 border-brand/30 pl-4 mb-6 text-sm font-serif italic text-foreground/80">{active.original_text}</blockquote>
            {mySubmission ? (
              <div className="bg-brand/10 border border-brand/20 rounded-xl p-4">
                <p className="text-xs font-bold text-brand uppercase mb-2 flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5" /> Your Submission</p>
                <p className="text-sm text-foreground italic mb-2">"{mySubmission.translation}"</p>
                {mySubmission.ai_score && <p className="text-xs text-muted-foreground">AI Score: <span className="text-brand font-bold">{mySubmission.ai_score}/100</span></p>}
              </div>
            ) : (
              <div className="space-y-3">
                <textarea value={myTrans} onChange={(e) => setMyTrans(e.target.value)} rows={3} placeholder="Your Indonesian translation..." className="w-full bg-background border border-border rounded-xl p-3 text-sm focus:ring-1 focus:ring-brand outline-none resize-none" />
                <button onClick={handleSubmit} disabled={submitting || !myTrans.trim()} className="w-full py-2.5 bg-brand text-background font-bold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Submit Translation
                </button>
              </div>
            )}
          </div>
          <div className="bg-card border border-border rounded-2xl p-4 md:p-6">
            <h3 className="font-bold text-foreground mb-4 flex items-center gap-2"><Users className="w-5 h-5 text-purple-400" />Submissions ({submissions.length})</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {submissions.map((s) => (
                <div key={s.id} className="bg-muted rounded-xl p-3">
                  <p className="text-sm text-foreground italic mb-2">"{s.translation}"</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>@{s.profiles?.username || "anonymous"}</span>
                    <div className="flex items-center gap-3">
                      {s.ai_score && <span className="text-brand font-bold">{s.ai_score}/100</span>}
                      <button onClick={() => handleVote(s.id)} className="flex items-center gap-1 hover:text-yellow-400 transition-colors">
                        <Star className="w-3.5 h-3.5" /> {s.user_votes || 0}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {submissions.length === 0 && <p className="text-center text-muted-foreground text-sm py-6">Belum ada submission.</p>}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Tidak ada challenge aktif saat ini.</p>
        </div>
      )}

      {ended.length > 0 && (
        <div className="mt-10">
          <h2 className="text-xl font-serif font-bold text-foreground mb-4">Challenge Sebelumnya</h2>
          <div className="space-y-3">
            {ended.slice(0, 5).map((c) => (
              <div key={c.id} className="bg-card border border-border rounded-xl p-4 opacity-60">
                <h3 className="font-bold text-foreground">{c.title}</h3>
                <p className="text-xs text-muted-foreground">{new Date(c.start_date).toLocaleDateString("id-ID")} – {new Date(c.end_date).toLocaleDateString("id-ID")}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
