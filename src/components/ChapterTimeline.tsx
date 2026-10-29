import React, { useState } from 'react';
import { ChronologicalChapter } from '../types/video';

interface ChapterTimelineProps {
  chapters: ChronologicalChapter[];
  onSeekTimestamp?: (seconds: number, timestampLabel?: string) => void;
}

export const ChapterTimeline: React.FC<ChapterTimelineProps> = ({
  chapters,
  onSeekTimestamp,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedImportance, setSelectedImportance] = useState<number | 'all'>('all');

  const filteredChapters = chapters.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.denseSummary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.technicalNuances.some((n) => n.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesImportance =
      selectedImportance === 'all' || c.importanceScore >= selectedImportance;

    return matchesSearch && matchesImportance;
  });

  return (
    <div className="space-y-4">
      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-lg bg-white border border-[#E2E0D8] no-print">
        <div className="relative flex-1">
          <span className="material-symbols-outlined text-[#787670] text-[18px] absolute left-3 top-1/2 -translate-y-1/2">
            search
          </span>
          <input
            type="text"
            placeholder="Filter chapters by concept, theorem, or verbatim quote..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded bg-[#F7F6F2] border border-[#E2E0D8] text-[13px] text-[#111111] placeholder:text-[#787670] focus:outline-none focus:border-[#111111] transition"
          />
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto text-[12px] font-mono">
          <button
            type="button"
            onClick={() => setSelectedImportance('all')}
            className={`px-2.5 py-1 rounded text-[11px] uppercase tracking-wider transition cursor-pointer ${
              selectedImportance === 'all'
                ? 'bg-[#111111] text-white font-semibold'
                : 'bg-[#EFECE6] text-[#4A4945] hover:text-[#111111]'
            }`}
          >
            All ({chapters.length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedImportance(9)}
            className={`px-2.5 py-1 rounded text-[11px] uppercase tracking-wider transition cursor-pointer ${
              selectedImportance === 9
                ? 'bg-[#111111] text-white font-semibold'
                : 'bg-[#EFECE6] text-[#4A4945] hover:text-[#111111]'
            }`}
          >
            Critical Salience (9–10)
          </button>
        </div>
      </div>

      {/* Chronological Ledger */}
      <div className="divide-y divide-[#E2E0D8] rounded-lg border border-[#E2E0D8] bg-white overflow-hidden">
        {filteredChapters.map((chapter, idx) => (
          <article
            key={chapter.id}
            id={`chapter-${chapter.id}`}
            className="p-5 sm:p-6 hover:bg-[#FAF9F6]/60 transition print-break-inside-avoid"
          >
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pb-3 border-b border-[#EBE9E2]">
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="text-[11px] font-mono font-semibold text-[#787670] tabular-nums">
                  §0{idx + 1}
                </span>
                <button
                  type="button"
                  onClick={() => onSeekTimestamp?.(chapter.seconds, chapter.timestamp)}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#EFECE6] hover:bg-[#111111] text-[#111111] hover:text-white transition text-[11.5px] font-mono tabular-nums font-medium cursor-pointer"
                  title="Seek video to this timestamp"
                >
                  <span>[{chapter.timestamp}]</span>
                </button>
                <h3 className="text-[17px] font-semibold text-[#111111] tracking-tight">
                  {chapter.title}
                </h3>
              </div>

              <div className="flex items-center gap-2 shrink-0 text-[11px] font-mono tabular-nums">
                <span className="uppercase tracking-wider text-[#787670]">Salience</span>
                <span
                  className={`px-1.5 py-0.5 rounded font-semibold ${
                    chapter.importanceScore >= 9
                      ? 'bg-[#111111] text-white'
                      : 'bg-[#EFECE6] text-[#111111]'
                  }`}
                >
                  {chapter.importanceScore}/10
                </span>
              </div>
            </div>

            {/* Dense Exposition */}
            <p className="text-[14.5px] text-[#1E1E1C] mt-3.5 leading-[1.68] font-normal">
              {chapter.denseSummary}
            </p>

            {/* Verbatim Critical Quotes */}
            {chapter.verbatimCriticalQuotes && chapter.verbatimCriticalQuotes.length > 0 && (
              <div className="mt-4 space-y-2">
                {chapter.verbatimCriticalQuotes.map((q, qIdx) => (
                  <blockquote
                    key={`quote-${qIdx}`}
                    className="pl-3.5 py-2 pr-4 bg-[#F7F6F2] border-l-2 border-[#111111] rounded-r text-[13px]"
                  >
                    <p className="text-[#111111] font-serif italic text-[14.5px] leading-relaxed">
                      "{q.quote}"
                    </p>
                    <footer className="text-[11px] font-mono text-[#4A4945] mt-1">
                      — <strong className="text-[#111111]">{q.speaker}</strong> · {q.significance}
                    </footer>
                  </blockquote>
                ))}
              </div>
            )}

            {/* Technical Nuances (Zero-Pill Monospace Separation) */}
            {chapter.technicalNuances && chapter.technicalNuances.length > 0 && (
              <div className="mt-4 pt-3 border-t border-[#EBE9E2] flex flex-wrap items-center gap-y-1.5 gap-x-3 text-[11.5px] font-mono text-[#4A4945]">
                <span className="uppercase tracking-wider text-[#787670] text-[10px] font-semibold">
                  Technical Vectors:
                </span>
                {chapter.technicalNuances.map((nuance, nIdx) => (
                  <React.Fragment key={`nuance-${nIdx}`}>
                    {nIdx > 0 && <span className="text-[#D5D3CA]">·</span>}
                    <span className="text-[#111111]">{nuance}</span>
                  </React.Fragment>
                ))}
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
};
