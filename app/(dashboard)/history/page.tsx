"use client";

import { useState, useEffect } from "react";
import { History, Activity, TrendingUp, BookOpen, Clock, Frown } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import Swal from "sweetalert2";

export default function HistoryPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [wordsMastered, setWordsMastered] = useState(0);
  const [weakWords, setWeakWords] = useState(0);
  const [analysesRun, setAnalysesRun] = useState(0);
  const [timeSpentSeconds, setTimeSpentSeconds] = useState(0);
  const [vocabData, setVocabData] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Fetch logs
      const { data: activityData } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      
      setLogs(activityData || []);
      
      // Count total lifetime activities
      const { count: totalAnalyses } = await supabase
        .from('activity_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
        
      setAnalysesRun(totalAnalyses || 0);

      // Fetch vocab count and data for Export
      const { data: vocabDataRes } = await supabase
        .from('vocabulary')
        .select('*')
        .eq('user_id', user.id);
      
      const vData = vocabDataRes || [];
      setVocabData(vData);
      setWordsMastered(vData.filter((v: any) => v.mastery_level >= 3).length);
      setWeakWords(vData.filter((v: any) => v.mastery_level === 0 && v.repetition_count > 2).length);

      // Fetch Time Spent
      const { data: sessionsData } = await supabase
        .from('reading_sessions')
        .select('time_spent_seconds')
        .eq('user_id', user.id);
        
      const totalSeconds = sessionsData?.reduce((acc: number, cur: any) => acc + (cur.time_spent_seconds || 0), 0) || 0;
      setTimeSpentSeconds(totalSeconds);

      setLoading(false);
    }

    fetchData();
  }, []);

  function formatTime(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return `Yesterday`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  }

  function formatDuration(seconds: number) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  }

  const handleExportCSV = () => {
    if (vocabData.length === 0) {
      Swal.fire("Pemberitahuan", "Tidak ada data kosakata untuk diekspor.", "info");
      return;
    }

    const headers = ["Word", "Definition", "Context", "Mastery Level", "Next Review"];
    const csvContent = [
      headers.join(","),
      ...vocabData.map(v => 
        [
          `"${v.word || ''}"`,
          `"${v.definition?.replace(/"/g, '""') || ''}"`,
          `"${v.context_sentence?.replace(/"/g, '""') || ''}"`,
          v.mastery_level || 0,
          v.next_review_at ? new Date(v.next_review_at).toLocaleDateString() : ''
        ].join(",")
      )
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "literary_lab_vocabulary.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto min-h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="text-[28px] md:text-4xl leading-[1.15] font-serif font-medium text-foreground flex items-center gap-3">
            <History className="w-8 h-8 text-brand-ink" />
            Archive & Insights
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">Riwayat aktivitas dan ringkasan pembelajaran mingguan Anda.</p>
        </div>
        
        <button 
          onClick={handleExportCSV}
          className="flex items-center gap-2 bg-foreground/5 hover:bg-brand-tint text-foreground hover:text-brand-ink px-6 py-3 rounded-control font-bold transition-all border border-foreground/10"
        >
          <TrendingUp className="w-4 h-4" /> Export CSV / Anki
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Weekly Insights Cards */}
        <div className="bg-card border border-brand/20 rounded-card p-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-brand-tint text-brand-ink rounded-card flex items-center justify-center shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Words Mastered</p>
            <p className="text-3xl font-serif font-medium text-foreground">{wordsMastered}</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-card p-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-muted text-brand-ink rounded-card flex items-center justify-center shrink-0">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Analyses Run</p>
            <p className="text-3xl font-serif font-medium text-foreground">{analysesRun}</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-card p-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-muted text-foreground rounded-card flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Time Spent</p>
            <p className="text-3xl font-serif font-medium text-foreground">{formatDuration(timeSpentSeconds)}</p>
          </div>
        </div>

        <div className="bg-card border border-danger/30 rounded-card p-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-danger-tint text-danger rounded-card flex items-center justify-center shrink-0">
            <Frown className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Weak Areas</p>
            <p className="text-3xl font-serif font-medium text-foreground">{weakWords} Kata</p>
          </div>
        </div>
      </div>

      {/* Archive / Activity Log */}
      <div className="bg-card border border-border rounded-card p-4 md:p-8 ">
        <h2 className="text-xl font-serif font-medium text-brand-ink mb-6 border-b border-border pb-4 flex items-center gap-2">
          <Clock className="w-5 h-5" /> Activity Archive
        </h2>
        
        <div className="space-y-4">
          {loading ? (
            <div className="animate-pulse space-y-4">
              {[1,2,3].map(i => <div key={i} className="h-16 bg-muted rounded-control"></div>)}
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-10 flex flex-col items-center">
              <Frown className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-xl font-serif font-medium text-muted-foreground">Belum ada aktivitas</p>
              <p className="text-sm text-muted-foreground mt-2">Gunakan alat-alat di LingoWise untuk mengisi log ini.</p>
            </div>
          ) : (
            logs.map(log => (
              <div key={log.id} className="flex items-center justify-between p-4 bg-muted hover:bg-muted transition-colors rounded-control border border-border">
                <div className="flex items-center gap-4">
                  <div className="w-2 h-2 rounded-full bg-brand"></div>
                  <span className="text-foreground font-medium">{log.action_type}</span>
                </div>
                <span className="text-sm text-muted-foreground">{formatTime(log.created_at)}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
