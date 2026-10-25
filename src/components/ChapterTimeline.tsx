import React, { useState } from 'react';
import { ChronologicalChapter } from '../types/video';

interface ChapterTimelineProps {
  chapters: ChronologicalChapter[];
  onSeekTimestamp?: (seconds: number) => void;
}

export const ChapterTimeline: React.FC<ChapterTimelineProps> = ({ chapters, onSeekTimestamp }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedImportance, setSelectedImportance] = useState<number | 'all'>('all');

  const filteredChapters = chapters.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.denseSummary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.technicalNuances.some((n) => n.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesImportance = selectedImportance === 'all' || c.importanceScore >= selectedImportance;

    return matchesSearch && matchesImportance;
  });

  return (
    <div className="space-y-6">
      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-3xl bg-white border border-[#E8E8E6] shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
        <div className="relative flex-1">
          <span className="material-symbols-outlined text-[#8C8C89] text-[20px] absolute left-3.5 top-1/2 -translate-y-1/2">
            search
          </span>
          <input
            type="text"
            placeholder="Search verified chapters, formulas, or verbatim quotes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-full bg-[#F9F9F8] border border-[#E8E8E6] text-[13px] text-[#111111] placeholder:text-[#8C8C89] focus:outline-none focus:border-neutral-400 transition"
          />
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto text-xs">
          <span className="text-[#8C8C89] font-medium mr-1">Filter:</span>
          <button
            type="button"
            onClick={() => setSelectedImportance('all')}
            className={`px-3 py-1.5 rounded-full font-medium text-[12px] transition ${
              selectedImportance === 'all'
                ? 'bg-[#111111] text-white'
                : 'bg-[#F4F4F2] text-[#575754] hover:text-[#111111]'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setSelectedImportance(9)}
            className={`px-3 py-1.5 rounded-full font-medium text-[12px] transition flex items-center gap-1 ${
              selectedImportance === 9
                ? 'bg-[#111111] text-white'
                : 'bg-[#F4F4F2] text-[#575754] hover:text-[#111111]'
            }`}
          >
            <span className="material-symbols-outlined text-[15px] text-amber-500">star</span>
            <span>High Stakes (9-10)</span>
          </button>
        </div>
      </div>

      {/* Chapters list */}
      <div className="relative border-l-2 border-[#E8E8E6] ml-4 sm:ml-6 space-y-7 pb-4">
        {filteredChapters.map((chapter) => (
          <div key={chapter.id} className="relative pl-6 sm:pl-8 group">
            {/* Timeline bullet */}
            <div
              className={`absolute -left-[9px] top-2 w-4 h-4 rounded-full border-2 transition-all ${
                chapter.importanceScore >= 9
                  ? 'bg-[#111111] border-white ring-4 ring-neutral-200'
                  : 'bg-[#8C8C89] border-white ring-4 ring-neutral-100'
              }`}
            />

            {/* Chapter card */}
            <div className="p-6 sm:p-7 rounded-3xl bg-white border border-[#E8E8E6] shadow-[0_2px_8px_rgba(0,0,0,0.02)] print-break-inside-avoid">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3.5 border-b border-[#E8E8E6]">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => onSeekTimestamp && onSeekTimestamp(chapter.seconds)}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F4F4F2] text-[#111111] border border-[#E8E8E6] hover:bg-[#E8E8E6] transition text-[12px] font-mono font-medium"
                    title="Jump to video timestamp"
                  >
                    <span className="material-symbols-outlined text-[15px]">schedule</span>
                    <span>{chapter.timestamp}</span>
                  </button>

                  <h3 className="text-[17px] font-semibold text-[#111111] tracking-tight">{chapter.title}</h3>
                </div>

                <div className="flex items-center gap-1.5 self-start sm:self-auto">
                  <span
                    className={`px-3 py-0.5 rounded-full text-[11px] font-mono font-medium border ${
                      chapter.importanceScore >= 9
                        ? 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]'
                        : 'bg-[#F4F4F2] text-[#575754] border-[#E8E8E6]'
                    }`}
                  >
                    Salience: {chapter.importanceScore}/10
                  </span>
                </div>
              </div>

              {/* Summary */}
              <p className="text-[14px] text-[#2D2D2A] mt-4 leading-relaxed font-normal">
                {chapter.denseSummary}
              </p>

              {/* Verbatim Quotes */}
              {chapter.verbatimCriticalQuotes && chapter.verbatimCriticalQuotes.length > 0 && (
                <div className="mt-4 space-y-2.5">
                  {chapter.verbatimCriticalQuotes.map((q, qIdx) => (
                    <div
                      key={`quote-${qIdx}`}
                      className="p-4 rounded-2xl bg-[#F9F9F8] border border-[#E8E8E6] text-[13px] flex items-start gap-3"
                    >
                      <span className="material-symbols-outlined text-[#8C8C89] text-[18px] shrink-0 mt-0.5">
                        format_quote
                      </span>
                      <div className="space-y-0.5">
                        <p className="text-[#111111] italic font-normal leading-relaxed">"{q.quote}"</p>
                        <p className="text-[12px] text-[#575754]">
                          — <span className="text-[#111111] font-semibold">{q.speaker}</span> ({q.significance})
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Technical Nuances */}
              {chapter.technicalNuances && chapter.technicalNuances.length > 0 && (
                <div className="mt-4 pt-3.5 border-t border-[#E8E8E6] flex flex-wrap gap-2 items-center">
                  <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#8C8C89]">
                    Nuance Tags:
                  </span>
                  {chapter.technicalNuances.map((nuance, nIdx) => (
                    <span
                      key={`nuance-${nIdx}`}
                      className="px-3 py-1 rounded-full bg-[#F4F4F2] border border-[#E8E8E6] text-[#111111] text-[12px] font-mono"
                    >
                      {nuance}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
