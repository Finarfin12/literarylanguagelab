"use client";

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false });

export interface GraphNode {
  id: string;
  label: string;
  type?: string;
  x?: number;
  y?: number;
  color?: string;
  __bckgDimensions?: number[];
}

export interface GraphLink {
  source: string;
  target: string;
  label?: string;
}

export default function GraphViewer({ data }: { data: string }) {
  const [graphData, setGraphData] = useState<{ nodes: GraphNode[], links: GraphLink[] } | null>(null);

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
        nodeLabel={node => node.label || node.id}
        nodeAutoColorBy={node => node.type || node.group || node.id}
        linkColor={() => 'rgba(255, 255, 255, 0.5)'}
        linkWidth={2}
        linkDirectionalArrowLength={6}
        linkDirectionalArrowRelPos={1}
        nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
          const n = node as GraphNode;
          const label = n.label || n.id || "?";
          const fontSize = 16/globalScale;
          ctx.font = `bold ${fontSize}px Sans-Serif`;
          const textWidth = ctx.measureText(label).width;
          const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2); // some padding

          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] / 2, bckgDimensions[0], bckgDimensions[1]);

          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = n.color || '#10b981';
          ctx.fillText(label, node.x, node.y);

          n.__bckgDimensions = bckgDimensions;
        }}
        nodePointerAreaPaint={(node: any, color: string, ctx: CanvasRenderingContext2D) => {
          const n = node as GraphNode;
          ctx.fillStyle = color;
          const bckgDimensions = n.__bckgDimensions;
          if (bckgDimensions) {
            ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] / 2, bckgDimensions[0], bckgDimensions[1]);
          }
        }}
      />
    </div>
  );
}
