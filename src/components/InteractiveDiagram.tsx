import React, { useState } from 'react';
import { SynthesizedDiagram, DiagramNode } from '../types/video';

interface InteractiveDiagramProps {
  diagram: SynthesizedDiagram;
  index?: number;
}

export const InteractiveDiagram: React.FC<InteractiveDiagramProps> = ({
  diagram,
  index = 0,
}) => {
  const [selectedNode, setSelectedNode] = useState<DiagramNode | null>(
    diagram.nodes[0] || null
  );
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(1);

  const nodeCount = diagram.nodes.length;
  // Use a 3-column serpentine blueprint layout so all nodes fit cleanly inside the viewport width
  const colsPerRow = nodeCount <= 3 ? Math.max(1, nodeCount) : 3;
  const totalRows = Math.ceil(nodeCount / colsPerRow);

  const svgWidth = 780;
  const rowHeight = 138;
  const svgHeight = Math.max(190, totalRows * rowHeight + 44);
  const nodeW = 192;
  const nodeH = 82;

  const colPositions =
    colsPerRow === 1
      ? [390]
      : colsPerRow === 2
      ? [230, 550]
      : [138, 390, 642];

  const nodeCoords = diagram.nodes.map((node, i) => {
    const row = Math.floor(i / colsPerRow);
    const colInRow = i % colsPerRow;
    // Serpentine ordering: even rows go left -> right, odd rows go right -> left
    const effectiveCol = row % 2 === 0 ? colInRow : colsPerRow - 1 - colInRow;
    const x = colPositions[effectiveCol] ?? 390;
    const y = 70 + row * rowHeight;
    return { ...node, index: i, row, col: effectiveCol, x, y };
  });

  const getRoleStyle = (role: DiagramNode['role']) => {
    switch (role) {
      case 'input':
        return {
          fill: '#FFFFFF',
          stroke: '#111111',
          accent: '#111111',
          badgeBg: '#111111',
          badgeText: '#FFFFFF',
          tagClass: 'bg-[#111111] text-white',
        };
      case 'process':
        return {
          fill: '#FFFFFF',
          stroke: '#3D3C38',
          accent: '#3D3C38',
          badgeBg: '#EFECE6',
          badgeText: '#111111',
          tagClass: 'bg-[#EFECE6] text-[#111111] border border-[#E2E0D8]',
        };
      case 'decision':
        return {
          fill: '#FFFDF5',
          stroke: '#B45309',
          accent: '#B45309',
          badgeBg: '#FEF3C7',
          badgeText: '#92400E',
          tagClass: 'bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]',
        };
      case 'database':
        return {
          fill: '#F8FAFF',
          stroke: '#3730A3',
          accent: '#3730A3',
          badgeBg: '#E0E7FF',
          badgeText: '#3730A3',
          tagClass: 'bg-[#E0E7FF] text-[#3730A3] border border-[#C7D2FE]',
        };
      case 'output':
        return {
          fill: '#F4FDF7',
          stroke: '#15803D',
          accent: '#15803D',
          badgeBg: '#DCFCE7',
          badgeText: '#166534',
          tagClass: 'bg-[#DCFCE7] text-[#166534] border border-[#BBF7D0]',
        };
      default:
        return {
          fill: '#FFFFFF',
          stroke: '#575652',
          accent: '#575652',
          badgeBg: '#EFECE6',
          badgeText: '#111111',
          tagClass: 'bg-[#EFECE6] text-[#111111] border border-[#E2E0D8]',
        };
    }
  };

  return (
    <div className="group/diagram rounded-lg border border-[#E2E0D8] bg-white overflow-hidden print-break-inside-avoid shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:shadow-[0_10px_28px_rgba(17,17,17,0.07)] hover:border-[#C8C5BC] transition-all duration-300 ease-out">
      {/* Header Bar */}
      <div className="px-5 py-4 border-b border-[#E2E0D8] bg-[#FAF9F6] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="text-[10.5px] font-mono uppercase tracking-wider text-[#787670] flex flex-wrap items-center gap-x-2 gap-y-1 mb-1">
            <span className="font-semibold text-[#111111] whitespace-nowrap">
              FIG. 0{index + 1}
            </span>
            <span>·</span>
            <span className="whitespace-nowrap">
              ARCHITECTURAL TOPOLOGY ({diagram.type.replace('_', ' ')})
            </span>
            <span>·</span>
            <span className="tabular-nums whitespace-nowrap">
              {diagram.nodes.length} NODES / {diagram.edges.length} VECTORS
            </span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-[#EFECE6] text-[#111111] text-[9.5px] font-semibold whitespace-nowrap">
              INTERACTIVE SVG
            </span>
          </div>
          <h4 className="text-[17px] font-semibold text-[#111111] tracking-tight">
            {diagram.title}
          </h4>
          <p className="text-[12.5px] text-[#4A4945] mt-0.5">{diagram.caption}</p>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 self-end sm:self-auto no-print">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(0.85, z - 0.1))}
            className="px-2 py-1 rounded bg-white border border-[#E2E0D8] hover:border-[#111111] text-[#4A4945] text-[11px] font-mono transition cursor-pointer"
            title="Zoom out"
          >
            −
          </button>
          <span className="text-[11px] font-mono tabular-nums text-[#111111] px-2 font-medium">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(1.3, z + 0.1))}
            className="px-2 py-1 rounded bg-white border border-[#E2E0D8] hover:border-[#111111] text-[#4A4945] text-[11px] font-mono transition cursor-pointer"
            title="Zoom in"
          >
            +
          </button>
          {zoom !== 1 && (
            <button
              type="button"
              onClick={() => setZoom(1)}
              className="px-2 py-1 rounded bg-white border border-[#E2E0D8] hover:border-[#111111] text-[#787670] hover:text-[#111111] text-[10px] font-mono uppercase transition ml-1 cursor-pointer"
            >
              100%
            </button>
          )}
        </div>
      </div>

      {/* Serpentine Blueprint SVG Canvas */}
      <div
        className="relative overflow-x-auto bg-[#F7F6F2] p-4 sm:p-6 border-b border-[#E2E0D8]"
        style={{
          backgroundImage: 'radial-gradient(#D5D3CA 1px, transparent 1px)',
          backgroundSize: '16px 16px',
        }}
      >
        <div
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'top center',
          }}
          className="transition-transform duration-200"
        >
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-auto min-w-[580px] overflow-visible"
          >
            <defs>
              <marker
                id={`arrow-${diagram.id}`}
                viewBox="0 0 10 10"
                refX="8.5"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1.5 L 8.5 5 L 0 8.5 z" fill="#111111" />
              </marker>
              <filter
                id={`shadow-${diagram.id}`}
                x="-12%"
                y="-12%"
                width="124%"
                height="130%"
              >
                <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodOpacity="0.06" />
              </filter>
              <filter
                id={`shadow-hover-${diagram.id}`}
                x="-20%"
                y="-20%"
                width="140%"
                height="150%"
              >
                <feDropShadow dx="0" dy="7" stdDeviation="6" floodOpacity="0.16" />
              </filter>
            </defs>

            {/* Connecting Edges with Smart Port Selection */}
            {diagram.edges.map((edge, idx) => {
              const fromNode = nodeCoords.find((n) => n.id === edge.from);
              const toNode = nodeCoords.find((n) => n.id === edge.to);
              if (!fromNode || !toNode) return null;

              const isConnectedToHover =
                hoveredNodeId === fromNode.id || hoveredNodeId === toNode.id;

              const halfW = nodeW / 2;
              const halfH = nodeH / 2;
              let startX = fromNode.x;
              let startY = fromNode.y;
              let endX = toNode.x;
              let endY = toNode.y;
              let pathD = '';
              let labelX = (fromNode.x + toNode.x) / 2;
              let labelY = (fromNode.y + toNode.y) / 2;

              if (fromNode.row === toNode.row) {
                // Horizontal connection on the same row
                const goingRight = toNode.x > fromNode.x;
                startX = goingRight ? fromNode.x + halfW : fromNode.x - halfW;
                endX = goingRight ? toNode.x - halfW - 3 : toNode.x + halfW + 3;
                startY = fromNode.y;
                endY = toNode.y;
                pathD = `M ${startX} ${startY} L ${endX} ${endY}`;
                labelX = (startX + endX) / 2;
                labelY = startY - 11;
              } else if (fromNode.col === toNode.col) {
                // Vertical drop between rows in the same column
                const goingDown = toNode.y > fromNode.y;
                startX = fromNode.x;
                endX = toNode.x;
                startY = goingDown ? fromNode.y + halfH : fromNode.y - halfH;
                endY = goingDown ? toNode.y - halfH - 3 : toNode.y + halfH + 3;
                pathD = `M ${startX} ${startY} L ${endX} ${endY}`;
                labelX = startX + 48;
                labelY = (startY + endY) / 2 + 3;
              } else {
                // Diagonal / cross-row architectural connection
                const goingDown = toNode.y > fromNode.y;
                startX = fromNode.x;
                startY = goingDown ? fromNode.y + halfH : fromNode.y - halfH;
                endX = toNode.x;
                endY = goingDown ? toNode.y - halfH - 3 : toNode.y + halfH + 3;
                const midY = (startY + endY) / 2;
                pathD = `M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`;
                labelX = (startX + endX) / 2;
                labelY = midY - 4;
              }

              const shortLabel =
                edge.label && edge.label.length > 18
                  ? edge.label.slice(0, 16) + '…'
                  : edge.label;

              return (
                <g key={`edge-${idx}`}>
                  <path
                    d={pathD}
                    fill="none"
                    stroke="#111111"
                    strokeWidth={isConnectedToHover ? '2.3' : '1.6'}
                    strokeDasharray={edge.style === 'dashed' ? '4,4' : undefined}
                    markerEnd={`url(#arrow-${diagram.id})`}
                    className="transition-all duration-200"
                  />
                  {shortLabel && (
                    <g>
                      <rect
                        x={labelX - Math.max(26, shortLabel.length * 3)}
                        y={labelY - 9}
                        width={Math.max(52, shortLabel.length * 6)}
                        height="13"
                        rx="2"
                        fill={isConnectedToHover ? '#111111' : '#F7F6F2'}
                        stroke={isConnectedToHover ? '#111111' : '#E2E0D8'}
                        strokeWidth="0.75"
                        className="transition-colors duration-200"
                      />
                      <text
                        x={labelX}
                        y={labelY}
                        textAnchor="middle"
                        fill={isConnectedToHover ? '#FFFFFF' : '#4A4945'}
                        className="text-[8.5px] font-mono font-medium transition-colors duration-200"
                      >
                        {shortLabel}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}

            {/* Interactive Flowchart Nodes with Smooth Hover Scale & Elevation Shadow */}
            {nodeCoords.map((node) => {
              const isSelected = selectedNode?.id === node.id;
              const isHovered = hoveredNodeId === node.id;
              const styles = getRoleStyle(node.role);
              const halfW = nodeW / 2;
              const halfH = nodeH / 2;

              // Split long labels cleanly across up to 2 lines instead of aggressive truncation
              const words = node.label.split(' ');
              let line1 = '';
              let line2 = '';
              for (const w of words) {
                if ((line1 + ' ' + w).trim().length <= 24) {
                  line1 = (line1 + ' ' + w).trim();
                } else {
                  line2 = (line2 + ' ' + w).trim();
                }
              }
              if (line2.length > 26) {
                line2 = line2.slice(0, 24) + '…';
              }

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  onClick={() => setSelectedNode(node)}
                  onMouseEnter={() => setHoveredNodeId(node.id)}
                  onMouseLeave={() => setHoveredNodeId(null)}
                  className="cursor-pointer"
                  data-testid={`flowchart-node-${node.id}`}
                >
                  {/* Inner group centered at (0,0) for smooth scale & drop-shadow elevation on hover */}
                  <g
                    style={{
                      transform: isHovered
                        ? 'scale(1.055) translateY(-2px)'
                        : isSelected
                        ? 'scale(1.015)'
                        : 'scale(1)',
                      transition:
                        'transform 220ms cubic-bezier(0.22, 1, 0.36, 1), filter 220ms ease-out',
                    }}
                    filter={
                      isHovered
                        ? `url(#shadow-hover-${diagram.id})`
                        : `url(#shadow-${diagram.id})`
                    }
                  >
                    {/* Node Card */}
                    <rect
                      x={-halfW}
                      y={-halfH}
                      width={nodeW}
                      height={nodeH}
                      rx="6"
                      fill={styles.fill}
                      stroke={isHovered || isSelected ? '#111111' : styles.stroke}
                      strokeWidth={isHovered || isSelected ? '2.4' : '1.3'}
                      className="transition-colors duration-200"
                    />

                    {/* Left Accent Bar */}
                    <rect
                      x={-halfW}
                      y={-halfH}
                      width="5"
                      height={nodeH}
                      rx="2"
                      fill={styles.accent}
                    />

                    {/* Role & Step Header */}
                    <rect
                      x={-halfW + 13}
                      y={-halfH + 8}
                      width="64"
                      height="14"
                      rx="2.5"
                      fill={styles.badgeBg}
                    />
                    <text
                      x={-halfW + 45}
                      y={-halfH + 18}
                      textAnchor="middle"
                      fill={styles.badgeText}
                      className="text-[8px] font-mono font-semibold uppercase tracking-wider"
                    >
                      0{node.index + 1} · {node.role}
                    </text>

                    {/* Active / Hover Status Indicator */}
                    {(isSelected || isHovered) && (
                      <text
                        x={halfW - 10}
                        y={-halfH + 18}
                        textAnchor="end"
                        className="fill-[#111111] text-[8.5px] font-mono font-bold"
                      >
                        {isSelected ? 'ACTIVE' : 'INSPECT ↗'}
                      </text>
                    )}

                    {/* Node Primary Title (1 or 2 lines) */}
                    <text
                      x={-halfW + 14}
                      y={line2 ? -2 : 4}
                      textAnchor="start"
                      className="fill-[#111111] font-semibold text-[11px] select-none pointer-events-none"
                    >
                      {line1}
                    </text>
                    {line2 && (
                      <text
                        x={-halfW + 14}
                        y={12}
                        textAnchor="start"
                        className="fill-[#111111] font-semibold text-[10.5px] select-none pointer-events-none"
                      >
                        {line2}
                      </text>
                    )}

                    {/* Node Subtitle / Detail */}
                    <text
                      x={-halfW + 14}
                      y={halfH - 9}
                      textAnchor="start"
                      className="fill-[#787670] text-[9px] font-mono select-none pointer-events-none"
                    >
                      {node.detail
                        ? node.detail.length > 29
                          ? node.detail.slice(0, 27) + '…'
                          : node.detail
                        : 'Click to inspect node'}
                    </text>
                  </g>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Interactive Node Stepper Bar */}
      <div className="px-5 py-2.5 bg-[#FAF9F6] border-b border-[#E2E0D8] flex items-center gap-1.5 overflow-x-auto no-print">
        <span className="text-[10px] font-mono uppercase tracking-wider text-[#787670] mr-1 shrink-0">
          Inspect Stage:
        </span>
        {diagram.nodes.map((n, idx) => {
          const active = selectedNode?.id === n.id;
          return (
            <button
              key={n.id}
              type="button"
              onClick={() => setSelectedNode(n)}
              onMouseEnter={() => setHoveredNodeId(n.id)}
              onMouseLeave={() => setHoveredNodeId(null)}
              className={`px-2.5 py-1 rounded text-[11px] font-mono whitespace-nowrap transition-all duration-200 cursor-pointer ${
                active
                  ? 'bg-[#111111] text-white font-semibold shadow-xs'
                  : 'bg-white border border-[#E2E0D8] text-[#4A4945] hover:border-[#111111] hover:text-[#111111] hover:scale-[1.03] hover:shadow-xs'
              }`}
            >
              0{idx + 1}. {n.label.length > 22 ? n.label.slice(0, 20) + '…' : n.label}
            </button>
          );
        })}
      </div>

      {/* Bottom Inspector & Architectural Takeaway */}
      <div className="p-4 sm:p-5 bg-white grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {selectedNode && (
          <div className="md:col-span-7 flex items-start gap-3 pr-2 md:border-r md:border-[#E2E0D8]">
            <div className="w-6 h-6 rounded bg-[#111111] text-white font-mono text-[11px] font-semibold flex items-center justify-center shrink-0 mt-0.5">
              0{diagram.nodes.findIndex((n) => n.id === selectedNode.id) + 1}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-[13.5px] text-[#111111]">
                  {selectedNode.label}
                </span>
                <span
                  className={`text-[9.5px] px-1.5 py-0.5 rounded uppercase font-mono font-semibold ${
                    getRoleStyle(selectedNode.role).tagClass
                  }`}
                >
                  {selectedNode.role}
                </span>
              </div>
              <p className="text-[12.5px] text-[#4A4945] mt-1 leading-relaxed">
                {selectedNode.detail ||
                  'Verified component transition within the synthesized video architecture.'}
              </p>
            </div>
          </div>
        )}

        <div className="md:col-span-5 text-[12.5px] text-[#4A4945] leading-relaxed">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#787670] block mb-0.5">
            Architectural Mechanism
          </span>
          <p className="text-[#111111]">{diagram.explanation}</p>
        </div>
      </div>
    </div>
  );
};
