import React, { useState } from 'react';
import { SynthesizedDiagram, DiagramNode } from '../types/video';

interface InteractiveDiagramProps {
  diagram: SynthesizedDiagram;
}

export const InteractiveDiagram: React.FC<InteractiveDiagramProps> = ({ diagram }) => {
  const [selectedNode, setSelectedNode] = useState<DiagramNode | null>(diagram.nodes[0] || null);
  const [zoom, setZoom] = useState<number>(1);

  const nodeCount = diagram.nodes.length;
  const svgWidth = Math.max(760, nodeCount * 170);
  const svgHeight = 240;

  const nodeCoords = diagram.nodes.map((node, i) => {
    const spacing = (svgWidth - 140) / Math.max(1, nodeCount - 1);
    const x = 70 + i * spacing;
    const y = i % 2 === 0 ? 115 : 125;
    return { ...node, x, y };
  });

  const getRoleStyle = (role: DiagramNode['role']) => {
    switch (role) {
      case 'input':
        return { bg: 'fill-white', stroke: 'stroke-[#111111]', text: 'text-[#111111]', badge: 'bg-[#F4F4F2] text-[#111111] border-[#E8E8E6]' };
      case 'process':
        return { bg: 'fill-white', stroke: 'stroke-[#575754]', text: 'text-[#111111]', badge: 'bg-[#F4F4F2] text-[#575754] border-[#E8E8E6]' };
      case 'decision':
        return { bg: 'fill-[#FAF8F5]', stroke: 'stroke-[#B45309]', text: 'text-[#92400E]', badge: 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]' };
      case 'database':
        return { bg: 'fill-white', stroke: 'stroke-[#6366F1]', text: 'text-[#4338CA]', badge: 'bg-[#EEF2FF] text-[#4338CA] border-[#E0E7FF]' };
      case 'output':
        return { bg: 'fill-[#F0FDF4]', stroke: 'stroke-[#15803D]', text: 'text-[#166534]', badge: 'bg-[#DCFCE7] text-[#166534] border-[#BBF7D0]' };
      default:
        return { bg: 'fill-white', stroke: 'stroke-[#E8E8E6]', text: 'text-[#111111]', badge: 'bg-[#F4F4F2] text-[#575754] border-[#E8E8E6]' };
    }
  };

  return (
    <div className="rounded-3xl border border-[#E8E8E6] bg-white p-6 sm:p-8 shadow-[0_2px_8px_rgba(0,0,0,0.02)] print-break-inside-avoid">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E8E8E6]">
        <div>
          <div className="inline-block px-3 py-1 rounded-full bg-[#F4F4F2] text-[11px] font-mono font-medium text-[#575754] uppercase tracking-wider mb-2">
            Auto-Generated Flowchart • {diagram.type}
          </div>
          <h4 className="text-xl font-semibold text-[#111111] tracking-tight">{diagram.title}</h4>
          <p className="text-[13px] text-[#575754] mt-0.5">{diagram.caption}</p>
        </div>

        {/* Zoom controls */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto no-print">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(0.7, z - 0.15))}
            className="p-1.5 rounded-full bg-[#F4F4F2] hover:bg-[#E8E8E6] text-[#575754] transition"
            title="Zoom out"
          >
            <span className="material-symbols-outlined text-[16px]">remove</span>
          </button>
          <span className="text-[11px] font-mono text-[#8C8C89] px-1">{Math.round(zoom * 100)}%</span>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(1.5, z + 0.15))}
            className="p-1.5 rounded-full bg-[#F4F4F2] hover:bg-[#E8E8E6] text-[#575754] transition"
            title="Zoom in"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
          </button>
          <button
            type="button"
            onClick={() => setZoom(1)}
            className="p-1.5 rounded-full bg-[#F4F4F2] hover:bg-[#E8E8E6] text-[#8C8C89] hover:text-[#111111] transition ml-1"
            title="Reset zoom"
          >
            <span className="material-symbols-outlined text-[16px]">refresh</span>
          </button>
        </div>
      </div>

      {/* SVG Canvas Container */}
      <div className="relative mt-5 overflow-x-auto rounded-2xl bg-[#F9F9F8] border border-[#E8E8E6] p-5 scrollbar-thin">
        <div
          style={{ transform: `scale(${zoom})`, transformOrigin: 'top left', minWidth: `${svgWidth}px` }}
          className="transition-transform duration-200"
        >
          <svg width={svgWidth} height={svgHeight} className="overflow-visible">
            <defs>
              <marker
                id={`arrow-${diagram.id}`}
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 9 5 L 0 9 z" fill="#111111" />
              </marker>
            </defs>

            {/* Connecting Edges */}
            {diagram.edges.map((edge, idx) => {
              const fromNode = nodeCoords.find((n) => n.id === edge.from);
              const toNode = nodeCoords.find((n) => n.id === edge.to);
              if (!fromNode || !toNode) return null;

              const startX = fromNode.x + 65;
              const startY = fromNode.y;
              const endX = toNode.x - 65;
              const endY = toNode.y;
              const midX = (startX + endX) / 2;

              return (
                <g key={`edge-${idx}`}>
                  <path
                    d={`M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`}
                    fill="none"
                    stroke="#111111"
                    strokeWidth="1.5"
                    strokeDasharray={edge.style === 'dashed' ? '4,4' : undefined}
                    markerEnd={`url(#arrow-${diagram.id})`}
                    className="opacity-70 transition-opacity hover:opacity-100"
                  />
                  {edge.label && (
                    <text
                      x={midX}
                      y={(startY + endY) / 2 - 8}
                      textAnchor="middle"
                      className="fill-[#575754] text-[10px] font-mono font-medium"
                    >
                      {edge.label}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Nodes */}
            {nodeCoords.map((node) => {
              const isSelected = selectedNode?.id === node.id;
              const styles = getRoleStyle(node.role);

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  onClick={() => setSelectedNode(node)}
                  className="cursor-pointer group"
                >
                  {/* Outer box */}
                  <rect
                    x="-65"
                    y="-40"
                    width="130"
                    height="80"
                    rx="14"
                    className={`${styles.bg} ${styles.stroke} stroke-[1.5] transition-all duration-200 group-hover:shadow-md ${
                      isSelected ? 'stroke-[#111111] stroke-2 filter drop-shadow-md' : 'filter drop-shadow-[0_1px_3px_rgba(0,0,0,0.04)]'
                    }`}
                  />

                  {/* Role badge */}
                  <rect
                    x="-55"
                    y="-30"
                    width="55"
                    height="16"
                    rx="4"
                    fill="#F4F4F2"
                  />
                  <text
                    x="-27.5"
                    y="-19"
                    textAnchor="middle"
                    className="fill-[#575754] text-[9px] font-bold uppercase tracking-wider"
                  >
                    {node.role}
                  </text>

                  {/* Node label */}
                  <text
                    x="0"
                    y="6"
                    textAnchor="middle"
                    className="fill-[#111111] font-semibold text-xs select-none pointer-events-none tracking-tight"
                  >
                    {node.label.length > 17 ? node.label.slice(0, 16) + '…' : node.label}
                  </text>

                  {/* Subtitle / detail */}
                  <text
                    x="0"
                    y="22"
                    textAnchor="middle"
                    className="fill-[#8C8C89] text-[10px] select-none pointer-events-none"
                  >
                    {node.detail ? (node.detail.length > 20 ? node.detail.slice(0, 18) + '…' : node.detail) : 'Inspect'}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Selected Node Details Drawer */}
      {selectedNode && (
        <div className="mt-5 p-4 rounded-2xl bg-[#F9F9F8] border border-[#E8E8E6] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-sm">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-[#111111] text-[20px] mt-0.5">info</span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[#111111]">{selectedNode.label}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border uppercase font-mono font-semibold ${getRoleStyle(selectedNode.role).badge}`}>
                  {selectedNode.role}
                </span>
              </div>
              <p className="text-[13px] text-[#575754] mt-0.5 leading-relaxed">
                {selectedNode.detail || 'Core state pipeline step verified in synthesized video evidence.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium self-end sm:self-auto">
            <span className="material-symbols-outlined text-[16px] text-emerald-600">check_circle</span>
            <span>Deterministic Verification</span>
          </div>
        </div>
      )}

      {/* Explanation */}
      <div className="mt-4 text-[13px] text-[#575754] leading-relaxed bg-[#F4F4F2] p-3.5 rounded-xl border border-[#E8E8E6]">
        <strong className="text-[#111111]">Architectural Takeaway: </strong>
        {diagram.explanation}
      </div>
    </div>
  );
};
