"use client";

import { useState, useEffect } from "react";
import { History, Activity, TrendingUp, BookOpen, Clock } from "lucide-react";

export default function HistoryPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Dummy fetch (since we just created the table and it's empty, we'll mock some data for the Insight view)
  useEffect(() => {
    setTimeout(() => {
      setLogs([
        { id: 1, action: "Tool Used: Semantic Visual Generator", time: "10 minutes ago" },
        { id: 2, action: "Tool Used: Alter Ego Chat (Shakespeare)", time: "1 hour ago" },
        { id: 3, action: "Saved Idiom: 'Bite the bullet'", time: "3 hours ago" },
        { id: 4, action: "Completed Paraphrase Challenge (Score: 8/10)", time: "Yesterday" },
        { id: 5, action: "Read Text: 'Ode to a Nightingale'", time: "2 days ago" },
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  return (
    <div className="p-8 max-w-6xl mx-auto min-h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-serif font-bold text-foreground flex items-center gap-3">
            <History className="w-8 h-8 text-brand" />
            Archive & Insights
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">Riwayat aktivitas dan ringkasan pembelajaran mingguan Anda.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Weekly Insights Cards */}
        <div className="bg-card/40 backdrop-blur-md border border-brand/20 rounded-3xl p-6 shadow-xl flex items-center gap-4">
          <div className="w-12 h-12 bg-brand/10 text-brand rounded-2xl flex items-center justify-center shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Words Mastered</p>
            <p className="text-3xl font-serif font-bold text-foreground">124</p>
          </div>
        </div>

        <div className="bg-card/40 backdrop-blur-md border border-blue-500/20 rounded-3xl p-6 shadow-xl flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-500/10 text-blue-400 rounded-2xl flex items-center justify-center shrink-0">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Analyses Run</p>
            <p className="text-3xl font-serif font-bold text-foreground">58</p>
          </div>
        </div>

        <div className="bg-card/40 backdrop-blur-md border border-purple-500/20 rounded-3xl p-6 shadow-xl flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-500/10 text-purple-400 rounded-2xl flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Current Streak</p>
            <p className="text-3xl font-serif font-bold text-foreground">4 Days</p>
          </div>
        </div>
      </div>

      {/* Archive / Activity Log */}
      <div className="bg-card/40 backdrop-blur-md border border-white/10 rounded-3xl p-8 shadow-xl">
        <h2 className="text-xl font-serif font-bold text-brand mb-6 border-b border-white/10 pb-4 flex items-center gap-2">
          <Clock className="w-5 h-5" /> Activity Archive
        </h2>
        
        <div className="space-y-4">
          {loading ? (
            <div className="animate-pulse space-y-4">
              {[1,2,3].map(i => <div key={i} className="h-16 bg-white/5 rounded-xl"></div>)}
            </div>
          ) : (
            logs.map(log => (
              <div key={log.id} className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 transition-colors rounded-xl border border-white/5">
                <div className="flex items-center gap-4">
                  <div className="w-2 h-2 rounded-full bg-brand"></div>
                  <span className="text-foreground font-medium">{log.action}</span>
                </div>
                <span className="text-sm text-muted-foreground">{log.time}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
