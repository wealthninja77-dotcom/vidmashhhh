import React, { useState } from 'react';
import { QuantitativeGraph, DataPoint } from '../types/video';

interface QuantitativeChartProps {
  graph: QuantitativeGraph;
}

export const QuantitativeChart: React.FC<QuantitativeChartProps> = ({ graph }) => {
  const [activePoint, setActivePoint] = useState<DataPoint | null>(null);

  const svgWidth = 600;
  const svgHeight = 240;
  const padding = { top: 25, right: 30, bottom: 45, left: 60 };
  const chartWidth = svgWidth - padding.left - padding.right;
  const chartHeight = svgHeight - padding.top - padding.bottom;

  const allValues = graph.dataPoints.flatMap((d) => [d.value, d.secondaryValue || 0]);
  const maxValue = Math.max(...allValues, 1);
  const yTicks = [0, Math.round(maxValue * 0.33), Math.round(maxValue * 0.66), maxValue];

  const getYCoord = (val: number) => {
    return padding.top + chartHeight - (val / maxValue) * chartHeight;
  };

  const isBar = graph.type === 'bar' || graph.type === 'comparison';

  return (
    <div className="rounded-3xl border border-[#E8E8E6] bg-white p-6 sm:p-8 shadow-[0_2px_8px_rgba(0,0,0,0.02)] print-break-inside-avoid">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#E8E8E6]">
        <div>
          <div className="inline-block px-3 py-1 rounded-full bg-[#F4F4F2] text-[11px] font-mono font-medium text-[#575754] uppercase tracking-wider mb-2">
            Quantitative Telemetry • {graph.unit}
          </div>
          <h4 className="text-xl font-semibold text-[#111111] tracking-tight">{graph.title}</h4>
          <p className="text-[13px] text-[#575754] mt-0.5">
            {graph.yAxisLabel} ({graph.unit}) vs {graph.xAxisLabel}
          </p>
        </div>

        {graph.sourceTimestamp && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F9F9F8] border border-[#E8E8E6] text-[12px] font-mono text-[#575754] self-start sm:self-auto">
            <span className="material-symbols-outlined text-[15px] text-[#111111]">schedule</span>
            <span>[{graph.sourceTimestamp}]</span>
          </div>
        )}
      </div>

      {/* SVG Canvas */}
      <div className="mt-5 relative overflow-x-auto">
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto min-w-[500px]">
          {/* Grid lines */}
          {yTicks.map((tick, i) => {
            const y = getYCoord(tick);
            return (
              <g key={`tick-${i}`}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={svgWidth - padding.right}
                  y2={y}
                  stroke="#E8E8E6"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />
                <text
                  x={padding.left - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-[#8C8C89] text-[11px] font-mono"
                >
                  {tick}
                </text>
              </g>
            );
          })}

          {/* Bar Chart rendering */}
          {isBar ? (
            graph.dataPoints.map((point, index) => {
              const count = graph.dataPoints.length;
              const slotWidth = chartWidth / count;
              const barWidth = Math.min(48, slotWidth * 0.6);
              const x = padding.left + index * slotWidth + (slotWidth - barWidth) / 2;
              const y = getYCoord(point.value);
              const barHeight = Math.max(4, chartHeight - (y - padding.top));
              const isHovered = activePoint?.label === point.label;

              return (
                <g
                  key={`bar-${index}`}
                  onMouseEnter={() => setActivePoint(point)}
                  onMouseLeave={() => setActivePoint(null)}
                  className="cursor-pointer group"
                >
                  <rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={barHeight}
                    rx="6"
                    fill={isHovered ? '#111111' : '#2D2D2A'}
                    className="transition-all duration-200"
                  />

                  {/* Value label */}
                  <text
                    x={x + barWidth / 2}
                    y={y - 8}
                    textAnchor="middle"
                    className="fill-[#111111] font-mono text-[11px] font-bold"
                  >
                    {point.value}
                    {graph.unit === '%' ? '%' : ''}
                  </text>

                  {/* X label */}
                  <text
                    x={x + barWidth / 2}
                    y={svgHeight - padding.bottom + 20}
                    textAnchor="middle"
                    className="fill-[#575754] text-[11px] font-medium"
                  >
                    {point.label.length > 14 ? point.label.slice(0, 13) + '…' : point.label}
                  </text>
                </g>
              );
            })
          ) : (
            // Line Chart rendering
            <g>
              {(() => {
                const points = graph.dataPoints.map((pt, i) => {
                  const x = padding.left + (i / Math.max(1, graph.dataPoints.length - 1)) * chartWidth;
                  const y = getYCoord(pt.value);
                  return { x, y, pt };
                });

                const pathD = points.reduce(
                  (acc, curr, idx) => (idx === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`),
                  ''
                );

                const areaD = `${pathD} L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${
                  points[0].x
                } ${padding.top + chartHeight} Z`;

                return (
                  <>
                    <path d={areaD} fill="#F4F4F2" />
                    <path d={pathD} fill="none" stroke="#111111" strokeWidth="2.5" />
                    {points.map((p, i) => (
                      <g
                        key={`pt-${i}`}
                        onMouseEnter={() => setActivePoint(p.pt)}
                        onMouseLeave={() => setActivePoint(null)}
                        className="cursor-pointer"
                      >
                        <circle
                          cx={p.x}
                          cy={p.y}
                          r={activePoint?.label === p.pt.label ? 6 : 4}
                          fill="#FFFFFF"
                          stroke="#111111"
                          strokeWidth="2.5"
                          className="transition-all"
                        />
                        <text
                          x={p.x}
                          y={p.y - 12}
                          textAnchor="middle"
                          className="fill-[#111111] font-mono text-[11px] font-bold"
                        >
                          {p.pt.value}
                        </text>
                        <text
                          x={p.x}
                          y={svgHeight - padding.bottom + 20}
                          textAnchor="middle"
                          className="fill-[#575754] text-[11px]"
                        >
                          {p.pt.label}
                        </text>
                      </g>
                    ))}
                  </>
                );
              })()}
            </g>
          )}
        </svg>
      </div>

      {/* Insight */}
      <div className="mt-5 p-4 rounded-2xl bg-[#F9F9F8] border border-[#E8E8E6] text-[13px] flex items-start gap-3">
        <span className="material-symbols-outlined text-[#111111] text-[19px] shrink-0 mt-0.5">analytics</span>
        <div className="text-[#575754] leading-relaxed">
          {activePoint ? (
            <span>
              <strong className="text-[#111111]">{activePoint.label}:</strong> {activePoint.value} {graph.unit}{' '}
              {activePoint.annotation ? `— ${activePoint.annotation}` : ''}
            </span>
          ) : (
            <span>
              <strong className="text-[#111111]">Empirical Finding:</strong> {graph.insight}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
