import React, { useState } from 'react';
import { SynthesizedDocument } from '../types/video';
import { InteractiveDiagram } from './InteractiveDiagram';
import { QuantitativeChart } from './QuantitativeChart';
import { MentalModelCard } from './MentalModelCard';

interface PresentationViewProps {
  document: SynthesizedDocument;
  onClose: () => void;
}

export const PresentationView: React.FC<PresentationViewProps> = ({ document, onClose }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      title: 'Executive Briefing & Crux',
      subtitle: `${document.meta.title} — ${document.meta.speaker}`,
      icon: 'description',
      content: (
        <div className="space-y-6 max-w-4xl mx-auto">
          <div className="p-8 rounded-3xl bg-white border border-[#E8E8E6] shadow-sm">
            <span className="text-[11px] uppercase font-mono tracking-wider text-[#8C8C89] font-semibold block mb-2">
              The One-Sentence Crux
            </span>
            <p className="text-2xl sm:text-3xl font-medium text-[#111111] leading-relaxed tracking-tight">
              "{document.executiveBriefing.oneSentenceCrux}"
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-6 rounded-2xl bg-white border border-[#E8E8E6]">
              <span className="text-[11px] uppercase font-semibold text-[#8C8C89] block mb-1">Paradigm Shift</span>
              <p className="text-[14px] text-[#2D2D2A] leading-relaxed">{document.executiveBriefing.paradigmShift}</p>
            </div>
            <div className="p-6 rounded-2xl bg-white border border-[#E8E8E6]">
              <span className="text-[11px] uppercase font-semibold text-[#8C8C89] block mb-1">High Stakes Takeaway</span>
              <p className="text-[14px] text-[#2D2D2A] leading-relaxed">{document.executiveBriefing.highStakesTakeaway}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {document.executiveBriefing.keyMetricHighlights.map((m, idx) => (
              <div key={`m-${idx}`} className="p-4 rounded-2xl bg-white border border-[#E8E8E6] text-center">
                <span className="text-[11px] font-mono text-[#8C8C89] block">{m.label}</span>
                <span className="text-xl font-bold text-[#111111] mt-1 block tracking-tight">{m.value}</span>
                <span className="text-[11px] text-[#575754] mt-0.5 block">{m.context}</span>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      title: 'Core System Architecture',
      subtitle: 'Verified Pipeline & State Topology',
      icon: 'account_tree',
      content: (
        <div className="max-w-4xl mx-auto">
          {document.diagrams[0] ? (
            <InteractiveDiagram diagram={document.diagrams[0]} />
          ) : (
            <p className="text-[#8C8C89] text-center py-12">No diagram available</p>
          )}
        </div>
      ),
    },
    {
      title: 'Quantitative Data & Scaling Benchmarks',
      subtitle: 'Empirical Metrics Discovered in Video Timeline',
      icon: 'insights',
      content: (
        <div className="max-w-4xl mx-auto">
          {document.quantitativeGraphs[0] ? (
            <QuantitativeChart graph={document.quantitativeGraphs[0]} />
          ) : (
            <p className="text-[#8C8C89] text-center py-12">No quantitative chart available</p>
          )}
        </div>
      ),
    },
    {
      title: 'Mental Models & Metaphors',
      subtitle: 'Intuitive Concept Anchors for Fast Cognition',
      icon: 'lightbulb',
      content: (
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-5">
          {document.illustrationsAndMentalModels.map((m) => (
            <MentalModelCard key={m.id} model={m} />
          ))}
        </div>
      ),
    },
    {
      title: 'Actionable Execution Playbook',
      subtitle: 'Implementation steps without watching the video',
      icon: 'task_alt',
      content: (
        <div className="max-w-4xl mx-auto space-y-3.5">
          {document.actionablePlaybook.map((step) => (
            <div key={step.step} className="p-6 rounded-3xl bg-white border border-[#E8E8E6] flex items-start gap-4">
              <span className="w-8 h-8 rounded-full bg-[#111111] text-white font-mono font-bold text-xs flex items-center justify-center shrink-0">
                {step.step}
              </span>
              <div className="space-y-1">
                <h4 className="text-[15px] font-semibold text-[#111111]">{step.action}</h4>
                <p className="text-[13px] text-[#575754] leading-relaxed">{step.implementationGuide}</p>
                <p className="text-[12px] text-[#B91C1C] font-mono mt-1">Pitfall: {step.pitfallToAvoid}</p>
              </div>
            </div>
          ))}
        </div>
      ),
    },
  ];

  const nextSlide = () => setCurrentSlide((s) => Math.min(slides.length - 1, s + 1));
  const prevSlide = () => setCurrentSlide((s) => Math.max(0, s - 1));

  return (
    <div className="fixed inset-0 z-50 bg-[#F9F9F8]/98 backdrop-blur-xl flex flex-col p-6 sm:p-10 no-print">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-5 border-b border-[#E8E8E6] max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#111111] text-white flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">{slides[currentSlide].icon}</span>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-[#111111] tracking-tight">{slides[currentSlide].title}</h2>
            <p className="text-[13px] text-[#575754]">{slides[currentSlide].subtitle}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-full bg-white border border-[#E8E8E6] hover:bg-[#F4F4F2] text-[#575754] transition"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>
      </div>

      {/* Main Slide Content */}
      <div className="flex-1 overflow-y-auto py-8 px-2 flex items-center justify-center">
        {slides[currentSlide].content}
      </div>

      {/* Bottom Navigation */}
      <div className="pt-5 border-t border-[#E8E8E6] flex items-center justify-between max-w-5xl mx-auto w-full">
        <button
          type="button"
          onClick={prevSlide}
          disabled={currentSlide === 0}
          className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-white border border-[#E8E8E6] hover:bg-[#F4F4F2] disabled:opacity-30 text-[13px] font-medium text-[#111111] transition shadow-sm"
        >
          <span className="material-symbols-outlined text-[17px]">arrow_back</span>
          <span>Previous</span>
        </button>

        <div className="flex items-center gap-2">
          {slides.map((_, i) => (
            <button
              key={`dot-${i}`}
              type="button"
              onClick={() => setCurrentSlide(i)}
              className={`h-2 rounded-full transition-all ${
                currentSlide === i ? 'w-8 bg-[#111111]' : 'w-2 bg-[#E8E8E6] hover:bg-[#8C8C89]'
              }`}
            />
          ))}
          <span className="text-[12px] font-mono text-[#8C8C89] ml-2">
            Slide {currentSlide + 1} of {slides.length}
          </span>
        </div>

        <button
          type="button"
          onClick={nextSlide}
          disabled={currentSlide === slides.length - 1}
          className="flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-[#111111] hover:bg-neutral-800 disabled:opacity-30 text-[13px] font-medium text-white transition shadow-sm"
        >
          <span>Next</span>
          <span className="material-symbols-outlined text-[17px]">arrow_forward</span>
        </button>
      </div>
    </div>
  );
};
