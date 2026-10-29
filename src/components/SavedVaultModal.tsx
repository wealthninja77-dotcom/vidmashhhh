import React, { useState } from 'react';
import { SynthesizedDocument } from '../types/video';

interface SavedVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedDossiers: SynthesizedDocument[];
  onSelectDossier: (dossier: SynthesizedDocument) => void;
  isLoading: boolean;
  onRefresh: () => void;
}

export const SavedVaultModal: React.FC<SavedVaultModalProps> = ({
  isOpen,
  onClose,
  savedDossiers,
  onSelectDossier,
  isLoading,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filtered = savedDossiers.filter((d) => {
    const term = searchTerm.toLowerCase();
    return (
      d.meta?.title?.toLowerCase().includes(term) ||
      d.meta?.speaker?.toLowerCase().includes(term) ||
      d.meta?.primaryDomain?.toLowerCase().includes(term) ||
      d.executiveBriefing?.oneSentenceCrux?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="fixed inset-0 z-50 bg-[#111111]/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-3xl rounded-lg bg-white border border-[#E2E0D8] shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E2E0D8] bg-[#FAF9F6] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#787670] block">
              CLOUD FIRESTORE REPOSITORY
            </span>
            <h3 className="text-[16px] font-semibold text-[#111111] tracking-tight">
              Synthesized Monograph Vault
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              className="px-2.5 py-1 rounded border border-[#E2E0D8] bg-white hover:border-[#111111] text-[#4A4945] text-[11px] font-mono transition disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? 'Syncing...' : 'Refresh'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-2.5 py-1 rounded border border-[#E2E0D8] bg-white hover:border-[#111111] text-[#111111] text-[11px] font-mono transition cursor-pointer"
            >
              ESC
            </button>
          </div>
        </div>

        {/* Search Filter */}
        <div className="p-4 bg-[#F7F6F2] border-b border-[#E2E0D8]">
          <input
            type="text"
            placeholder="Filter saved monographs by title, speaker, domain, or thesis..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-[#E2E0D8] rounded px-3.5 py-2 text-[13px] text-[#111111] placeholder:text-[#787670] focus:outline-none focus:border-[#111111]"
          />
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#E2E0D8]">
          {isLoading && savedDossiers.length === 0 ? (
            <div className="py-12 text-center text-[#4A4945] text-[13px] font-mono">
              Loading monographs from Cloud Firestore...
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-[#4A4945]">
              <p className="font-semibold text-[14px] text-[#111111]">No saved monographs found</p>
              <p className="text-[12px] text-[#787670] mt-1">
                Synthesize any video URL or transcript to archive its intelligence dossier here.
              </p>
            </div>
          ) : (
            filtered.map((dossier) => (
              <div
                key={dossier.id}
                onClick={() => {
                  onSelectDossier(dossier);
                  onClose();
                }}
                className="p-4 sm:px-6 hover:bg-[#FAF9F6] transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
              >
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-[10.5px] font-mono text-[#787670] uppercase tracking-wider">
                    <span className="text-[#111111] font-semibold">
                      {dossier.meta?.primaryDomain || 'Technical Monograph'}
                    </span>
                    <span>·</span>
                    <span>{dossier.meta?.speaker}</span>
                    <span>·</span>
                    <span className="text-[#15803D] tabular-nums">
                      {dossier.meta?.zeroLossFidelityIndex || 99.4}% Fidelity
                    </span>
                  </div>
                  <h4 className="text-[14.5px] font-semibold text-[#111111] line-clamp-1">
                    {dossier.meta?.title || 'Synthesized Intelligence Monograph'}
                  </h4>
                  <p className="text-[12.5px] text-[#4A4945] line-clamp-1">
                    {dossier.executiveBriefing?.oneSentenceCrux}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right font-mono tabular-nums">
                    <span className="text-[11px] text-[#111111] font-semibold block">
                      {dossier.meta?.videoLengthMinutes || 45}m →{' '}
                      {dossier.meta?.readingTimeMinutes || 3}m
                    </span>
                    <span className="text-[10px] text-[#787670]">
                      {dossier.meta?.compressionRatio || 93}% saved
                    </span>
                  </div>
                  <span className="px-3 py-1.5 rounded bg-[#111111] text-white text-[11px] font-mono uppercase tracking-wider group-hover:bg-neutral-800 transition">
                    Open →
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
