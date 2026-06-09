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
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
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
          contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
          itemStyle={{ color: '#3ECF8E' }}
        />
        <Line 
          type="monotone" 
          dataKey="count" 
          stroke="#3ECF8E" 
          strokeWidth={3} 
          dot={{ r: 4, fill: '#3ECF8E', strokeWidth: 2, stroke: '#1A1A1A' }} 
          activeDot={{ r: 6, fill: '#3ECF8E', stroke: '#fff', strokeWidth: 2 }} 
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
