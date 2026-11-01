"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import ForceGraph2D from "react-force-graph-2d";
import { useTheme } from "next-themes";

interface Node {
  id: string;
  group?: number;
  val?: number;
  x?: number;
  y?: number;
  __bckgDimensions?: [number, number];
}

interface Link {
  source: string | Node;
  target: string | Node;
  value?: number;
}

interface GraphData {
  nodes: Node[];
  links: Link[];
}

interface SemanticMapViewerProps {
  data: GraphData | null;
}

export default function SemanticMapViewer({ data }: SemanticMapViewerProps) {
  const fgRef = useRef<any>(null);
  const [dimensions, setDimensions] = useState({ width: 300, height: 300 });
  const containerRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();
  const [hoverNode, setHoverNode] = useState<Node | null>(null);

  // Compute highlighted nodes and links for hover effect
  const highlightedNodes = new Set();
  const highlightedLinks = new Set();
  if (hoverNode) {
    highlightedNodes.add(hoverNode.id);
    data?.links?.forEach(link => {
      const srcId = typeof link.source === 'object' ? (link.source as Node).id : link.source;
      const tgtId = typeof link.target === 'object' ? (link.target as Node).id : link.target;
      if (srcId === hoverNode.id || tgtId === hoverNode.id) {
        highlightedLinks.add(link);
        highlightedNodes.add(srcId);
        highlightedNodes.add(tgtId);
      }
    });
  }

  // Resize graph on window resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: 350
        });
      }
    };
    
    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  // Make graph fit to bounds
  useEffect(() => {
    if (fgRef.current && data?.nodes?.length) {
      setTimeout(() => {
        fgRef.current?.zoomToFit(400, 20);
      }, 500);
    }
  }, [data]);

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

  if (!data || !data.nodes || !data.nodes.length) {
    return <div className="p-4 text-center text-muted-foreground text-sm italic">Data semantic map kosong atau tidak valid.</div>;
  }

  return (
    <div ref={containerRef} className="w-full bg-card/50 backdrop-blur-md rounded-2xl overflow-hidden border border-brand/20 shadow-xl shadow-brand/5 relative">
      <ForceGraph2D
        ref={fgRef}
        width={dimensions.width}
        height={dimensions.height}
        graphData={data}
        backgroundColor={colors.bg}
        linkColor={(link: any) => {
          if (!hoverNode) return colors.link;
          return highlightedLinks.has(link) ? colors.activeLink : colors.dimmedLink;
        }}
        linkWidth={(link: any) => highlightedLinks.has(link) ? 2.5 : 1}
        linkDirectionalArrowLength={(link: any) => highlightedLinks.has(link) ? 6 : 4}
        linkDirectionalArrowRelPos={1}
        onNodeHover={(node: any) => setHoverNode(node || null)}
        nodeCanvasObject={(node: any, ctx, globalScale) => {
          const label = node.id || "?";
          const fontSize = 16 / globalScale;
          ctx.font = `bold ${fontSize}px Sans-Serif`;
          
          const isHovered = hoverNode === node;
          const isHighlighted = highlightedNodes.has(node.id);
          const isDimmed = hoverNode && !isHighlighted;
          
          const textWidth = ctx.measureText(label).width;
          const paddingX = fontSize * 0.8;
          const paddingY = fontSize * 0.5;
          const bckgDimensions = [textWidth + paddingX * 2, fontSize + paddingY * 2];
          
          const colorIndex = (node.group || 1) % colors.nodeColors.length;
          const baseColor = colors.nodeColors[colorIndex];
          
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
          const x = node.x - bckgDimensions[0] / 2;
          const y = node.y - bckgDimensions[1] / 2;
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
          ctx.fillText(label, node.x, node.y);
          
          ctx.globalAlpha = 1;
          node.__bckgDimensions = bckgDimensions;
        }}
        nodePointerAreaPaint={(node: any, color, ctx) => {
          ctx.fillStyle = color;
          const bckgDimensions = node.__bckgDimensions;
          if (bckgDimensions) {
            ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] / 2, bckgDimensions[0], bckgDimensions[1]);
          }
        }}
        d3VelocityDecay={0.1}
      />
    </div>
  );
}
