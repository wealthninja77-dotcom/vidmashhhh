import React from 'react';
import { IllustrationMentalModel } from '../types/video';

interface MentalModelCardProps {
  model: IllustrationMentalModel;
  index?: number;
}

export const MentalModelCard: React.FC<MentalModelCardProps> = ({ model, index = 0 }) => {
  const renderIllustrationSvg = () => {
    switch (model.svgConceptType) {
      case 'neural_transformer':
        return (
          <svg viewBox="0 0 420 155" className="w-full h-36 stroke-[#111111] fill-none">
            <defs>
              <marker
                id={`mm-arrow-nt-${index}`}
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="5"
                markerHeight="5"
                orient="auto"
              >
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#111111" />
              </marker>
            </defs>

            {/* Stage 1: Token Sequence Lattice */}
            <rect
              x="14"
              y="22"
              width="92"
              height="110"
              rx="4"
              fill="#FFFFFF"
              stroke="#111111"
              strokeWidth="1.4"
            />
            <rect x="14" y="22" width="92" height="18" rx="3" fill="#111111" />
            <text
              x="60"
              y="34"
              textAnchor="middle"
              fill="#FFFFFF"
              stroke="none"
              className="text-[8px] font-mono font-semibold uppercase tracking-wider"
            >
              BPE TOKEN STREAM
            </text>
            {[
              { id: '[15496]', tok: '"State"', y: 54 },
              { id: '[318]', tok: '"of"', y: 78 },
              { id: '[38241]', tok: '"GPT"', y: 102 },
            ].map((t, i) => (
              <g key={i}>
                <rect
                  x="22"
                  y={t.y - 10}
                  width="76"
                  height="18"
                  rx="2.5"
                  fill="#F7F6F2"
                  stroke="#E2E0D8"
                  strokeWidth="1"
                />
                <text
                  x="27"
                  y={t.y + 2}
                  stroke="none"
                  className="fill-[#787670] text-[8px] font-mono"
                >
                  {t.id}
                </text>
                <text
                  x="93"
                  y={t.y + 2}
                  textAnchor="end"
                  stroke="none"
                  className="fill-[#111111] text-[8.5px] font-mono font-semibold"
                >
                  {t.tok}
                </text>
              </g>
            ))}

            {/* Attention Routing Curves */}
            <path
              d="M 106 54 C 138 54, 138 66, 166 66"
              stroke="#111111"
              strokeWidth="1.4"
              markerEnd={`url(#mm-arrow-nt-${index})`}
            />
            <path
              d="M 106 78 L 166 78"
              stroke="#111111"
              strokeWidth="1.6"
              markerEnd={`url(#mm-arrow-nt-${index})`}
            />
            <path
              d="M 106 102 C 138 102, 138 90, 166 90"
              stroke="#4A4945"
              strokeWidth="1.3"
              strokeDasharray="3 2"
              markerEnd={`url(#mm-arrow-nt-${index})`}
            />

            {/* Stage 2: Scaled Dot-Product Attention Block */}
            <rect
              x="168"
              y="32"
              width="112"
              height="90"
              rx="5"
              fill="#FFFFFF"
              stroke="#111111"
              strokeWidth="1.6"
            />
            <rect x="176" y="40" width="96" height="15" rx="2" fill="#EFECE6" stroke="none" />
            <text
              x="224"
              y="50.5"
              textAnchor="middle"
              stroke="none"
              className="fill-[#111111] text-[8px] font-mono font-semibold uppercase"
            >
              ATTENTION MATRIX
            </text>
            <text
              x="224"
              y="74"
              textAnchor="middle"
              stroke="none"
              className="fill-[#111111] text-[10px] font-mono font-bold"
            >
              softmax(QKᵀ/√d)V
            </text>
            <text
              x="224"
              y="92"
              textAnchor="middle"
              stroke="none"
              className="fill-[#4A4945] text-[8px] font-mono"
            >
              O(N² · d) Context Window
            </text>
            <text
              x="224"
              y="110"
              textAnchor="middle"
              stroke="none"
              className="fill-[#15803D] text-[8px] font-mono font-semibold"
            >
              Working Memory Scratchpad
            </text>

            {/* Arrow to Stage 3 */}
            <line
              x1="280"
              y1="77"
              x2="314"
              y2="77"
              stroke="#111111"
              strokeWidth="1.6"
              markerEnd={`url(#mm-arrow-nt-${index})`}
            />

            {/* Stage 3: Next-Token Distribution */}
            <rect
              x="316"
              y="26"
              width="90"
              height="102"
              rx="4"
              fill="#141413"
              stroke="#111111"
              strokeWidth="1.4"
            />
            <text
              x="361"
              y="42"
              textAnchor="middle"
              stroke="none"
              className="fill-[#A09E97] text-[7.5px] font-mono uppercase tracking-wider"
            >
              P(x_t+1 | x_≤t)
            </text>
            {[
              { label: 'tok_A', w: 52, pct: '74%', y: 58 },
              { label: 'tok_B', w: 22, pct: '18%', y: 78 },
              { label: 'tok_C', w: 10, pct: '8%', y: 98 },
            ].map((bar, i) => (
              <g key={i}>
                <rect
                  x="326"
                  y={bar.y}
                  width={bar.w}
                  height="9"
                  rx="1.5"
                  fill={i === 0 ? '#FFFFFF' : '#787670'}
                  stroke="none"
                />
                <text
                  x="396"
                  y={bar.y + 7.5}
                  textAnchor="end"
                  stroke="none"
                  className="fill-[#F7F6F2] text-[8px] font-mono tabular-nums"
                >
                  {bar.pct}
                </text>
              </g>
            ))}
          </svg>
        );

      case 'hardware_bandwidth':
        return (
          <svg viewBox="0 0 420 155" className="w-full h-36 stroke-[#111111] fill-none">
            {/* Dual Reticle Die A */}
            <rect
              x="16"
              y="24"
              width="124"
              height="106"
              rx="5"
              fill="#FFFFFF"
              stroke="#111111"
              strokeWidth="1.6"
            />
            <rect x="24" y="32" width="108" height="16" rx="2" fill="#111111" stroke="none" />
            <text
              x="78"
              y="43"
              textAnchor="middle"
              stroke="none"
              className="fill-white text-[8px] font-mono font-semibold uppercase"
            >
              DIE 01 · 104B TRANSISTORS
            </text>
            <rect
              x="26"
              y="56"
              width="48"
              height="32"
              rx="2"
              fill="#F7F6F2"
              stroke="#4A4945"
              strokeWidth="1"
            />
            <text
              x="50"
              y="75"
              textAnchor="middle"
              stroke="none"
              className="fill-[#111111] text-[8px] font-mono font-semibold"
            >
              FP4 Core
            </text>
            <rect
              x="82"
              y="56"
              width="48"
              height="32"
              rx="2"
              fill="#F7F6F2"
              stroke="#4A4945"
              strokeWidth="1"
            />
            <text
              x="106"
              y="75"
              textAnchor="middle"
              stroke="none"
              className="fill-[#111111] text-[8px] font-mono font-semibold"
            >
              HBM3e 4TB/s
            </text>
            <text
              x="78"
              y="112"
              textAnchor="middle"
              stroke="none"
              className="fill-[#4A4945] text-[8.5px] font-mono"
            >
              Reticle Limit Boundary
            </text>

            {/* 10 TB/s NV-HBI High-Density Interconnect Bridge */}
            <rect
              x="140"
              y="46"
              width="140"
              height="62"
              fill="#141413"
              stroke="#111111"
              strokeWidth="1.5"
            />
            {[56, 66, 76, 86, 96].map((yLine, idx) => (
              <line
                key={idx}
                x1="140"
                y1={yLine}
                x2="280"
                y2={yLine}
                stroke="#787670"
                strokeWidth="1"
                strokeDasharray="4 2"
              />
            ))}
            <rect x="158" y="61" width="104" height="32" rx="3" fill="#FFFFFF" stroke="none" />
            <text
              x="210"
              y="75"
              textAnchor="middle"
              stroke="none"
              className="fill-[#111111] text-[9.5px] font-mono font-bold"
            >
              10 TB/s NV-HBI
            </text>
            <text
              x="210"
              y="87"
              textAnchor="middle"
              stroke="none"
              className="fill-[#15803D] text-[7.5px] font-mono font-semibold uppercase"
            >
              ZERO-LATENCY COHERENT BUS
            </text>

            {/* Dual Reticle Die B */}
            <rect
              x="280"
              y="24"
              width="124"
              height="106"
              rx="5"
              fill="#FFFFFF"
              stroke="#111111"
              strokeWidth="1.6"
            />
            <rect x="288" y="32" width="108" height="16" rx="2" fill="#111111" stroke="none" />
            <text
              x="342"
              y="43"
              textAnchor="middle"
              stroke="none"
              className="fill-white text-[8px] font-mono font-semibold uppercase"
            >
              DIE 02 · 104B TRANSISTORS
            </text>
            <rect
              x="290"
              y="56"
              width="48"
              height="32"
              rx="2"
              fill="#F7F6F2"
              stroke="#4A4945"
              strokeWidth="1"
            />
            <text
              x="314"
              y="75"
              textAnchor="middle"
              stroke="none"
              className="fill-[#111111] text-[8px] font-mono font-semibold"
            >
              FP4 Core
            </text>
            <rect
              x="346"
              y="56"
              width="48"
              height="32"
              rx="2"
              fill="#F7F6F2"
              stroke="#4A4945"
              strokeWidth="1"
            />
            <text
              x="370"
              y="75"
              textAnchor="middle"
              stroke="none"
              className="fill-[#111111] text-[8px] font-mono font-semibold"
            >
              HBM3e 4TB/s
            </text>
            <text
              x="342"
              y="112"
              textAnchor="middle"
              stroke="none"
              className="fill-[#4A4945] text-[8.5px] font-mono"
            >
              Unified 192GB Address Space
            </text>
          </svg>
        );

      default:
        return (
          <svg viewBox="0 0 420 155" className="w-full h-36 stroke-[#111111] fill-none">
            {/* Closed-Loop Control & Verification Schematic */}
            <rect
              x="24"
              y="46"
              width="104"
              height="62"
              rx="5"
              fill="#FFFFFF"
              stroke="#111111"
              strokeWidth="1.6"
            />
            <text
              x="76"
              y="72"
              textAnchor="middle"
              stroke="none"
              className="fill-[#111111] text-[9.5px] font-mono font-bold"
            >
              POLICY π_θ(y|x)
            </text>
            <text
              x="76"
              y="88"
              textAnchor="middle"
              stroke="none"
              className="fill-[#787670] text-[8px] font-mono"
            >
              Candidate Generation
            </text>

            <path d="M 128 65 L 168 65" stroke="#111111" strokeWidth="1.6" />

            <rect
              x="168"
              y="32"
              width="108"
              height="90"
              rx="5"
              fill="#FAF9F6"
              stroke="#111111"
              strokeWidth="1.6"
            />
            <text
              x="222"
              y="56"
              textAnchor="middle"
              stroke="none"
              className="fill-[#111111] text-[9px] font-mono font-bold uppercase"
            >
              EVALUATOR R(x,y)
            </text>
            <text
              x="222"
              y="76"
              textAnchor="middle"
              stroke="none"
              className="fill-[#4A4945] text-[8.5px] font-mono"
            >
              max E[R] − β·D_KL
            </text>
            <rect x="180" y="90" width="84" height="18" rx="2.5" fill="#DCFCE7" stroke="none" />
            <text
              x="222"
              y="102"
              textAnchor="middle"
              stroke="none"
              className="fill-[#166534] text-[8px] font-mono font-semibold"
            >
              VERIFIED INVARIANT
            </text>

            <path d="M 276 65 L 312 65" stroke="#111111" strokeWidth="1.6" />

            <rect
              x="312"
              y="46"
              width="86"
              height="62"
              rx="5"
              fill="#141413"
              stroke="#111111"
              strokeWidth="1.5"
            />
            <text
              x="355"
              y="74"
              textAnchor="middle"
              stroke="none"
              className="fill-white text-[9.5px] font-mono font-bold"
            >
              ALIGNED STATE
            </text>
            <text
              x="355"
              y="90"
              textAnchor="middle"
              stroke="none"
              className="fill-[#A09E97] text-[8px] font-mono"
            >
              Zero Drift
            </text>

            {/* Feedback Loop Return Path */}
            <path
              d="M 222 122 L 222 140 L 76 140 L 76 108"
              stroke="#4A4945"
              strokeWidth="1.3"
              strokeDasharray="4 3"
            />
            <text
              x="149"
              y="135"
              textAnchor="middle"
              stroke="none"
              className="fill-[#4A4945] text-[8px] font-mono"
            >
              KL-Divergence Penalty Feedback (−β·D_KL)
            </text>
          </svg>
        );
    }
  };

  return (
    <div className="rounded-lg border border-[#E2E0D8] bg-white flex flex-col justify-between overflow-hidden print-break-inside-avoid shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
      <div>
        <div className="px-5 py-3.5 border-b border-[#E2E0D8] bg-[#FAF9F6] flex items-center justify-between gap-2">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#787670] block">
              SCHEMATIC 0{index + 1} · {model.concept}
            </span>
            <h4 className="text-[15.5px] font-semibold text-[#111111] tracking-tight mt-0.5">
              {model.title}
            </h4>
          </div>
          <span className="px-2 py-0.5 rounded bg-[#EFECE6] text-[#111111] font-mono text-[9.5px] uppercase tracking-wider font-semibold shrink-0">
            MENTAL MODEL
          </span>
        </div>

        <div className="p-5 space-y-4">
          {/* Technical Blueprint Schematic Box */}
          <div
            className="rounded-md bg-[#F7F6F2] border border-[#E2E0D8] p-3 flex items-center justify-center"
            style={{
              backgroundImage: 'radial-gradient(#D5D3CA 0.8px, transparent 0.8px)',
              backgroundSize: '12px 12px',
            }}
          >
            {renderIllustrationSvg()}
          </div>

          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#787670] font-semibold block mb-1">
              First-Principles Intuition
            </span>
            <p className="text-[13.5px] text-[#111111] leading-relaxed">{model.metaphor}</p>
          </div>

          <blockquote className="pl-3.5 py-2 pr-3 bg-[#FAF9F6] border-l-2 border-[#111111] text-[13px] text-[#4A4945] font-serif italic leading-relaxed">
            "{model.keyInsightQuote}"
          </blockquote>
        </div>
      </div>

      <div className="px-5 py-3.5 bg-[#FAF9F6] border-t border-[#E2E0D8] text-[12px] text-[#4A4945] leading-relaxed">
        <span className="font-mono text-[10px] uppercase tracking-wider text-[#111111] font-semibold mr-1.5">
          Operational Rule:
        </span>
        <span className="text-[#111111]">{model.practicalApplication}</span>
      </div>
    </div>
  );
};
