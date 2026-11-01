"use client";

import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface VocabChartProps {
  data: { date: string; count: number }[];
}

export default function VocabChart({ data }: VocabChartProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="flex items-center justify-center h-full w-full min-h-[200px]" />;
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full w-full text-muted-foreground">
        Belum ada data kosa kata 7 hari terakhir.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
      <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis 
          dataKey="date" 
          stroke="currentColor" 
          className="text-muted-foreground text-xs" 
          tickLine={false} 
          axisLine={false}
        />
        <YAxis 
          stroke="currentColor" 
          className="text-muted-foreground text-xs" 
          tickLine={false} 
          axisLine={false}
          allowDecimals={false}
        />
        <Tooltip 
          contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--foreground)' }}
          itemStyle={{ color: 'var(--brand-ink)' }}
        />
        <Line 
          type="monotone" 
          dataKey="count" 
          stroke="var(--brand)" 
          strokeWidth={3} 
          dot={{ r: 4, fill: 'var(--brand)', strokeWidth: 2, stroke: 'var(--card)' }} 
          activeDot={{ r: 6, fill: 'var(--brand)', stroke: 'var(--card)', strokeWidth: 2 }} 
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
