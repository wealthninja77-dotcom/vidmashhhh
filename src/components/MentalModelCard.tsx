import React from 'react';
import { IllustrationMentalModel } from '../types/video';

interface MentalModelCardProps {
  model: IllustrationMentalModel;
}

export const MentalModelCard: React.FC<MentalModelCardProps> = ({ model }) => {
  const renderIllustrationSvg = () => {
    switch (model.svgConceptType) {
      case 'neural_transformer':
        return (
          <svg viewBox="0 0 200 120" className="w-full h-28 stroke-[#111111] fill-none">
            <rect x="20" y="20" width="40" height="80" rx="8" className="fill-white stroke-[#111111]" strokeWidth="1.5" />
            <text x="40" y="65" textAnchor="middle" className="fill-[#111111] text-[10px] font-mono">Input</text>
            
            <path d="M 60 40 C 90 40, 90 30, 120 30" stroke="#575754" strokeWidth="1.5" strokeDasharray="3 3" />
            <path d="M 60 60 C 90 60, 90 60, 120 60" stroke="#111111" strokeWidth="2" />
            <path d="M 60 80 C 90 80, 90 90, 120 90" stroke="#8C8C89" strokeWidth="1.5" strokeDasharray="3 3" />

            <circle cx="90" cy="60" r="14" className="fill-[#F4F4F2] stroke-[#111111]" strokeWidth="1.5" />
            <text x="90" y="64" textAnchor="middle" className="fill-[#111111] text-[9px] font-bold">QK^T</text>

            <rect x="120" y="20" width="45" height="80" rx="8" className="fill-white stroke-[#111111]" strokeWidth="1.5" />
            <text x="142" y="65" textAnchor="middle" className="fill-[#111111] text-[10px] font-mono">Softmax</text>
          </svg>
        );

      case 'hardware_bandwidth':
        return (
          <svg viewBox="0 0 200 120" className="w-full h-28 stroke-[#111111] fill-none">
            <path d="M 15 25 L 85 45 L 85 75 L 15 95 Z" className="fill-white stroke-[#111111]" strokeWidth="1.5" />
            <text x="45" y="65" textAnchor="middle" className="fill-[#111111] text-[9px] font-mono">Wide Compute</text>
            
            <rect x="85" y="50" width="40" height="20" className="fill-[#F4F4F2] stroke-[#111111]" strokeWidth="2" />
            <text x="105" y="63" textAnchor="middle" className="fill-[#111111] text-[8px] font-bold">Choke</text>

            <path d="M 125 45 L 185 25 L 185 95 L 125 75 Z" className="fill-white stroke-[#111111]" strokeWidth="1.5" />
            <text x="155" y="65" textAnchor="middle" className="fill-[#111111] text-[9px] font-mono">Outflow</text>
          </svg>
        );

      case 'feedback_loop':
      default:
        return (
          <svg viewBox="0 0 200 120" className="w-full h-28 stroke-[#111111] fill-none">
            <circle cx="100" cy="60" r="38" stroke="#111111" strokeWidth="1.5" strokeDasharray="5 3" />
            <circle cx="100" cy="22" r="12" className="fill-white stroke-[#111111]" strokeWidth="1.5" />
            <text x="100" y="26" textAnchor="middle" className="fill-[#111111] text-[8px] font-bold">Act</text>

            <circle cx="138" cy="60" r="12" className="fill-white stroke-[#111111]" strokeWidth="1.5" />
            <text x="138" y="64" textAnchor="middle" className="fill-[#111111] text-[8px] font-bold">Sense</text>

            <circle cx="62" cy="60" r="12" className="fill-white stroke-[#111111]" strokeWidth="1.5" />
            <text x="62" y="64" textAnchor="middle" className="fill-[#111111] text-[8px] font-bold">Align</text>
          </svg>
        );
    }
  };

  return (
    <div className="rounded-3xl border border-[#E8E8E6] bg-white p-6 sm:p-7 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between print-break-inside-avoid">
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-full bg-[#F4F4F2] text-[#111111] flex items-center justify-center">
            <span className="material-symbols-outlined text-[18px]">lightbulb</span>
          </div>
          <h4 className="text-[16px] font-semibold text-[#111111] tracking-tight">{model.title}</h4>
        </div>

        {/* Vector Schematic Container */}
        <div className="rounded-2xl bg-[#F9F9F8] border border-[#E8E8E6] p-4 mb-4 flex items-center justify-center">
          {renderIllustrationSvg()}
        </div>

        {/* Metaphor */}
        <div className="mb-3.5">
          <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#8C8C89]">
            Cognitive Metaphor:
          </span>
          <p className="text-[14px] text-[#2D2D2A] font-medium mt-1 leading-relaxed">{model.metaphor}</p>
        </div>

        {/* Quote */}
        <div className="p-4 rounded-2xl bg-[#F9F9F8] border border-[#E8E8E6] text-[13px] text-[#575754] mb-4 flex items-start gap-2.5">
          <span className="material-symbols-outlined text-[#8C8C89] text-[17px] shrink-0 mt-0.5">
            format_quote
          </span>
          <p className="italic leading-relaxed">"{model.keyInsightQuote}"</p>
        </div>
      </div>

      {/* Practical application */}
      <div className="pt-3.5 border-t border-[#E8E8E6] flex items-start gap-2.5 text-[13px] text-[#575754]">
        <span className="material-symbols-outlined text-[#111111] text-[18px] shrink-0 mt-0.5">
          check
        </span>
        <div>
          <strong className="text-[#111111]">Action Rule: </strong>
          <span>{model.practicalApplication}</span>
        </div>
      </div>
    </div>
  );
};
