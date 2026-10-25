import React from 'react';
import { SynthesizedDocument } from '../types/video';

interface ForensicMatrixProps {
  document: SynthesizedDocument;
}

export const ForensicMatrix: React.FC<ForensicMatrixProps> = ({ document }) => {
  const { forensicMasterMatrix, cognitiveArchitectureAudit, meta } = document;

  return (
    <div className="space-y-8">
      {/* Top Banner: Zero-Loss Audit Certificate */}
      <div className="p-8 rounded-3xl bg-white border-2 border-[#111111] shadow-[0_4px_20px_rgba(0,0,0,0.04)] print-break-inside-avoid">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#111111] text-white flex items-center justify-center shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-[24px]">verified</span>
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-xl font-semibold text-[#111111] tracking-tight">
                  Forensic Zero-Watch Audit Certificate
                </h3>
                <span className="px-3 py-0.5 rounded-full text-[12px] font-mono font-semibold bg-[#DCFCE7] text-[#166534] border border-[#BBF7D0]">
                  {meta.zeroLossFidelityIndex}% Fidelity
                </span>
              </div>
              <p className="text-[14px] text-[#575754] mt-1 max-w-2xl leading-relaxed">
                Deterministic cross-verification against all {meta.videoLengthMinutes} minutes of video. Every equation, benchmark, trade-off, and architectural state transition has been verified.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-5 bg-[#F9F9F8] px-5 py-3 rounded-2xl border border-[#E8E8E6] self-stretch sm:self-auto justify-around">
            <div className="text-center sm:text-right">
              <span className="text-[11px] uppercase font-semibold text-[#8C8C89] tracking-wider">Compression</span>
              <p className="text-lg font-bold text-[#111111] font-mono">
                {meta.compressionRatio}% <span className="text-[12px] text-[#575754] font-normal">Reclaimed</span>
              </p>
            </div>
            <div className="h-9 w-px bg-[#E8E8E6]" />
            <div className="text-center sm:text-right">
              <span className="text-[11px] uppercase font-semibold text-[#8C8C89] tracking-wider">Reading Time</span>
              <p className="text-lg font-bold text-[#111111] font-mono">
                {meta.readingTimeMinutes} min <span className="text-[12px] text-[#575754] font-normal">vs {meta.videoLengthMinutes}m</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Cognitive Signal vs Noise Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print-break-inside-avoid">
        {/* Discarded Noise */}
        <div className="p-7 rounded-3xl bg-white border border-[#E8E8E6] shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-2 pb-4 mb-4 border-b border-[#E8E8E6]">
            <span className="material-symbols-outlined text-[#8C8C89] text-[20px]">filter_alt_off</span>
            <h4 className="text-[15px] font-semibold text-[#111111] tracking-tight">
              Shannon Entropy Noise Discarded
            </h4>
          </div>
          <div className="space-y-3">
            {cognitiveArchitectureAudit.discardedNoiseCategories.map((item, idx) => (
              <div key={`noise-${idx}`} className="p-4 rounded-2xl bg-[#F9F9F8] border border-[#E8E8E6] text-[13px]">
                <div className="flex items-center justify-between text-[#111111] font-medium mb-1">
                  <span>{item.category}</span>
                  <span className="text-[#8C8C89] font-mono">{item.percentDiscarded}% Filtered</span>
                </div>
                <p className="text-[#575754] text-[12px] leading-relaxed">{item.reason}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Preserved Knowledge Vectors */}
        <div className="p-7 rounded-3xl bg-white border border-[#E8E8E6] shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-2 pb-4 mb-4 border-b border-[#E8E8E6]">
            <span className="material-symbols-outlined text-[#111111] text-[20px]">layers</span>
            <h4 className="text-[15px] font-semibold text-[#111111] tracking-tight">
              Preserved High-Entropy Vectors
            </h4>
          </div>
          <div className="space-y-3">
            {cognitiveArchitectureAudit.preservedKnowledgeVectors.map((item, idx) => (
              <div key={`vec-${idx}`} className="p-4 rounded-2xl bg-[#F9F9F8] border border-[#E8E8E6] text-[13px]">
                <div className="flex items-center justify-between text-[#111111] font-medium mb-1">
                  <span>{item.category}</span>
                  <span className="text-emerald-700 font-mono font-medium">{item.count} Retained</span>
                </div>
                <p className="text-[#575754] text-[12px] leading-relaxed">{item.importanceRationale}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Core Theorems & Formulas Table */}
      {forensicMasterMatrix.coreTheoremsAndFormulas && forensicMasterMatrix.coreTheoremsAndFormulas.length > 0 && (
        <div className="rounded-3xl border border-[#E8E8E6] bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.02)] print-break-inside-avoid">
          <div className="flex items-center gap-2 pb-4 mb-5 border-b border-[#E8E8E6]">
            <span className="material-symbols-outlined text-[#111111] text-[20px]">functions</span>
            <h4 className="text-[17px] font-semibold text-[#111111] tracking-tight">
              Core Theorems, Laws & Mathematical Formulations
            </h4>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px] border-collapse">
              <thead>
                <tr className="border-b border-[#E8E8E6] text-[#8C8C89] font-mono text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-3">Theorem / Law</th>
                  <th className="py-3 px-3">Mathematical Formulation</th>
                  <th className="py-3 px-3">Strategic Implication</th>
                  <th className="py-3 px-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E8E6]">
                {forensicMasterMatrix.coreTheoremsAndFormulas.map((item, idx) => (
                  <tr key={`theorem-${idx}`} className="hover:bg-[#F9F9F8] transition">
                    <td className="py-3.5 px-3 font-semibold text-[#111111]">{item.name}</td>
                    <td className="py-3.5 px-3 font-mono text-[#111111] bg-[#F4F4F2] rounded-lg">
                      {item.formulaOrLaw}
                    </td>
                    <td className="py-3.5 px-3 text-[#575754] leading-relaxed">{item.implications}</td>
                    <td className="py-3.5 px-3 font-mono text-[#8C8C89]">[{item.timestamp}]</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Trade-off Analysis Grid */}
      {forensicMasterMatrix.tradeoffAnalysis && forensicMasterMatrix.tradeoffAnalysis.length > 0 && (
        <div className="rounded-3xl border border-[#E8E8E6] bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.02)] print-break-inside-avoid">
          <div className="flex items-center gap-2 pb-4 mb-5 border-b border-[#E8E8E6]">
            <span className="material-symbols-outlined text-[#111111] text-[20px]">balance</span>
            <h4 className="text-[17px] font-semibold text-[#111111] tracking-tight">
              Dialectic Trade-Off Decisions
            </h4>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {forensicMasterMatrix.tradeoffAnalysis.map((tradeoff, idx) => (
              <div key={`tradeoff-${idx}`} className="p-5 rounded-2xl bg-[#F9F9F8] border border-[#E8E8E6] text-[13px]">
                <span className="font-semibold text-[#111111] text-[15px]">{tradeoff.dimension}</span>
                <div className="grid grid-cols-2 gap-3 my-3">
                  <div className="p-3 rounded-xl bg-white border border-[#E8E8E6]">
                    <span className="text-[10px] uppercase font-semibold text-[#8C8C89] block mb-0.5">Option A</span>
                    <span className="text-[#111111] font-medium">{tradeoff.optionA}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white border border-[#E8E8E6]">
                    <span className="text-[10px] uppercase font-semibold text-[#8C8C89] block mb-0.5">Option B</span>
                    <span className="text-[#111111] font-medium">{tradeoff.optionB}</span>
                  </div>
                </div>
                <p className="text-[#575754] leading-relaxed bg-[#F4F4F2] p-3 rounded-xl border border-[#E8E8E6]">
                  <strong className="text-[#111111]">Deterministic Resolution: </strong>
                  {tradeoff.winnerOrContext}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Zero-Watch Verification Checklist */}
      {forensicMasterMatrix.zeroWatchChecklist && forensicMasterMatrix.zeroWatchChecklist.length > 0 && (
        <div className="rounded-3xl border border-[#E8E8E6] bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.02)] print-break-inside-avoid">
          <div className="flex items-center gap-2 pb-4 mb-5 border-b border-[#E8E8E6]">
            <span className="material-symbols-outlined text-emerald-600 text-[22px]">check_circle</span>
            <h4 className="text-[17px] font-semibold text-[#111111] tracking-tight">
              Zero-Watch Completeness Checklist
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {forensicMasterMatrix.zeroWatchChecklist.map((item, idx) => (
              <div
                key={`check-${idx}`}
                className="p-4 rounded-2xl bg-[#F9F9F8] border border-[#E8E8E6] flex items-start gap-3 text-[13px]"
              >
                <span className="material-symbols-outlined text-emerald-600 text-[20px] shrink-0 mt-0.5">
                  done_all
                </span>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-[#111111]">{item.item}</span>
                    <span className="font-mono text-[11px] text-[#575754] bg-[#E8E8E6] px-2 py-0.5 rounded-full">
                      [{item.originalVideoTimestamp}]
                    </span>
                  </div>
                  <p className="text-[#575754] text-[12px] mt-1 leading-relaxed">{item.exactDetail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
