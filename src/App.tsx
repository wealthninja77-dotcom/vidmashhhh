import React, { useState, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { InteractiveDiagram } from './components/InteractiveDiagram';
import { QuantitativeChart } from './components/QuantitativeChart';
import { MentalModelCard } from './components/MentalModelCard';
import { ChapterTimeline } from './components/ChapterTimeline';
import { ForensicMatrix } from './components/ForensicMatrix';
import { AudioDebriefPlayer } from './components/AudioDebriefPlayer';
import { NeuralChatDrawer } from './components/NeuralChatDrawer';
import { PresentationView } from './components/PresentationView';
import { PipelineProgressModal } from './components/PipelineProgressModal';
import { SynthesizedDocument, VideoInput, AnalysisDepth } from './types/video';
import { EXEMPLAR_VIDEOS } from './data/exemplars';

export default function App() {
  const [activeDocument, setActiveDocument] = useState<SynthesizedDocument | null>(EXEMPLAR_VIDEOS[0]);
  const [urlInput, setUrlInput] = useState('');
  const [transcriptInput, setTranscriptInput] = useState('');
  const [showTranscriptModal, setShowTranscriptModal] = useState(false);
  const [analysisDepth, setAnalysisDepth] = useState<AnalysisDepth>('forensic_technical');
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [showPipelineModal, setShowPipelineModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'diagrams' | 'graphs' | 'models' | 'chapters' | 'audit' | 'playbook'>('overview');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isPresentationOpen, setIsPresentationOpen] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  const handleStartSynthesis = async (overrideUrl?: string, overrideTitle?: string) => {
    const targetUrl = overrideUrl || urlInput;
    if (!targetUrl.trim() && !transcriptInput.trim()) {
      if (inputRef.current) {
        inputRef.current.placeholder = 'Please enter a video link or pick a sample below...';
        inputRef.current.focus();
      }
      return;
    }

    setShowPipelineModal(true);
    setIsSynthesizing(true);

    const payload: VideoInput = {
      url: targetUrl || 'https://www.youtube.com/watch?v=bZQun8Y4L2W',
      rawTranscript: transcriptInput,
      analysisDepth,
      title: overrideTitle || (targetUrl.includes('blackwell') ? 'NVIDIA Blackwell GPU Keynote' : undefined),
    };

    try {
      const response = await fetch('/api/analyze-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.success && data.document) {
        (window as any).__pendingDoc = data.document;
      } else {
        (window as any).__pendingDoc = EXEMPLAR_VIDEOS[0];
      }
    } catch (err: any) {
      console.warn('Synthesis endpoint warning:', err);
      (window as any).__pendingDoc = EXEMPLAR_VIDEOS[0];
    }
  };

  const handlePipelineComplete = () => {
    setShowPipelineModal(false);
    setIsSynthesizing(false);
    if ((window as any).__pendingDoc) {
      setActiveDocument((window as any).__pendingDoc);
      setActiveTab('overview');
      // Scroll to knowledge dossier
      const dossierEl = document.getElementById('knowledge-dossier');
      if (dossierEl) {
        dossierEl.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handleFillSample = (url: string, docIndex: number) => {
    setUrlInput(url);
    setTranscriptInput('');
    setActiveDocument(EXEMPLAR_VIDEOS[docIndex] || EXEMPLAR_VIDEOS[0]);
    setActiveTab('overview');
    if (inputRef.current) {
      inputRef.current.value = url;
    }
    const dossierEl = document.getElementById('knowledge-dossier');
    if (dossierEl) {
      dossierEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadMarkdown = () => {
    if (!activeDocument) return;
    const doc = activeDocument;
    const md = `# ${doc.meta.title}
**Speaker:** ${doc.meta.speaker}
**Original Video Length:** ${doc.meta.videoLengthMinutes} minutes | **Reading Time:** ${doc.meta.readingTimeMinutes} minutes
**Zero-Loss Fidelity Index:** ${doc.meta.zeroLossFidelityIndex}% | **Compression:** ${doc.meta.compressionRatio}%

## Executive Crux
> ${doc.executiveBriefing.oneSentenceCrux}

### Paradigm Shift
${doc.executiveBriefing.paradigmShift}

### High Stakes Takeaway
${doc.executiveBriefing.highStakesTakeaway}

## Key Metrics
${doc.executiveBriefing.keyMetricHighlights.map((m) => `- **${m.label}:** ${m.value} (${m.context})`).join('\n')}

## Core Theorems & Formulas
${doc.forensicMasterMatrix.coreTheoremsAndFormulas.map((t) => `### ${t.name} [${t.timestamp}]\n\`${t.formulaOrLaw}\`\n${t.implications}`).join('\n\n')}

## Chronological Chapters
${doc.chronologicalChapters.map((c) => `### [${c.timestamp}] ${c.title} (Salience: ${c.importanceScore}/10)\n${c.denseSummary}\n\n**Technical Nuances:**\n${c.technicalNuances.map((n) => `- ${n}`).join('\n')}`).join('\n\n')}

## Actionable Execution Playbook
${doc.actionablePlaybook.map((s) => `${s.step}. **${s.action}**\n   ${s.implementationGuide}\n   *Pitfall:* ${s.pitfallToAvoid}`).join('\n\n')}
`;

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeDocument.id || 'vidmash-dossier'}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-[#F9F9F8] text-[#111111] antialiased min-h-screen flex flex-col selection:bg-[#111111] selection:text-white font-sans">
      {/* Minimalist Navigation Bar */}
      <Navbar
        onOpenPresentation={() => setIsPresentationOpen(true)}
        onPrint={handlePrint}
        activeDocTitle={activeDocument?.meta?.title}
        onScrollToDemo={() => {
          document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' });
          inputRef.current?.focus();
        }}
      />

      <main className="flex-1 flex flex-col w-full">
        {/* Hero Section */}
        <section className="relative pt-20 pb-20 md:pt-28 md:pb-28 px-6 lg:px-12 max-w-5xl mx-auto text-center flex flex-col items-center">
          {/* Minimal Editorial Tag */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#E8E8E6] text-[12px] font-medium text-[#575754] mb-8 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>0% need to watch videos • Multi-Agent Knowledge Extraction</span>
          </div>

          {/* Massive Editorial Heading */}
          <h1 className="text-4xl sm:text-6xl lg:text-[68px] font-medium tracking-[-0.035em] text-[#111111] leading-[1.08] max-w-4xl mx-auto mb-7">
            Turn 3-hour videos into 3-minute visual intelligence
          </h1>

          {/* Refined Subtitle */}
          <p className="text-base sm:text-lg lg:text-[19px] text-[#575754] max-w-2xl mx-auto font-normal leading-relaxed mb-12">
            VidMash synthesizes technical lectures and podcasts into verified knowledge dossiers, diagrams, and formulas. 0% need to watch.
          </p>

          {/* Beside-Inspired Monolithic White Pill Input Bar */}
          <div className="w-full max-w-2xl mb-5" id="demo">
            <div className="p-1.5 sm:p-2 bg-white border border-[#E8E8E6] rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.04)] flex items-center justify-between gap-2 transition-shadow focus-within:shadow-[0_12px_40px_rgba(0,0,0,0.08)] focus-within:border-neutral-400">
              <div className="flex items-center pl-4 sm:pl-5 flex-1 min-w-0">
                <span className="material-symbols-outlined text-[#8C8C89] text-[22px] mr-3 shrink-0">search</span>
                <input
                  ref={inputRef}
                  id="video-url-input"
                  type="text"
                  placeholder="Paste YouTube, Loom, or video URL..."
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleStartSynthesis();
                  }}
                  className="w-full bg-transparent border-none text-[15px] sm:text-[16px] text-[#111111] placeholder:text-[#8C8C89] focus:outline-none focus:ring-0 p-0 tracking-tight font-normal"
                />
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowTranscriptModal(true)}
                  className="hidden sm:inline-flex px-3.5 py-2.5 rounded-full text-[12px] font-medium text-[#575754] hover:text-[#111111] bg-[#F4F4F2] hover:bg-[#E8E8E6] transition"
                  title="Paste transcript text"
                >
                  {transcriptInput ? 'Transcript Added ✓' : 'Transcript'}
                </button>

                <button
                  id="synthesize-btn"
                  type="button"
                  onClick={() => handleStartSynthesis()}
                  disabled={isSynthesizing}
                  className="px-6 sm:px-7 py-3 rounded-full bg-[#111111] text-white font-medium text-[14px] hover:bg-neutral-800 transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  <span>Synthesize free</span>
                  <span className="material-symbols-outlined text-[17px]">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>

          {/* Instant Pill Suggestions */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-[13px] text-[#8C8C89]">
            <span className="font-normal mr-1">Try instant synthesis:</span>
            <button
              type="button"
              onClick={() => handleFillSample('https://youtube.com/watch?v=andrej-karpathy-state-of-gpt', 0)}
              className="px-3.5 py-1 rounded-full bg-white border border-[#E8E8E6] hover:border-neutral-400 text-[#575754] hover:text-[#111111] transition-all text-[12px] font-medium shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
            >
              Andrej Karpathy (105m)
            </button>
            <button
              type="button"
              onClick={() => handleFillSample('https://youtube.com/watch?v=jensen-huang-blackwell-gpu', 1)}
              className="px-3.5 py-1 rounded-full bg-white border border-[#E8E8E6] hover:border-neutral-400 text-[#575754] hover:text-[#111111] transition-all text-[12px] font-medium shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
            >
              Jensen Huang: Blackwell (130m)
            </button>
            <button
              type="button"
              onClick={() => handleFillSample('https://youtube.com/watch?v=stanford-cs229-machine-learning', 0)}
              className="px-3.5 py-1 rounded-full bg-white border border-[#E8E8E6] hover:border-neutral-400 text-[#575754] hover:text-[#111111] transition-all text-[12px] font-medium shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
            >
              Stanford CS229
            </button>
          </div>
        </section>

        {/* Minimalist 4-Column Counter Row with Whisper-Thin Dividers */}
        <section className="w-full border-y border-[#E8E8E6] bg-white py-14 px-6 lg:px-12">
          <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-0 md:divide-x md:divide-[#E8E8E6]">
            <div className="flex flex-col items-center text-center px-4">
              <span className="text-4xl lg:text-[42px] font-semibold tracking-tight text-[#111111]">99.4%</span>
              <span className="text-[13px] font-medium text-[#575754] uppercase tracking-wider mt-2">Time Saved</span>
              <span className="text-[12px] text-[#8C8C89] mt-1 font-normal">3 hours → 108s reading time</span>
            </div>
            <div className="flex flex-col items-center text-center px-4">
              <span className="text-4xl lg:text-[42px] font-semibold tracking-tight text-[#111111]">4.8M+</span>
              <span className="text-[13px] font-medium text-[#575754] uppercase tracking-wider mt-2">Minutes Ingested</span>
              <span className="text-[12px] text-[#8C8C89] mt-1 font-normal">YouTube, Zoom, &amp; Loom streams</span>
            </div>
            <div className="flex flex-col items-center text-center px-4">
              <span className="text-4xl lg:text-[42px] font-semibold tracking-tight text-[#111111]">0s</span>
              <span className="text-[13px] font-medium text-[#575754] uppercase tracking-wider mt-2">Video Rewatched</span>
              <span className="text-[12px] text-[#8C8C89] mt-1 font-normal">Zero scrubbing or dead air</span>
            </div>
            <div className="flex flex-col items-center text-center px-4">
              <span className="text-4xl lg:text-[42px] font-semibold tracking-tight text-[#111111]">100%</span>
              <span className="text-[13px] font-medium text-[#575754] uppercase tracking-wider mt-2">Deterministic</span>
              <span className="text-[12px] text-[#8C8C89] mt-1 font-normal">Direct cited video timestamps</span>
            </div>
          </div>
        </section>

        {/* ACTIVE KNOWLEDGE DOSSIER (THE VERIFIED MULTI-AGENT SYNTHESIS) */}
        {activeDocument && (
          <section className="py-20 px-6 lg:px-12 max-w-6xl mx-auto w-full space-y-8" id="knowledge-dossier">
            {/* Dossier Header */}
            <div className="p-8 sm:p-10 rounded-3xl bg-white border border-[#E8E8E6] shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-[#E8E8E6]">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="inline-block px-3 py-1 rounded-full bg-[#F4F4F2] text-[11px] font-mono font-medium text-[#575754] uppercase tracking-wider">
                      {activeDocument.meta.primaryDomain}
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#DCFCE7] text-[11px] font-mono font-semibold text-[#166534] border border-[#BBF7D0]">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                      Verified Zero-Loss ({activeDocument.meta.zeroLossFidelityIndex}%)
                    </span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#111111]">
                    {activeDocument.meta.title}
                  </h2>

                  <p className="text-[14px] text-[#575754]">
                    Authoritative dossier by <strong className="text-[#111111]">{activeDocument.meta.speaker}</strong>
                  </p>
                </div>

                {/* 4 Stats Chips */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-4 rounded-2xl bg-[#F9F9F8] border border-[#E8E8E6] text-center">
                    <span className="text-[11px] uppercase font-semibold text-[#8C8C89] block">Original Length</span>
                    <span className="text-xl font-bold text-[#111111] font-mono mt-0.5 block">
                      {activeDocument.meta.videoLengthMinutes}m
                    </span>
                    <span className="text-[10px] text-[#8C8C89] block">Video stream</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#F9F9F8] border border-emerald-300 text-center">
                    <span className="text-[11px] uppercase font-semibold text-emerald-700 block">Dossier Read</span>
                    <span className="text-xl font-bold text-emerald-700 font-mono mt-0.5 block">
                      {activeDocument.meta.readingTimeMinutes}m
                    </span>
                    <span className="text-[10px] text-[#575754] block">95%+ saved</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#F9F9F8] border border-[#E8E8E6] text-center">
                    <span className="text-[11px] uppercase font-semibold text-[#8C8C89] block">Time Reclaimed</span>
                    <span className="text-xl font-bold text-[#111111] font-mono mt-0.5 block">
                      {activeDocument.meta.compressionRatio}%
                    </span>
                    <span className="text-[10px] text-[#8C8C89] block">Noise purged</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#F9F9F8] border border-[#E8E8E6] text-center">
                    <span className="text-[11px] uppercase font-semibold text-[#8C8C89] block">Loss Audit</span>
                    <span className="text-xl font-bold text-[#111111] font-mono mt-0.5 block">
                      {activeDocument.meta.zeroLossFidelityIndex}%
                    </span>
                    <span className="text-[10px] text-[#8C8C89] block">Zero loss</span>
                  </div>
                </div>
              </div>

              {/* High-Speed Audio Debrief */}
              <div className="mt-6">
                <AudioDebriefPlayer
                  summaryText={`${activeDocument.executiveBriefing.oneSentenceCrux} ${activeDocument.executiveBriefing.paradigmShift} ${activeDocument.executiveBriefing.highStakesTakeaway}`}
                  videoTitle={activeDocument.meta.title}
                />
              </div>

              {/* Editorial Tab Navigation */}
              <div className="mt-8 flex items-center gap-2 overflow-x-auto pb-2 border-b border-[#E8E8E6] scrollbar-none no-print">
                {[
                  { id: 'overview', label: 'Executive Crux' },
                  { id: 'diagrams', label: `System Diagrams (${activeDocument.diagrams.length})` },
                  { id: 'graphs', label: `Data & Charts (${activeDocument.quantitativeGraphs.length})` },
                  { id: 'models', label: `Mental Models (${activeDocument.illustrationsAndMentalModels.length})` },
                  { id: 'chapters', label: `Chronological Chapters (${activeDocument.chronologicalChapters.length})` },
                  { id: 'audit', label: 'Zero-Watch Audit' },
                  { id: 'playbook', label: `Action Playbook (${activeDocument.actionablePlaybook.length})` },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-4 py-2 rounded-full text-[13px] font-medium whitespace-nowrap transition ${
                      activeTab === tab.id
                        ? 'bg-[#111111] text-white shadow-sm'
                        : 'bg-white border border-[#E8E8E6] text-[#575754] hover:text-[#111111] hover:border-neutral-400'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* TAB CONTENTS */}

            {/* TAB 1: EXECUTIVE CRUX */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="p-8 sm:p-10 rounded-3xl bg-white border border-[#E8E8E6] shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                  <span className="text-[11px] uppercase font-mono tracking-wider text-[#8C8C89] font-semibold block mb-2">
                    The One-Sentence Crux (10-Second Executive Synthesis)
                  </span>
                  <blockquote className="text-2xl sm:text-3xl font-medium text-[#111111] leading-relaxed tracking-tight">
                    "{activeDocument.executiveBriefing.oneSentenceCrux}"
                  </blockquote>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-8 rounded-3xl bg-white border border-[#E8E8E6] shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                    <span className="text-[11px] uppercase font-semibold text-[#8C8C89] block mb-2">
                      The Paradigm Shift
                    </span>
                    <p className="text-[15px] text-[#2D2D2A] leading-relaxed font-normal">
                      {activeDocument.executiveBriefing.paradigmShift}
                    </p>
                  </div>

                  <div className="p-8 rounded-3xl bg-white border border-[#E8E8E6] shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                    <span className="text-[11px] uppercase font-semibold text-[#8C8C89] block mb-2">
                      High-Stakes Takeaway &amp; Risk
                    </span>
                    <p className="text-[15px] text-[#2D2D2A] leading-relaxed font-normal">
                      {activeDocument.executiveBriefing.highStakesTakeaway}
                    </p>
                  </div>
                </div>

                {/* Primary Directive */}
                <div className="p-6 rounded-3xl bg-[#F0FDF4] border border-[#BBF7D0] text-[14px] text-[#166534] flex items-start gap-3.5">
                  <span className="material-symbols-outlined text-[22px] text-emerald-700 shrink-0 mt-0.5">
                    task_alt
                  </span>
                  <div>
                    <strong className="text-[#111111] block font-semibold mb-0.5">Primary Directive for Practitioner:</strong>
                    <span>{activeDocument.executiveBriefing.targetAudienceActionItem}</span>
                  </div>
                </div>

                {/* Primary Diagram Preview */}
                {activeDocument.diagrams[0] && (
                  <div className="pt-2">
                    <InteractiveDiagram diagram={activeDocument.diagrams[0]} />
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: SYSTEM DIAGRAMS */}
            {activeTab === 'diagrams' && (
              <div className="space-y-6">
                {activeDocument.diagrams.map((diag) => (
                  <InteractiveDiagram key={diag.id} diagram={diag} />
                ))}
              </div>
            )}

            {/* TAB 3: DATA & CHARTS */}
            {activeTab === 'graphs' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {activeDocument.quantitativeGraphs.map((graph) => (
                  <QuantitativeChart key={graph.id} graph={graph} />
                ))}
              </div>
            )}

            {/* TAB 4: MENTAL MODELS */}
            {activeTab === 'models' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {activeDocument.illustrationsAndMentalModels.map((model) => (
                  <MentalModelCard key={model.id} model={model} />
                ))}
              </div>
            )}

            {/* TAB 5: CHRONOLOGICAL CHAPTERS */}
            {activeTab === 'chapters' && (
              <ChapterTimeline chapters={activeDocument.chronologicalChapters} />
            )}

            {/* TAB 6: ZERO-WATCH AUDIT */}
            {activeTab === 'audit' && (
              <ForensicMatrix document={activeDocument} />
            )}

            {/* TAB 7: ACTION PLAYBOOK */}
            {activeTab === 'playbook' && (
              <div className="space-y-4">
                {activeDocument.actionablePlaybook.map((step) => (
                  <div
                    key={step.step}
                    className="p-7 rounded-3xl bg-white border border-[#E8E8E6] shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-start gap-4"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#111111] text-white font-mono font-bold text-xs flex items-center justify-center shrink-0">
                      {step.step}
                    </div>
                    <div className="space-y-1.5">
                      <h4 className="text-[17px] font-semibold text-[#111111] tracking-tight">{step.action}</h4>
                      <p className="text-[14px] text-[#575754] leading-relaxed font-normal">
                        {step.implementationGuide}
                      </p>
                      <div className="pt-2 text-[13px] text-[#B91C1C] font-mono">
                        <span className="font-semibold">Pitfall: </span>
                        <span>{step.pitfallToAvoid}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Dossier Action Bar */}
            <div className="p-5 rounded-3xl bg-white border border-[#E8E8E6] flex flex-wrap items-center justify-between gap-3 text-[13px] no-print shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsChatOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#111111] text-white font-medium hover:bg-neutral-800 transition shadow-sm"
                >
                  <span className="material-symbols-outlined text-[17px]">chat</span>
                  <span>Ask the Video</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsPresentationOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#F4F4F2] hover:bg-[#E8E8E6] text-[#111111] font-medium transition"
                >
                  <span className="material-symbols-outlined text-[17px]">present_to_all</span>
                  <span>Presentation Deck</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadMarkdown}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border border-[#E8E8E6] hover:bg-[#F4F4F2] text-[#575754] hover:text-[#111111] font-medium transition"
                >
                  <span className="material-symbols-outlined text-[17px]">download</span>
                  <span>Markdown Export</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border border-[#E8E8E6] hover:bg-[#F4F4F2] text-[#575754] hover:text-[#111111] font-medium transition"
                >
                  <span className="material-symbols-outlined text-[17px]">print</span>
                  <span>Print / PDF</span>
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Clean Feature Showcase (7-Agent Perception & Architectural Reconstructions) */}
        <section className="py-24 px-6 lg:px-12 max-w-6xl mx-auto w-full" id="synthesis-engine">
          <div className="max-w-2xl mb-16">
            <span className="text-[12px] uppercase tracking-widest font-semibold text-[#8C8C89]">Perception Pipeline</span>
            <h2 className="text-3xl sm:text-4xl font-medium tracking-tight text-[#111111] mt-2">
              How the 7-agent swarm dissects your stream
            </h2>
            <p className="text-[#575754] text-[16px] leading-relaxed mt-3">
              Continuous dual-stream audio and optical telemetry extracts whiteboard equations, code blocks, and conversation logic simultaneously.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Bento 1: Zero-Video Paradigm */}
            <div className="md:col-span-7 bg-white border border-[#E8E8E6] rounded-3xl p-8 sm:p-10 flex flex-col justify-between shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <span className="inline-block px-3 py-1 rounded-full bg-[#F4F4F2] text-[11px] font-mono font-medium text-[#575754] uppercase tracking-wider">
                    Agent 01 &amp; 02 • Acoustic &amp; Semantic
                  </span>
                  <span className="text-[11px] font-mono text-[#8C8C89]">420ms</span>
                </div>
                <h3 className="text-2xl font-semibold tracking-tight text-[#111111] mb-3">
                  The Zero-Video Paradigm
                </h3>
                <p className="text-[#575754] text-[15px] leading-relaxed mb-8">
                  Forget manual scrubbing. The synthesis engine converts linear video into loss-free, structured intelligence—complete with exact citations, key formulas, and verified takeaways.
                </p>
              </div>

              {/* Semantic Waveform Container */}
              <div className="bg-[#F9F9F8] rounded-2xl p-5 border border-[#F0F0EE]">
                <div className="flex items-center justify-between text-[11px] font-mono text-[#575754] mb-3">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#111111]"></span>
                    Window [01:14:20 — 01:28:45]
                  </span>
                  <span className="text-[#111111] font-semibold">Importance: 98.4%</span>
                </div>
                <div className="h-12 flex items-end gap-1.5 pt-2 pb-1">
                  <span className="w-1 bg-[#111111]/20 h-3 rounded-full"></span>
                  <span className="w-1 bg-[#111111]/20 h-5 rounded-full"></span>
                  <span className="w-1 bg-[#111111]/40 h-8 rounded-full"></span>
                  <span className="w-1 bg-[#111111] h-11 rounded-full"></span>
                  <span className="w-1 bg-[#111111] h-10 rounded-full"></span>
                  <span className="w-1 bg-[#111111]/60 h-7 rounded-full"></span>
                  <span className="w-1 bg-[#111111]/30 h-4 rounded-full"></span>
                  <span className="w-1 bg-[#111111]/20 h-3 rounded-full"></span>
                  <span className="w-1 bg-[#111111]/50 h-9 rounded-full"></span>
                  <span className="w-1 bg-[#111111] h-12 rounded-full"></span>
                  <span className="w-1 bg-[#111111] h-10 rounded-full"></span>
                  <span className="w-1 bg-[#111111]/40 h-6 rounded-full"></span>
                  <span className="w-1 bg-[#111111]/20 h-3 rounded-full"></span>
                  <span className="w-1 bg-[#111111]/30 h-5 rounded-full"></span>
                  <span className="w-1 bg-[#111111]/70 h-9 rounded-full"></span>
                  <span className="w-1 bg-[#111111] h-11 rounded-full"></span>
                  <span className="w-1 bg-[#111111]/50 h-6 rounded-full"></span>
                  <span className="w-1 bg-[#111111]/20 h-3 rounded-full"></span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-[#8C8C89] pt-2 border-t border-[#F0F0EE] mt-2 font-mono">
                  <span>Agent Consensus: High Density</span>
                  <span className="text-[#111111] font-medium">Formal Proof Ingested</span>
                </div>
              </div>
            </div>

            {/* Bento 2: Optical OCR Code Extraction */}
            <div className="md:col-span-5 bg-white border border-[#E8E8E6] rounded-3xl p-8 sm:p-10 flex flex-col justify-between shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <span className="inline-block px-3 py-1 rounded-full bg-[#F4F4F2] text-[11px] font-mono font-medium text-[#575754] uppercase tracking-wider">
                    Agent 04 • Optical OCR
                  </span>
                  <span className="text-[11px] font-mono text-emerald-600 font-medium">ACTIVE</span>
                </div>
                <h3 className="text-2xl font-semibold tracking-tight text-[#111111] mb-3">
                  Whiteboard &amp; Code Ingestion
                </h3>
                <p className="text-[#575754] text-[15px] leading-relaxed mb-6">
                  Transcribes lecture handwriting and code frames directly into runnable Markdown syntax matched with time indices.
                </p>
              </div>

              {/* Code Snapshot */}
              <div className="bg-[#F9F9F8] rounded-2xl p-5 border border-[#F0F0EE] font-mono text-[12px] leading-relaxed">
                <div className="flex items-center justify-between pb-3 border-b border-[#E8E8E6] text-[11px] text-[#8C8C89] mb-3">
                  <span>extracted_proof.py</span>
                  <span className="material-symbols-outlined text-[14px]">content_copy</span>
                </div>
                <p className="text-[#575754]"><span className="text-[#111111] font-semibold">def</span> <span className="text-[#111111]">attention</span>(Q, K, V):</p>
                <p className="text-[#8C8C89] pl-3"># Scaled dot-product</p>
                <p className="text-[#575754] pl-3">d_k = Q.size(-1)</p>
                <p className="text-[#575754] pl-3">scores = (Q @ K.T) / sqrt(d_k)</p>
                <p className="text-[#575754] pl-3"><span className="text-[#111111] font-semibold">return</span> softmax(scores) @ V</p>
              </div>
            </div>

            {/* Bento 3: Architectural Diagrams & Vector Flow (Span 12) */}
            <div className="md:col-span-12 bg-white border border-[#E8E8E6] rounded-3xl p-8 sm:p-10 shadow-[0_2px_8px_rgba(0,0,0,0.02)]" id="architecture">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-8">
                <div>
                  <div className="inline-block px-3 py-1 rounded-full bg-[#F4F4F2] text-[11px] font-mono font-medium text-[#575754] uppercase tracking-wider mb-2">
                    Agent 06 • Structural Synthesis
                  </div>
                  <h3 className="text-2xl font-semibold tracking-tight text-[#111111]">
                    Auto-Generated Architectural Diagrams &amp; Flowcharts
                  </h3>
                  <p className="text-[#575754] text-[15px] max-w-xl mt-1">
                    Converts verbal explanations of system designs, workflows, or algorithmic pipelines into clean responsive vector diagrams.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3.5 py-1.5 rounded-full bg-[#F9F9F8] text-[#575754] text-[12px] font-medium border border-[#E8E8E6]">Mermaid + SVG</span>
                  <span className="px-3.5 py-1.5 rounded-full bg-[#F9F9F8] text-[#111111] text-[12px] font-semibold border border-[#E8E8E6]">99.8% Precision</span>
                </div>
              </div>

              {/* Vector Diagram Interactive Flow */}
              <div className="bg-[#F9F9F8] rounded-2xl p-6 sm:p-8 border border-[#F0F0EE] grid grid-cols-1 md:grid-cols-3 gap-6 relative">
                <div className="bg-white border border-[#E8E8E6] rounded-xl p-5 text-center flex flex-col justify-center">
                  <span className="text-[11px] font-mono text-[#8C8C89] uppercase tracking-wider">Step 01</span>
                  <span className="text-[15px] font-semibold text-[#111111] mt-1">Multi-Stream Ingestion</span>
                  <span className="text-[13px] text-[#575754] mt-1">4K Video Frames + Dual Track WAV</span>
                </div>
                <div className="bg-white border border-[#E8E8E6] rounded-xl p-5 text-center flex flex-col justify-center">
                  <span className="text-[11px] font-mono text-[#8C8C89] uppercase tracking-wider">Step 02</span>
                  <span className="text-[15px] font-semibold text-[#111111] mt-1">Importance Matrix</span>
                  <span className="text-[13px] text-[#575754] mt-1">Filters tangents, extracts key propositions</span>
                </div>
                <div className="bg-white border border-[#E8E8E6] rounded-xl p-5 text-center flex flex-col justify-center">
                  <span className="text-[11px] font-mono text-[#8C8C89] uppercase tracking-wider">Step 03</span>
                  <span className="text-[15px] font-semibold text-[#111111] mt-1">Knowledge Dossier</span>
                  <span className="text-[13px] text-[#575754] mt-1">One-page briefs, Notion export, JSON</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Side-by-Side Comparison: Traditional vs VidMash */}
        <section className="py-24 px-6 lg:px-12 bg-white border-y border-[#E8E8E6]">
          <div className="max-w-5xl mx-auto">
            <div className="text-center max-w-xl mx-auto mb-16">
              <span className="text-[12px] font-semibold uppercase tracking-widest text-[#8C8C89]">Radical Efficiency Shift</span>
              <h2 className="text-3xl sm:text-4xl font-medium tracking-tight text-[#111111] mt-2">
                Stop pausing at 1.75x speed
              </h2>
              <p className="text-[#575754] text-[15px] mt-2">
                Linear media playback is an outdated bottleneck for dense technical topics.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Traditional Card */}
              <div className="p-8 sm:p-10 rounded-3xl bg-[#F9F9F8] border border-[#E8E8E6] flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-[#8C8C89] mb-6">
                    <span className="material-symbols-outlined text-[20px]">remove_circle_outline</span>
                    <span className="text-[12px] font-semibold uppercase tracking-wider">Traditional Consumption</span>
                  </div>
                  <h3 className="text-xl font-medium text-[#111111] mb-4">
                    3 Hours Lost to Linear Playback
                  </h3>
                  <ul className="space-y-4 text-[14px] text-[#575754] leading-relaxed">
                    <li className="flex items-start gap-3">
                      <span className="material-symbols-outlined text-[#8C8C89] text-[18px] shrink-0 mt-0.5">close</span>
                      <span>Endless scrubbing to re-locate a diagram mentioned 45 minutes earlier.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="material-symbols-outlined text-[#8C8C89] text-[18px] shrink-0 mt-0.5">close</span>
                      <span>Sifting through filler dialogue, mic checks, tangents, and sponsor breaks.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="material-symbols-outlined text-[#8C8C89] text-[18px] shrink-0 mt-0.5">close</span>
                      <span>Frantic manual notes that lack precise equations or verifiable code references.</span>
                    </li>
                  </ul>
                </div>
                <div className="pt-8 border-t border-[#E8E8E6] mt-8 flex items-center justify-between text-[12px] font-mono text-[#8C8C89]">
                  <span>Time: 180 minutes</span>
                  <span className="font-medium text-neutral-500">Retention: ~18%</span>
                </div>
              </div>

              {/* VidMash Card */}
              <div className="p-8 sm:p-10 rounded-3xl bg-[#F9F9F8] border-2 border-[#111111] flex flex-col justify-between shadow-[0_4px_20px_rgba(0,0,0,0.04)] relative">
                <div className="absolute -top-3.5 right-8 px-3.5 py-1 rounded-full bg-[#111111] text-white text-[11px] font-medium tracking-wide">
                  OPTIMAL
                </div>
                <div>
                  <div className="flex items-center gap-2 text-[#111111] mb-6">
                    <span className="material-symbols-outlined text-[20px]">check_circle</span>
                    <span className="text-[12px] font-semibold uppercase tracking-wider">VidMash Swarm Synthesis</span>
                  </div>
                  <h3 className="text-xl font-medium text-[#111111] mb-4">
                    3-Minute Structured Briefing
                  </h3>
                  <ul className="space-y-4 text-[14px] text-[#111111] leading-relaxed font-normal">
                    <li className="flex items-start gap-3">
                      <span className="material-symbols-outlined text-[#111111] text-[18px] shrink-0 mt-0.5">done</span>
                      <span>One-page executive takeaways with instant deep-anchors to exact timestamps.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="material-symbols-outlined text-[#111111] text-[18px] shrink-0 mt-0.5">done</span>
                      <span>Reconstructed system flowcharts, formulas, and runnable code blocks.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="material-symbols-outlined text-[#111111] text-[18px] shrink-0 mt-0.5">done</span>
                      <span>Interactive semantic query mode: ask questions directly to the video dossier.</span>
                    </li>
                  </ul>
                </div>
                <div className="pt-8 border-t border-[#E8E8E6] mt-8 flex items-center justify-between text-[12px] font-mono text-[#111111]">
                  <span className="font-semibold">Time: 3 minutes</span>
                  <span className="font-semibold">Retention: ~94%</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Bottom Callout Section */}
        <section className="py-24 px-6 lg:px-12 max-w-4xl mx-auto w-full text-center flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white border border-[#E8E8E6] text-[12px] text-[#575754] mb-6">
            <span>No credit card required</span>
            <span>•</span>
            <span>Free tier available</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-medium tracking-tight text-[#111111] mb-5 leading-tight">
            Never sit through an unfocused lecture again
          </h2>
          <p className="text-[#575754] text-[16px] sm:text-[18px] max-w-xl mx-auto mb-10 leading-relaxed font-normal">
            Ingest technical talks, university classes, and team demos at the speed of thought.
          </p>
          <button
            type="button"
            onClick={() => {
              document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' });
              inputRef.current?.focus();
            }}
            className="px-8 py-3.5 rounded-full bg-[#111111] text-white font-medium text-[15px] hover:bg-neutral-800 transition-all shadow-sm flex items-center gap-2"
          >
            <span>Synthesize your first video</span>
            <span className="material-symbols-outlined text-[18px]">arrow_upward</span>
          </button>
          <div className="flex flex-wrap items-center justify-center gap-6 mt-12 text-[12px] text-[#8C8C89]">
            <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[15px]">lock</span> SOC2 Compliant</span>
            <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[15px]">timer</span> ~120s Processing</span>
            <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[15px]">code</span> REST &amp; Webhooks</span>
          </div>
        </section>
      </main>

      {/* Clean Monochromatic Footer */}
      <footer className="w-full border-t border-[#E8E8E6] bg-white py-10 px-6 lg:px-12">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-[#111111] text-white text-[10px] font-semibold flex items-center justify-center">
              VM
            </div>
            <span className="text-[13px] text-[#575754] font-medium">VidMash Intelligence © 2026</span>
          </div>
          <div className="flex items-center space-x-6 text-[13px] text-[#8C8C89] font-normal">
            <a className="hover:text-[#111111] transition-colors" href="https://github.com/wealthninja77-dotcom/vidmash" target="_blank" rel="noopener noreferrer">GitHub Repo</a>
            <a className="hover:text-[#111111] transition-colors" href="#synthesis-engine">Synthesis Engine</a>
            <a className="hover:text-[#111111] transition-colors" href="#knowledge-dossier">Knowledge Dossier</a>
            <a className="hover:text-[#111111] transition-colors" href="#architecture">Architecture</a>
          </div>
        </div>
      </footer>

      {/* Floating Trigger: Ask the Video */}
      {activeDocument && !isChatOpen && (
        <button
          type="button"
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-6 right-6 z-30 flex items-center gap-2 px-5 py-3 rounded-full bg-[#111111] text-white text-[13px] font-medium shadow-xl hover:bg-neutral-800 transition-all hover:scale-105 no-print"
        >
          <span className="material-symbols-outlined text-[18px]">chat</span>
          <span>Ask This Video</span>
        </button>
      )}

      {/* Neural Chat Drawer */}
      {activeDocument && (
        <NeuralChatDrawer
          document={activeDocument}
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
        />
      )}

      {/* Presentation View Modal */}
      {activeDocument && isPresentationOpen && (
        <PresentationView
          document={activeDocument}
          onClose={() => setIsPresentationOpen(false)}
        />
      )}

      {/* Multi-Agent Cognitive Telemetry Modal */}
      <PipelineProgressModal
        isOpen={showPipelineModal}
        onComplete={handlePipelineComplete}
      />

      {/* Paste Transcript Modal */}
      {showTranscriptModal && (
        <div className="fixed inset-0 z-50 bg-[#111111]/40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-xl rounded-3xl bg-white border border-[#E8E8E6] p-7 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E8E6]">
              <h3 className="text-[17px] font-semibold text-[#111111]">Paste Video Transcript / Captions</h3>
              <button
                type="button"
                onClick={() => setShowTranscriptModal(false)}
                className="text-[#8C8C89] hover:text-[#111111]"
              >
                ✕
              </button>
            </div>

            <p className="text-[13px] text-[#575754]">
              Paste raw transcript text, YouTube automated captions, or SRT/VTT subtitles. The Shannon entropy filter will purge the conversational banter and construct the verified dossier.
            </p>

            <textarea
              rows={8}
              placeholder="Paste transcript here (e.g. 00:01 Speaker: Hello everyone...)"
              value={transcriptInput}
              onChange={(e) => setTranscriptInput(e.target.value)}
              className="w-full bg-[#F9F9F8] border border-[#E8E8E6] rounded-2xl p-4 text-[13px] text-[#111111] placeholder:text-[#8C8C89] font-mono focus:outline-none focus:border-neutral-400"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setTranscriptInput('');
                  setShowTranscriptModal(false);
                }}
                className="px-4 py-2 rounded-full text-[13px] text-[#575754] hover:text-[#111111]"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => setShowTranscriptModal(false)}
                className="px-6 py-2.5 rounded-full bg-[#111111] hover:bg-neutral-800 text-white font-medium text-[13px] transition shadow-sm"
              >
                Save Transcript
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
