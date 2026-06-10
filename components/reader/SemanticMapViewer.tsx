"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import ForceGraph2D from "react-force-graph-2d";
import { useTheme } from "next-themes";

interface Node {
  id: string;
  group?: number;
  val?: number;
}

interface Link {
  source: string;
  target: string;
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
      link: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)",
      nodeColors: [
        isDark ? "#3ecf8e" : "#10b981", // brand primary
        isDark ? "#a855f7" : "#8b5cf6", // purple
        isDark ? "#3b82f6" : "#2563eb", // blue
        isDark ? "#f59e0b" : "#d97706", // orange
        isDark ? "#ef4444" : "#dc2626"  // red
      ]
    };
  }, [resolvedTheme]);

  const colors = getThemeColors();

  if (!data || !data.nodes || !data.nodes.length) {
    return <div className="p-4 text-center text-muted-foreground text-sm italic">Data semantic map kosong atau tidak valid.</div>;
  }

  return (
    <div ref={containerRef} className="w-full bg-foreground/5 rounded-2xl overflow-hidden border border-border">
      <ForceGraph2D
        ref={fgRef}
        width={dimensions.width}
        height={dimensions.height}
        graphData={data}
        backgroundColor={colors.bg}
        linkColor={() => colors.link}
        linkWidth={2}
        linkDirectionalArrowLength={5}
        linkDirectionalArrowRelPos={1}
        nodeColor={(node: any) => colors.nodeColors[(node.group || 1) % colors.nodeColors.length]}
        nodeCanvasObject={(node: any, ctx, globalScale) => {
          const label = node.id || "?";
          const fontSize = 16 / globalScale;
          ctx.font = `bold ${fontSize}px Sans-Serif`;
          
          // Draw text background
          const textWidth = ctx.measureText(label).width;
          const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2);
          
          ctx.fillStyle = resolvedTheme === "dark" ? 'rgba(0,0,0,0.9)' : 'rgba(255,255,255,0.9)';
          ctx.fillRect(
            node.x - bckgDimensions[0] / 2, 
            node.y - bckgDimensions[1] / 2, 
            bckgDimensions[0], 
            bckgDimensions[1]
          );

          // Draw text
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = colors.nodeColors[(node.group || 1) % colors.nodeColors.length];
          ctx.fillText(label, node.x, node.y);
          
          node.__bckgDimensions = bckgDimensions; // to re-use in nodePointerAreaPaint
        }}
        nodePointerAreaPaint={(node: any, color, ctx) => {
          ctx.fillStyle = color;
          const bckgDimensions = node.__bckgDimensions;
          bckgDimensions && ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] / 2, bckgDimensions[0], bckgDimensions[1]);
        }}
        d3VelocityDecay={0.1}
      />
    </div>
  );
}
