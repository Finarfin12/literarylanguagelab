"use client";

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false });

export default function GraphViewer({ data }: { data: string }) {
  const [graphData, setGraphData] = useState<any>(null);

  useEffect(() => {
    try {
      let jsonStr = data;
      // First try to extract from markdown code blocks
      const codeBlockMatch = data.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (codeBlockMatch) {
        jsonStr = codeBlockMatch[1];
      } else {
        // Fallback to finding the outermost curly braces
        const braceMatch = data.match(/\{[\s\S]*\}/);
        if (braceMatch) {
          jsonStr = braceMatch[0];
        }
      }
      
      const parsed = JSON.parse(jsonStr);
      const links = parsed.links || parsed.edges;
      if (parsed.nodes && links) {
        setGraphData({ nodes: parsed.nodes, links: links });
      } else {
        console.error("Missing nodes or links/edges in parsed JSON");
      }
    } catch (e) {
      console.error("Invalid JSON for graph", e);
    }
  }, [data]);

  if (!graphData) return <div className="p-4 bg-red-500/10 text-red-500 rounded-xl border border-red-500/20">Gagal merender Graf. Format JSON tidak valid atau AI gagal menghasilkan struktur nodes/edges.</div>;

  return (
    <div className="w-full h-[500px] border border-border rounded-2xl overflow-hidden bg-[#0A0A0A] relative shadow-inner">
      <div className="absolute top-4 left-4 z-10 text-xs text-muted-foreground font-mono">Semantic Graph Data</div>
      <ForceGraph2D
        graphData={graphData}
        nodeLabel="label"
        nodeAutoColorBy="type"
        linkDirectionalArrowLength={3.5}
        linkDirectionalArrowRelPos={1}
        nodeCanvasObject={(node: any, ctx: any, globalScale: any) => {
          const label = node.label;
          const fontSize = 12/globalScale;
          ctx.font = `${fontSize}px Sans-Serif`;
          const textWidth = ctx.measureText(label).width;
          const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2);

          ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
          ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] / 2, ...bckgDimensions);

          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = node.color || '#3ecf8e';
          ctx.fillText(label, node.x, node.y);

          node.__bckgDimensions = bckgDimensions;
        }}
        nodePointerAreaPaint={(node: any, color: any, ctx: any) => {
          ctx.fillStyle = color;
          const bckgDimensions = node.__bckgDimensions;
          bckgDimensions && ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] / 2, ...bckgDimensions);
        }}
      />
    </div>
  );
}
