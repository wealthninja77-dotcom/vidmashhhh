import React from 'react';
import { SynthesizedDocument } from '../types/video';

interface ForensicMatrixProps {
  document: SynthesizedDocument;
  onSeekTimestamp?: (timestampStr: string) => void;
}

export const ForensicMatrix: React.FC<ForensicMatrixProps> = ({
  document,
  onSeekTimestamp,
}) => {
  const { forensicMasterMatrix, cognitiveArchitectureAudit } = document;

  return (
    <div className="space-y-6">
      {/* Core Theorems, Laws & Mathematical Formulations */}
      {forensicMasterMatrix.coreTheoremsAndFormulas &&
        forensicMasterMatrix.coreTheoremsAndFormulas.length > 0 && (
          <div className="rounded-lg border border-[#E2E0D8] bg-white overflow-hidden print-break-inside-avoid">
            <div className="px-5 py-3.5 border-b border-[#E2E0D8] bg-[#FAF9F6] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#787670] block">
                  FORMAL SPECIFICATIONS & LAWS
                </span>
                <h4 className="text-[16px] font-semibold text-[#111111] tracking-tight">
                  Core Theorems & Mathematical Formulations
                </h4>
              </div>
              <span className="text-[11px] font-mono tabular-nums text-[#787670]">
                {forensicMasterMatrix.coreTheoremsAndFormulas.length} FORMULATIONS
              </span>
            </div>

            <div className="divide-y divide-[#E2E0D8]">
              {forensicMasterMatrix.coreTheoremsAndFormulas.map((item, idx) => (
                <div
                  key={`theorem-${idx}`}
                  className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-4 items-start"
                >
                  <div className="lg:col-span-4">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-[#787670] tabular-nums">
                        LAW 0{idx + 1}
                      </span>
                      {item.timestamp && (
                        <button
                          type="button"
                          onClick={() => onSeekTimestamp?.(item.timestamp)}
                          className="px-1.5 py-0.5 rounded bg-[#EFECE6] hover:bg-[#111111] text-[#111111] hover:text-white font-mono text-[11px] tabular-nums transition cursor-pointer"
                        >
                          [{item.timestamp}]
                        </button>
                      )}
                    </div>
                    <h5 className="text-[15px] font-semibold text-[#111111] mt-1">
                      {item.name}
                    </h5>
                  </div>

                  <div className="lg:col-span-8 space-y-2.5">
                    <div className="px-4 py-3 rounded bg-[#141413] text-[#F7F6F2] font-mono text-[13px] overflow-x-auto border border-[#2C2B29]">
                      <code>{item.formulaOrLaw}</code>
                    </div>
                    <p className="text-[13.5px] text-[#4A4945] leading-relaxed">
                      <strong className="text-[#111111] font-medium">System Implication: </strong>
                      {item.implications}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      {/* Dialectic Trade-Off Matrix */}
      {forensicMasterMatrix.tradeoffAnalysis &&
        forensicMasterMatrix.tradeoffAnalysis.length > 0 && (
          <div className="rounded-lg border border-[#E2E0D8] bg-white overflow-hidden print-break-inside-avoid">
            <div className="px-5 py-3.5 border-b border-[#E2E0D8] bg-[#FAF9F6]">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#787670] block">
                ARCHITECTURAL DECISIONS
              </span>
              <h4 className="text-[16px] font-semibold text-[#111111] tracking-tight">
                Engineering Trade-Off Matrix
              </h4>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px] border-collapse">
                <thead>
                  <tr className="border-b border-[#E2E0D8] bg-[#F7F6F2] text-[#787670] font-mono text-[10.5px] uppercase tracking-wider">
                    <th className="py-2.5 px-4">Decision Dimension</th>
                    <th className="py-2.5 px-4">Approach A</th>
                    <th className="py-2.5 px-4">Approach B</th>
                    <th className="py-2.5 px-4">Empirical Verdict</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E0D8]">
                  {forensicMasterMatrix.tradeoffAnalysis.map((tradeoff, idx) => (
                    <tr key={`tradeoff-${idx}`} className="hover:bg-[#FAF9F6]">
                      <td className="py-3.5 px-4 font-semibold text-[#111111]">
                        {tradeoff.dimension}
                      </td>
                      <td className="py-3.5 px-4 text-[#4A4945]">{tradeoff.optionA}</td>
                      <td className="py-3.5 px-4 text-[#4A4945]">{tradeoff.optionB}</td>
                      <td className="py-3.5 px-4 font-medium text-[#111111]">
                        {tradeoff.winnerOrContext}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      {/* Zero-Watch Verification Audit & Signal vs Noise */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 print-break-inside-avoid">
        {/* Zero-Watch Checklist */}
        <div className="lg:col-span-7 rounded-lg border border-[#E2E0D8] bg-white overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[#E2E0D8] bg-[#FAF9F6] flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#787670] block">
                AGENT 04 AUDITOR LEDGER
              </span>
              <h4 className="text-[15px] font-semibold text-[#111111] tracking-tight">
                Zero-Watch Completeness Verification
              </h4>
            </div>
            <span className="text-[11px] font-mono text-[#15803D] font-semibold">
              100% VERIFIED
            </span>
          </div>

          <div className="divide-y divide-[#E2E0D8]">
            {forensicMasterMatrix.zeroWatchChecklist.map((item, idx) => (
              <div key={`check-${idx}`} className="p-4 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-[#15803D] font-bold">✓</span>
                    <span className="font-semibold text-[13.5px] text-[#111111]">
                      {item.item}
                    </span>
                  </div>
                  <p className="text-[12.5px] text-[#4A4945] pl-4 leading-relaxed">
                    {item.exactDetail}
                  </p>
                </div>
                {item.originalVideoTimestamp && (
                  <button
                    type="button"
                    onClick={() => onSeekTimestamp?.(item.originalVideoTimestamp)}
                    className="px-2 py-0.5 rounded bg-[#EFECE6] hover:bg-[#111111] text-[#111111] hover:text-white font-mono text-[11px] tabular-nums shrink-0 transition cursor-pointer"
                  >
                    [{item.originalVideoTimestamp}]
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Signal vs. Conversational Noise Ledger */}
        <div className="lg:col-span-5 rounded-lg border border-[#E2E0D8] bg-white overflow-hidden flex flex-col justify-between">
          <div>
            <div className="px-5 py-3.5 border-b border-[#E2E0D8] bg-[#FAF9F6]">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#787670] block">
                SHANNON ENTROPY FILTER
              </span>
              <h4 className="text-[15px] font-semibold text-[#111111] tracking-tight">
                Signal Retention vs. Discarded Noise
              </h4>
            </div>

            <div className="p-4 space-y-3">
              {cognitiveArchitectureAudit.preservedKnowledgeVectors.map((vec, idx) => (
                <div
                  key={`vec-${idx}`}
                  className="p-3 rounded bg-[#F7F6F2] border border-[#E2E0D8] text-[12.5px]"
                >
                  <div className="flex items-center justify-between font-medium text-[#111111]">
                    <span>{vec.category}</span>
                    <span className="font-mono text-[11px] tabular-nums text-[#15803D] font-semibold">
                      {vec.count} Preserved
                    </span>
                  </div>
                  <p className="text-[11.5px] text-[#4A4945] mt-1">{vec.importanceRationale}</p>
                </div>
              ))}

              {cognitiveArchitectureAudit.discardedNoiseCategories.map((noise, idx) => (
                <div
                  key={`noise-${idx}`}
                  className="p-3 rounded bg-white border border-[#E2E0D8] text-[12.5px]"
                >
                  <div className="flex items-center justify-between font-medium text-[#4A4945]">
                    <span>{noise.category}</span>
                    <span className="font-mono text-[11px] tabular-nums text-[#787670]">
                      −{noise.percentDiscarded}% Stripped
                    </span>
                  </div>
                  <p className="text-[11.5px] text-[#787670] mt-1">{noise.reason}</p>
                </div>
              ))}
            </div>
          </div>

          {cognitiveArchitectureAudit.epistemicUncertaintyNotes?.length > 0 && (
            <div className="px-4 py-3 bg-[#FAF9F6] border-t border-[#E2E0D8] text-[11.5px] font-mono text-[#4A4945]">
              {cognitiveArchitectureAudit.epistemicUncertaintyNotes[0]}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
