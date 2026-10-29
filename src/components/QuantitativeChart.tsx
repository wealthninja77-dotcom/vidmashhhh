import React, { useState } from 'react';
import { QuantitativeGraph, DataPoint } from '../types/video';

interface QuantitativeChartProps {
  graph: QuantitativeGraph;
  index?: number;
  onSeekTimestamp?: (timestampStr: string) => void;
}

export const QuantitativeChart: React.FC<QuantitativeChartProps> = ({
  graph,
  index = 0,
  onSeekTimestamp,
}) => {
  const [activePoint, setActivePoint] = useState<DataPoint | null>(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [copiedCsv, setCopiedCsv] = useState<boolean>(false);

  const svgWidth = 580;
  const svgHeight = 225;
  const padding = { top: 28, right: 48, bottom: 44, left: 56 };
  const chartWidth = svgWidth - padding.left - padding.right;
  const chartHeight = svgHeight - padding.top - padding.bottom;

  const allValues = graph.dataPoints.flatMap((d) => [d.value, d.secondaryValue || 0]);
  const maxValue = Math.max(...allValues, 1);
  const minValue = Math.min(...graph.dataPoints.map((d) => d.value), 0);
  const sumValues = graph.dataPoints.reduce((acc, d) => acc + Math.max(0, d.value), 0) || 1;
  const meanValue = Number(
    (
      graph.dataPoints.reduce((acc, d) => acc + d.value, 0) /
      Math.max(1, graph.dataPoints.length)
    ).toFixed(2)
  );
  const hasSecondaryValues = graph.dataPoints.some(
    (d) => typeof d.secondaryValue === 'number'
  );

  const yTicks = [
    0,
    Number((maxValue * 0.33).toFixed(1)),
    Number((maxValue * 0.66).toFixed(1)),
    maxValue,
  ];

  const getYCoord = (val: number) => {
    return padding.top + chartHeight - (val / maxValue) * chartHeight;
  };

  const isBar = graph.type === 'bar' || graph.type === 'comparison';

  const handleCopyCsv = () => {
    const headers = [
      'Index',
      graph.xAxisLabel || 'Label',
      `${graph.yAxisLabel} (${graph.unit})`,
      ...(hasSecondaryValues ? ['Secondary Value'] : []),
      'Share (%)',
      'Annotation',
    ];
    const rows = graph.dataPoints.map((pt, i) => {
      const share = ((pt.value / sumValues) * 100).toFixed(1);
      return [
        i + 1,
        `"${pt.label.replace(/"/g, '""')}"`,
        pt.value,
        ...(hasSecondaryValues ? [pt.secondaryValue ?? ''] : []),
        `${share}%`,
        `"${(pt.annotation || '').replace(/"/g, '""')}"`,
      ].join(',');
    });
    const csv = [headers.join(','), ...rows].join('\n');
    navigator.clipboard?.writeText(csv);
    setCopiedCsv(true);
    setTimeout(() => setCopiedCsv(false), 1800);
  };

  return (
    <div className="rounded-lg border border-[#E2E0D8] bg-white flex flex-col justify-between overflow-hidden print-break-inside-avoid shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_24px_rgba(17,17,17,0.06)] transition-shadow duration-300">
      <div>
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#E2E0D8] bg-[#FAF9F6] space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-[10.5px] font-mono uppercase tracking-wider text-[#787670] flex items-center gap-1.5">
              <span className="font-semibold text-[#111111]">CHART 0{index + 1}</span>
              <span>·</span>
              <span>TELEMETRY ({graph.unit})</span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0 no-print">
              {/* Expand Raw Data Points Toggle Button */}
              <button
                type="button"
                onClick={() => setIsExpanded((prev) => !prev)}
                aria-expanded={isExpanded}
                data-testid={`expand-raw-data-toggle-${index}`}
                className={`px-2.5 py-1 rounded border text-[10.5px] font-mono transition-all duration-150 flex items-center gap-1.5 cursor-pointer ${
                  isExpanded
                    ? 'bg-[#111111] border-[#111111] text-white font-semibold shadow-xs'
                    : 'bg-white border-[#E2E0D8] hover:border-[#111111] text-[#111111]'
                }`}
                title={
                  isExpanded
                    ? 'Collapse raw telemetry table'
                    : 'Expand raw data points in a structured table'
                }
              >
                <span>{isExpanded ? 'Collapse Data' : 'Expand Data'}</span>
                <span
                  className={`text-[9.5px] px-1 rounded tabular-nums ${
                    isExpanded
                      ? 'bg-white/20 text-white'
                      : 'bg-[#EFECE6] text-[#4A4945]'
                  }`}
                >
                  {graph.dataPoints.length}
                </span>
                <span className="text-[9px] leading-none">{isExpanded ? '▲' : '▼'}</span>
              </button>

              {graph.sourceTimestamp && (
                <button
                  type="button"
                  onClick={() => onSeekTimestamp?.(graph.sourceTimestamp)}
                  className="px-2 py-1 rounded bg-white border border-[#E2E0D8] hover:border-[#111111] text-[10.5px] font-mono tabular-nums text-[#111111] shrink-0 transition cursor-pointer"
                  title="Seek embedded video player to this timestamp"
                >
                  [{graph.sourceTimestamp}]
                </button>
              )}
            </div>
          </div>

          <div>
            <h4 className="text-[15.5px] font-semibold text-[#111111] tracking-tight leading-snug">
              {graph.title}
            </h4>
            <p className="text-[12px] text-[#4A4945] mt-0.5">
              {graph.yAxisLabel.includes(graph.unit)
                ? graph.yAxisLabel
                : `${graph.yAxisLabel} (${graph.unit})`}{' '}
              vs. {graph.xAxisLabel}
            </p>
          </div>
        </div>

        {/* SVG Canvas */}
        <div className="px-3 pt-4 pb-2 relative bg-white">
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto block">
            <defs>
              <linearGradient id={`area-grad-${graph.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#111111" stopOpacity="0.16" />
                <stop offset="100%" stopColor="#111111" stopOpacity="0.01" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid Lines & Y-Axis Ticks */}
            {yTicks.map((tick, i) => {
              const y = getYCoord(tick);
              return (
                <g key={`tick-${i}`}>
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={svgWidth - padding.right}
                    y2={y}
                    stroke={i === 0 ? '#111111' : '#E2E0D8'}
                    strokeDasharray={i === 0 ? undefined : '3 3'}
                    strokeWidth={i === 0 ? '1.2' : '1'}
                  />
                  <text
                    x={padding.left - 8}
                    y={y + 3.5}
                    textAnchor="end"
                    className="fill-[#787670] text-[10.5px] font-mono tabular-nums"
                  >
                    {tick}
                  </text>
                </g>
              );
            })}

            {isBar ? (
              graph.dataPoints.map((point, idx) => {
                const count = graph.dataPoints.length;
                const slotWidth = chartWidth / count;
                const barWidth = Math.min(48, slotWidth * 0.56);
                const x = padding.left + idx * slotWidth + (slotWidth - barWidth) / 2;
                const rawBarHeight = (point.value / maxValue) * chartHeight;
                // Ensure non-zero small values still have a visible 10px bar height for legibility
                const barHeight = point.value > 0 ? Math.max(10, rawBarHeight) : 2;
                const y = padding.top + chartHeight - barHeight;
                const isHovered = activePoint?.label === point.label;

                return (
                  <g
                    key={`bar-${idx}`}
                    onMouseEnter={() => setActivePoint(point)}
                    onMouseLeave={() => setActivePoint(null)}
                    className="cursor-pointer"
                  >
                    {/* Subtle Full-Height Slot Track */}
                    <rect
                      x={x}
                      y={padding.top}
                      width={barWidth}
                      height={chartHeight}
                      rx="3"
                      fill="#F7F6F2"
                    />

                    {/* Active Data Bar */}
                    <rect
                      x={x}
                      y={y}
                      width={barWidth}
                      height={barHeight}
                      rx="3"
                      fill={isHovered ? '#111111' : '#262523'}
                      className="transition-colors duration-150"
                    />

                    {/* Value Badge */}
                    <rect
                      x={x + barWidth / 2 - 24}
                      y={y - 20}
                      width="48"
                      height="15"
                      rx="2"
                      fill={isHovered ? '#111111' : '#EFECE6'}
                    />
                    <text
                      x={x + barWidth / 2}
                      y={y - 9.5}
                      textAnchor="middle"
                      fill={isHovered ? '#FFFFFF' : '#111111'}
                      className="font-mono text-[10px] font-semibold tabular-nums"
                    >
                      {point.value}
                      {graph.unit === '%' ? '%' : ''}
                    </text>

                    {/* X-Axis Label */}
                    <text
                      x={x + barWidth / 2}
                      y={svgHeight - padding.bottom + 18}
                      textAnchor="middle"
                      className="fill-[#111111] text-[10.5px] font-mono font-medium"
                    >
                      {point.label.length > 14 ? point.label.slice(0, 13) + '…' : point.label}
                    </text>
                  </g>
                );
              })
            ) : (
              <g>
                {(() => {
                  const points = graph.dataPoints.map((pt, i) => {
                    const x =
                      padding.left +
                      16 +
                      (i / Math.max(1, graph.dataPoints.length - 1)) * (chartWidth - 32);
                    const y = getYCoord(pt.value);
                    return { x, y, pt };
                  });

                  const pathD = points.reduce(
                    (acc, curr, idx) =>
                      idx === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`,
                    ''
                  );

                  const areaD = `${pathD} L ${points[points.length - 1].x} ${
                    padding.top + chartHeight
                  } L ${points[0].x} ${padding.top + chartHeight} Z`;

                  return (
                    <>
                      <path d={areaD} fill={`url(#area-grad-${graph.id})`} />
                      <path d={pathD} fill="none" stroke="#111111" strokeWidth="2.2" />
                      {points.map((p, i) => {
                        const isHovered = activePoint?.label === p.pt.label;
                        return (
                          <g
                            key={`pt-${i}`}
                            onMouseEnter={() => setActivePoint(p.pt)}
                            onMouseLeave={() => setActivePoint(null)}
                            className="cursor-pointer"
                          >
                            {/* Vertical guide line from point to X-axis */}
                            <line
                              x1={p.x}
                              y1={p.y}
                              x2={p.x}
                              y2={padding.top + chartHeight}
                              stroke={isHovered ? '#111111' : '#E2E0D8'}
                              strokeDasharray="2 2"
                              strokeWidth="1"
                            />
                            <circle
                              cx={p.x}
                              cy={p.y}
                              r={isHovered ? 6 : 4}
                              fill={isHovered ? '#111111' : '#FFFFFF'}
                              stroke="#111111"
                              strokeWidth="2.2"
                            />
                            <rect
                              x={p.x - 20}
                              y={p.y - 22}
                              width="40"
                              height="15"
                              rx="2"
                              fill="#EFECE6"
                            />
                            <text
                              x={p.x}
                              y={p.y - 11.5}
                              textAnchor="middle"
                              className="fill-[#111111] font-mono text-[10px] font-semibold tabular-nums"
                            >
                              {p.pt.value}
                            </text>
                            <text
                              x={p.x}
                              y={svgHeight - padding.bottom + 18}
                              textAnchor="middle"
                              className="fill-[#111111] text-[10px] font-mono font-medium"
                            >
                              {p.pt.label.length > 14
                                ? p.pt.label.slice(0, 13) + '…'
                                : p.pt.label}
                            </text>
                          </g>
                        );
                      })}
                    </>
                  );
                })()}
              </g>
            )}
          </svg>
        </div>

        {/* Expandable Raw Data Points Table OR Compact Summary Strip */}
        {isExpanded ? (
          <div
            data-testid={`raw-data-table-container-${index}`}
            className="border-t border-[#E2E0D8] bg-[#FAF9F6] animate-in fade-in duration-150"
          >
            {/* Table Toolbar & Statistical Summary */}
            <div className="px-4 py-2 border-b border-[#EBE9E2] flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-[#4A4945]">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 tabular-nums">
                <span className="font-semibold text-[#111111] uppercase">
                  RAW DATA TABLE
                </span>
                <span>·</span>
                <span>
                  PEAK: <strong className="text-[#111111]">{maxValue} {graph.unit}</strong>
                </span>
                <span>·</span>
                <span>
                  MEAN: <strong className="text-[#111111]">{meanValue} {graph.unit}</strong>
                </span>
              </div>

              <button
                type="button"
                onClick={handleCopyCsv}
                className="px-2 py-0.5 rounded bg-white border border-[#E2E0D8] hover:border-[#111111] text-[#111111] text-[10px] font-mono transition cursor-pointer shrink-0"
              >
                {copiedCsv ? '✓ CSV Copied' : 'Copy CSV'}
              </button>
            </div>

            {/* Small Raw Data HTML Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-mono text-[11px]">
                <thead>
                  <tr className="border-b border-[#E2E0D8] bg-[#F2F0E8] text-[#787670] text-[9.5px] uppercase tracking-wider">
                    <th className="py-2 pl-4 pr-1.5 font-semibold w-7">#</th>
                    <th className="py-2 px-2 font-semibold">{graph.xAxisLabel || 'Parameter'}</th>
                    <th className="py-2 px-2 font-semibold text-right whitespace-nowrap">
                      Value ({graph.unit})
                    </th>
                    {hasSecondaryValues && (
                      <th className="py-2 px-2 font-semibold text-right whitespace-nowrap">
                        Baseline
                      </th>
                    )}
                    <th className="py-2 pl-2 pr-4 font-semibold text-right whitespace-nowrap">
                      Share
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EBE9E2] bg-white">
                  {graph.dataPoints.map((pt, idx) => {
                    const sharePct = ((pt.value / sumValues) * 100).toFixed(1);
                    const isPeak = pt.value === maxValue && graph.dataPoints.length > 1;
                    const isRowActive = activePoint?.label === pt.label;
                    return (
                      <tr
                        key={`table-row-${idx}`}
                        onMouseEnter={() => setActivePoint(pt)}
                        onMouseLeave={() => setActivePoint(null)}
                        className={`transition-colors cursor-pointer align-top ${
                          isRowActive ? 'bg-[#EFECE6]/80' : 'hover:bg-[#FAF9F6]'
                        }`}
                      >
                        <td className="py-2 pl-4 pr-1.5 text-[#787670] tabular-nums">
                          0{idx + 1}
                        </td>
                        <td className="py-2 px-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold text-[#111111]">{pt.label}</span>
                            {isPeak && (
                              <span className="px-1 py-0.2 rounded bg-[#111111] text-white text-[8px] uppercase">
                                PEAK
                              </span>
                            )}
                          </div>
                          {pt.annotation && (
                            <div className="text-[10.5px] text-[#787670] font-sans leading-snug mt-0.5">
                              {pt.annotation}
                            </div>
                          )}
                        </td>
                        <td className="py-2 px-2 text-right font-semibold text-[#111111] tabular-nums whitespace-nowrap">
                          {pt.value} {graph.unit}
                        </td>
                        {hasSecondaryValues && (
                          <td className="py-2 px-2 text-right text-[#4A4945] tabular-nums whitespace-nowrap">
                            {pt.secondaryValue !== undefined ? pt.secondaryValue : '—'}
                          </td>
                        )}
                        <td className="py-2 pl-2 pr-4 text-right text-[#4A4945] tabular-nums whitespace-nowrap">
                          {sharePct}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Compact Preview Strip with Quick Expand Trigger */
          <div className="px-5 py-2.5 border-t border-[#EBE9E2] bg-[#FAF9F6]/60 flex items-center justify-between gap-2 text-[10.5px] font-mono">
            <div className="flex items-center gap-1.5 text-[#4A4945] truncate">
              <span className="text-[#787670] uppercase text-[9.5px]">Range:</span>
              <span className="text-[#111111] font-semibold tabular-nums">
                {minValue}–{maxValue} {graph.unit}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsExpanded(true)}
              className="text-[10.5px] font-mono text-[#111111] hover:underline shrink-0 cursor-pointer font-medium"
            >
              Expand Raw Table ({graph.dataPoints.length} pts) ▼
            </button>
          </div>
        )}
      </div>

      {/* Empirical Insight Footer */}
      <div className="px-5 py-3.5 border-t border-[#E2E0D8] bg-[#FAF9F6] text-[12.5px] text-[#4A4945] leading-relaxed">
        {activePoint ? (
          <div className="flex items-center justify-between gap-2 font-mono text-[11.5px]">
            <span className="font-semibold text-[#111111]">{activePoint.label}</span>
            <span className="tabular-nums text-[#111111] font-semibold">
              {activePoint.value} {graph.unit} (
              {Math.round((activePoint.value / sumValues) * 100)}% of total)
              {activePoint.annotation ? ` · ${activePoint.annotation}` : ''}
            </span>
          </div>
        ) : (
          <div>
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#787670] font-semibold mr-2">
              Empirical Finding:
            </span>
            <span className="text-[#111111]">{graph.insight}</span>
          </div>
        )}
      </div>
    </div>
  );
};
