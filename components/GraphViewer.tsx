"use client";

import React, { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useTheme } from "next-themes";

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false });

export interface GraphNode {
  id: string;
  label: string;
  type?: string;
  x?: number;
  y?: number;
  color?: string;
  __bckgDimensions?: [number, number];
}

export interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
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

  const { resolvedTheme } = useTheme();
  const [hoverNode, setHoverNode] = useState<GraphNode | null>(null);

  // Compute highlighted nodes and links for hover effect
  const highlightedNodes = new Set();
  const highlightedLinks = new Set();
  if (hoverNode) {
    highlightedNodes.add(hoverNode.id);
    graphData?.links?.forEach(link => {
      const srcId = typeof link.source === 'object' ? (link.source as GraphNode).id : link.source;
      const tgtId = typeof link.target === 'object' ? (link.target as GraphNode).id : link.target;
      if (srcId === hoverNode.id || tgtId === hoverNode.id) {
        highlightedLinks.add(link);
        highlightedNodes.add(srcId);
        highlightedNodes.add(tgtId);
      }
    });
  }

  const getThemeColors = useCallback(() => {
    const isDark = resolvedTheme === "dark";
    return {
      bg: "transparent",
      text: isDark ? "#ffffff" : "#000000",
      link: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)",
      activeLink: isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)",
      dimmedLink: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)",
      nodeBg: isDark ? "rgba(15, 23, 42, 0.85)" : "rgba(255, 255, 255, 0.95)",
      hoverNodeBg: isDark ? "rgba(30, 41, 59, 0.95)" : "rgba(255, 255, 255, 1)",
      dimmedNodeOpacity: 0.3,
      nodeColors: [
        "#10b981", // Emerald (Brand)
        "#8b5cf6", // Violet
        "#3b82f6", // Blue
        "#f59e0b", // Amber
        "#ef4444"  // Red
      ]
    };
  }, [resolvedTheme]);

  const colors = getThemeColors();

  if (!graphData) return <div className="p-4 bg-red-500/10 text-red-500 rounded-xl border border-red-500/20">Gagal merender Graf. Format JSON tidak valid atau AI gagal menghasilkan struktur nodes/edges.</div>;

  return (
    <div className="w-full h-[500px] border border-brand/20 rounded-2xl overflow-hidden bg-card/50 backdrop-blur-md relative shadow-xl shadow-brand/5">
      <div className="absolute top-4 left-4 z-10 text-xs text-brand font-mono font-bold tracking-wider uppercase">Semantic Graph</div>
      <ForceGraph2D
        graphData={graphData}
        backgroundColor={colors.bg}
        linkColor={(link: any) => {
          if (!hoverNode) return colors.link;
          return highlightedLinks.has(link) ? colors.activeLink : colors.dimmedLink;
        }}
        linkWidth={(link: any) => highlightedLinks.has(link) ? 2.5 : 1}
        linkDirectionalArrowLength={(link: any) => highlightedLinks.has(link) ? 6 : 4}
        linkDirectionalArrowRelPos={1}
        onNodeHover={(node: any) => setHoverNode(node || null)}
        nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
          const n = node as GraphNode;
          const label = n.label || n.id || "?";
          const fontSize = 16 / globalScale;
          ctx.font = `bold ${fontSize}px Sans-Serif`;
          
          const isHovered = hoverNode === node;
          const isHighlighted = highlightedNodes.has(n.id);
          const isDimmed = hoverNode && !isHighlighted;
          
          const textWidth = ctx.measureText(label).width;
          const paddingX = fontSize * 0.8;
          const paddingY = fontSize * 0.5;
          const bckgDimensions: [number, number] = [textWidth + paddingX * 2, fontSize + paddingY * 2];
          
          // Generate a deterministic color index based on ID if no type/group is provided
          const hashCode = label.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
          const colorIndex = hashCode % colors.nodeColors.length;
          const baseColor = n.color || colors.nodeColors[colorIndex];
          
          ctx.globalAlpha = isDimmed ? colors.dimmedNodeOpacity : 1;

          // Shadow
          ctx.shadowColor = isHovered || isHighlighted ? baseColor : 'rgba(0,0,0,0.15)';
          ctx.shadowBlur = isHovered ? 15 : (isHighlighted ? 10 : 5);
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 2 / globalScale;

          ctx.fillStyle = isHovered ? colors.hoverNodeBg : colors.nodeBg;
          
          // Draw Rounded Rectangle (Pill shape)
          ctx.beginPath();
          const r = bckgDimensions[1] / 2;
          const x = n.x! - bckgDimensions[0] / 2;
          const y = n.y! - bckgDimensions[1] / 2;
          const w = bckgDimensions[0];
          const h = bckgDimensions[1];
          ctx.moveTo(x + r, y);
          ctx.lineTo(x + w - r, y);
          ctx.quadraticCurveTo(x + w, y, x + w, y + r);
          ctx.lineTo(x + w, y + h - r);
          ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
          ctx.lineTo(x + r, y + h);
          ctx.quadraticCurveTo(x, y + h, x, y + h - r);
          ctx.lineTo(x, y + r);
          ctx.quadraticCurveTo(x, y, x + r, y);
          ctx.closePath();
          ctx.fill();

          // Outline
          ctx.lineWidth = (isHovered ? 2.5 : 1.5) / globalScale;
          ctx.strokeStyle = baseColor;
          ctx.stroke();

          // Reset shadow for text
          ctx.shadowBlur = 0;
          ctx.shadowColor = 'transparent';

          // Draw text
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = baseColor;
          ctx.fillText(label, n.x!, n.y!);
          
          ctx.globalAlpha = 1;
          n.__bckgDimensions = bckgDimensions;
        }}
        nodePointerAreaPaint={(node: any, color: string, ctx: CanvasRenderingContext2D) => {
          const n = node as GraphNode;
          ctx.fillStyle = color;
          const bckgDimensions = n.__bckgDimensions;
          if (bckgDimensions) {
            ctx.fillRect(n.x! - bckgDimensions[0] / 2, n.y! - bckgDimensions[1] / 2, bckgDimensions[0], bckgDimensions[1]);
          }
        }}
        d3VelocityDecay={0.1}
      />
    </div>
  );
}
