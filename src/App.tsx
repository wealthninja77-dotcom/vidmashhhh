import React, { useState, useRef, useEffect } from 'react';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { Navbar } from './components/Navbar';
import { InteractiveDiagram } from './components/InteractiveDiagram';
import { QuantitativeChart } from './components/QuantitativeChart';
import { MentalModelCard } from './components/MentalModelCard';
import { ChapterTimeline } from './components/ChapterTimeline';
import { ForensicMatrix } from './components/ForensicMatrix';
import { SavedVaultModal } from './components/SavedVaultModal';
import { SynthesizedDocument, VideoInput } from './types/video';
import { EXEMPLAR_VIDEOS } from './data/exemplars';
import { parseTimestampToSeconds, formatSecondsToTimestamp } from './utils/pipeline';
import {
  streamVideoSynthesis,
  transcribeAudioFile,
  askVideoSpecialistAgent,
  apiLogger,
  PipelineStageError,
  ApiDiagnosticLogEntry,
} from './lib/api';
import {
  auth,
  signInWithGoogle,
  signOutUser,
  saveDossierToFirestore,
  fetchRecentDossiers,
  normalizeDossier,
  saveChatQuery,
} from './lib/firebase';

interface AgentStepState {
  id: string;
  code: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  detail: string;
}

const INITIAL_AGENTS: AgentStepState[] = [
  {
    id: 'agent-1',
    code: 'AGENT 01',
    name: 'Transcript & Signal Ingestion',
    status: 'pending',
    detail: 'Extracts caption stream, speaker metadata, and computes Shannon signal entropy.',
  },
  {
    id: 'agent-2',
    code: 'AGENT 02',
    name: 'Epistemic & Thesis Architect',
    status: 'pending',
    detail: 'Synthesizes executive crux, chronological chapters, and formal mathematical laws.',
  },
  {
    id: 'agent-3',
    code: 'AGENT 03',
    name: 'Visual & Diagram Architect',
    status: 'pending',
    detail: 'Reconstructs interactive SVG system flowcharts, benchmark graphs, and mental models.',
  },
  {
    id: 'agent-4',
    code: 'AGENT 04',
    name: 'Zero-Loss Verification Auditor',
    status: 'pending',
    detail: 'Audits completeness against source timestamps to guarantee 0% watch requirement.',
  },
];

function extractYouTubeEmbedId(url: string): string | null {
  if (!url) return null;
  const match = url.match(
    /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?|shorts|live)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/i
  );
  return match ? match[1] : null;
}

export default function App() {
  const [activeDocument, setActiveDocument] = useState<SynthesizedDocument | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const [transcriptInput, setTranscriptInput] = useState('');
  const [showTranscriptModal, setShowTranscriptModal] = useState(false);

  // Live Multi-Agent Pipeline State
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [agentSteps, setAgentSteps] = useState<AgentStepState[]>(INITIAL_AGENTS);
  const [progressPercent, setProgressPercent] = useState(0);
  const [streamStats, setStreamStats] = useState<{
    chunks: number;
    bytes: number;
    activeAgentId: string;
    recoveredViaFallback: boolean;
  }>({
    chunks: 0,
    bytes: 0,
    activeAgentId: 'agent-1',
    recoveredViaFallback: false,
  });
  const [stageFault, setStageFault] = useState<PipelineStageError | null>(null);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [diagnosticLogs, setDiagnosticLogs] = useState<ApiDiagnosticLogEntry[]>([]);
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  // Dossier Section View Filter ('complete' shows the entire monograph at once)
  const [viewFilter, setViewFilter] = useState<
    'complete' | 'visuals' | 'chapters' | 'formulas'
  >('complete');

  // Video Timestamp Seeking & Embedded Player State
  const [activeSeekSeconds, setActiveSeekSeconds] = useState<number>(0);
  const [activeTimestampLabel, setActiveTimestampLabel] = useState<string>('00:00');
  const [showEmbeddedPlayer, setShowEmbeddedPlayer] = useState<boolean>(true);
  const [theaterPlayerMode, setTheaterPlayerMode] = useState<boolean>(false);

  // Specialist AI Agent Q&A State
  const [chatQuestion, setChatQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState<
    { role: 'user' | 'agent'; text: string; citation?: string }[]
  >([]);
  const [isAskingAgent, setIsAskingAgent] = useState(false);

  // Auth & Cloud Firestore
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [savedDossiers, setSavedDossiers] = useState<SynthesizedDocument[]>([]);
  const [isLoadingSaved, setIsLoadingSaved] = useState(false);
  const [isSavedVaultOpen, setIsSavedVaultOpen] = useState(false);

  // Audio Upload & Transcription
  const [isTranscribingAudio, setIsTranscribingAudio] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      loadSavedDossiers();
    });
    const unsubscribeLogs = apiLogger.subscribe((logs) => {
      setDiagnosticLogs(logs);
    });
    loadSavedDossiers();
    return () => {
      unsubscribeAuth();
      unsubscribeLogs();
    };
  }, []);

  const loadSavedDossiers = async () => {
    setIsLoadingSaved(true);
    try {
      const docs = await fetchRecentDossiers(15);
      setSavedDossiers(docs);
    } catch (err) {
      console.warn('Could not load dossiers from Firestore:', err);
    } finally {
      setIsLoadingSaved(false);
    }
  };

  const openMonographDocument = (doc: SynthesizedDocument) => {
    const normalized = normalizeDossier(doc);
    setActiveDocument(normalized);
    setViewFilter('complete');
    setActiveSeekSeconds(0);
    setActiveTimestampLabel('00:00');
    setShowEmbeddedPlayer(true);
    setTheaterPlayerMode(false);
    setChatHistory([
      {
        role: 'agent',
        text: `Monograph loaded for "${normalized.meta.title}" (${normalized.meta.videoLengthMinutes}m compressed into ${normalized.meta.readingTimeMinutes}m). Ask about any equation, architectural diagram, or chapter timestamp.`,
        citation: '00:00',
      },
    ]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartSynthesis = async (
    overrideUrl?: string,
    overrideTitle?: string,
    overrideTranscript?: string
  ) => {
    const targetUrl = (overrideUrl !== undefined ? overrideUrl : urlInput).trim();
    const finalTranscript =
      overrideTranscript !== undefined ? overrideTranscript : transcriptInput;

    if (!targetUrl && !finalTranscript.trim()) {
      if (inputRef.current) {
        inputRef.current.placeholder = 'Enter a YouTube URL, lecture link, or paste a transcript...';
        inputRef.current.focus();
      }
      return;
    }

    setErrorBanner(null);
    setStageFault(null);
    setIsSynthesizing(true);
    setProgressPercent(10);
    setStreamStats({
      chunks: 0,
      bytes: 0,
      activeAgentId: 'agent-1',
      recoveredViaFallback: false,
    });
    setAgentSteps(
      INITIAL_AGENTS.map((a, idx) =>
        idx === 0
          ? {
              ...a,
              status: 'running',
              detail: 'Establishing NDJSON stream & extracting caption track...',
            }
          : { ...a, status: 'pending' }
      )
    );

    const payload: VideoInput = {
      url: targetUrl || 'Direct Transcript Input',
      rawTranscript: finalTranscript,
      analysisDepth: 'forensic_technical',
      title: overrideTitle,
    };

    try {
      const synthesisResult = await streamVideoSynthesis(payload, {
        onProgress: (event) => {
          if (typeof event.progress === 'number') {
            setProgressPercent(event.progress);
          }
          setAgentSteps((prev) =>
            prev.map((step) => {
              if (step.id === event.agentId) {
                return {
                  ...step,
                  status: event.status,
                  detail: event.detail || step.detail,
                };
              }
              return step;
            })
          );
        },
        onChunkDiagnostic: (diag) => {
          setStreamStats((prev) => ({
            ...prev,
            chunks: diag.chunkIndex,
            bytes: diag.byteOffset,
            activeAgentId: diag.activeAgentId,
          }));
        },
        onStageFault: (fault) => {
          setStageFault(fault);
          setAgentSteps((prev) =>
            prev.map((step) =>
              step.id === fault.agentId
                ? {
                    ...step,
                    status: 'error',
                    detail: `Fault detected (${fault.phase}): ${fault.message}. Engaging recovery...`,
                  }
                : step
            )
          );
        },
      });

      setStreamStats((prev) => ({
        ...prev,
        chunks: synthesisResult.chunksProcessed,
        bytes: synthesisResult.totalBytes,
        recoveredViaFallback: synthesisResult.recoveredViaFallback,
      }));

      const finalDoc = normalizeDossier(synthesisResult.document);
      setIsSynthesizing(false);
      openMonographDocument(finalDoc);

      saveDossierToFirestore(finalDoc, user?.uid)
        .then(() => loadSavedDossiers())
        .catch((e) => console.warn('Firestore save warning:', e));
    } catch (err: any) {
      const faultMessage =
        err instanceof PipelineStageError
          ? `[${err.agentName} · ${err.phase}] ${err.message}`
          : err?.message || 'Could not synthesize video stream.';
      setErrorBanner(faultMessage);
      setIsSynthesizing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name;
    const isText =
      fileName.endsWith('.txt') || fileName.endsWith('.srt') || fileName.endsWith('.vtt');

    if (isText) {
      setUploadStatus(`Ingesting transcript ${fileName}...`);
      const reader = new FileReader();
      reader.onload = async (event) => {
        const text = (event.target?.result as string) || '';
        setTranscriptInput(text);
        setUploadStatus(null);
        handleStartSynthesis(fileName, fileName.replace(/\.[^.]+$/, ''), text);
      };
      reader.readAsText(file);
      return;
    }

    setIsTranscribingAudio(true);
    setUploadStatus(`Transcribing ${fileName} via multimodal pipeline...`);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const result = (event.target?.result as string) || '';
          const base64Data = result.split(',')[1];
          const mimeType = file.type || 'audio/mp3';

          const data = await transcribeAudioFile(base64Data, mimeType);
          setIsTranscribingAudio(false);
          setUploadStatus(null);

          if (data.transcript) {
            setTranscriptInput(data.transcript);
            handleStartSynthesis(fileName, fileName.replace(/\.[^.]+$/, ''), data.transcript);
          } else {
            handleStartSynthesis(fileName, fileName.replace(/\.[^.]+$/, ''));
          }
        } catch (innerErr: any) {
          setIsTranscribingAudio(false);
          setUploadStatus(null);
          setErrorBanner(
            innerErr?.message || 'Audio transcription failed. Try pasting a transcript directly.'
          );
        }
      };
      reader.readAsDataURL(file);
    } catch {
      setIsTranscribingAudio(false);
      setUploadStatus(null);
      setErrorBanner('Could not read uploaded audio file.');
    }
  };

  const handleAskAgent = async (questionText?: string) => {
    const q = (questionText !== undefined ? questionText : chatQuestion).trim();
    if (!q || !activeDocument || isAskingAgent) return;

    if (questionText === undefined) {
      setChatQuestion('');
    }
    setChatHistory((prev) => [...prev, { role: 'user', text: q }]);
    setIsAskingAgent(true);

    try {
      const data = await askVideoSpecialistAgent(q, activeDocument);
      const reply = data.reply || 'No response generated.';
      const citation = data.timestampCitation || '00:00';
      setChatHistory((prev) => [...prev, { role: 'agent', text: reply, citation }]);
      saveChatQuery(activeDocument.id, q, reply, citation);
    } catch (err: any) {
      setChatHistory((prev) => [
        ...prev,
        {
          role: 'agent',
          text:
            err?.message ||
            'Specialist agent connection interrupted. Refer to the extracted chapters and theorems.',
        },
      ]);
    } finally {
      setIsAskingAgent(false);
    }
  };

  const handleSeekTimestamp = (secondsOrLabel: number | string, labelOverride?: string) => {
    let seconds = 0;
    let label = '00:00';
    if (typeof secondsOrLabel === 'number') {
      seconds = secondsOrLabel;
      label = labelOverride || formatSecondsToTimestamp(seconds);
    } else {
      const firstPart = secondsOrLabel.split(' ')[0].replace(/[\[\]]/g, '');
      seconds = parseTimestampToSeconds(firstPart);
      label = firstPart;
    }
    setActiveSeekSeconds(seconds);
    setActiveTimestampLabel(label);
    if (activeDocument && extractYouTubeEmbedId(activeDocument.meta.originalVideoUrl)) {
      setShowEmbeddedPlayer(true);
    }
  };

  const handleDownloadMarkdown = () => {
    if (!activeDocument) return;
    const doc = activeDocument;
    const md = `# ${doc.meta.title}
**Speaker:** ${doc.meta.speaker} | **Domain:** ${doc.meta.primaryDomain}
**Compression:** ${doc.meta.videoLengthMinutes}m video → ${doc.meta.readingTimeMinutes}m monograph (${doc.meta.compressionRatio}% time saved) | **Fidelity:** ${doc.meta.zeroLossFidelityIndex}%

## 1. Executive Thesis
> ${doc.executiveBriefing.oneSentenceCrux}

### Paradigm Shift
${doc.executiveBriefing.paradigmShift}

### High-Stakes Takeaway
${doc.executiveBriefing.highStakesTakeaway}

### Practitioner Directive
${doc.executiveBriefing.targetAudienceActionItem}

## 2. Core Theorems & Mathematical Formulations
${doc.forensicMasterMatrix.coreTheoremsAndFormulas
  .map((t) => `### ${t.name} [${t.timestamp}]\n\`${t.formulaOrLaw}\`\n${t.implications}`)
  .join('\n\n')}

## 3. Chronological Chapters
${doc.chronologicalChapters
  .map(
    (c) =>
      `### [${c.timestamp}] ${c.title} (Salience: ${c.importanceScore}/10)\n${c.denseSummary}\n\n**Technical Vectors:** ${c.technicalNuances.join(' · ')}`
  )
  .join('\n\n')}

## 4. Actionable Playbook
${doc.actionablePlaybook
  .map((s) => `${s.step}. **${s.action}** — ${s.implementationGuide} *(Avoid: ${s.pitfallToAvoid})*`)
  .join('\n')}
`;

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.id || 'vidmash-monograph'}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetToHome = () => {
    setActiveDocument(null);
    setIsSynthesizing(false);
    setErrorBanner(null);
    setStageFault(null);
  };

  const scrollToSection = (id: string) => {
    setViewFilter('complete');
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 30);
  };

  const youtubeEmbedId = activeDocument
    ? extractYouTubeEmbedId(activeDocument.meta.originalVideoUrl)
    : null;

  return (
    <div className="bg-[#F7F6F2] text-[#111111] antialiased min-h-screen flex flex-col selection:bg-[#111111] selection:text-white font-sans">
      <Navbar
        onResetHome={resetToHome}
        user={user}
        onSignIn={signInWithGoogle}
        onSignOut={signOutUser}
        onOpenSavedDossiers={() => setIsSavedVaultOpen(true)}
        savedCount={savedDossiers.length}
        activeDocumentTitle={activeDocument?.meta.title}
      />

      <main className="flex-1 flex flex-col w-full">
        {/* =====================================================================
            VIEW 1: RESEARCH INGESTION & EXEMPLAR WORKBENCH (HOME)
            ===================================================================== */}
        {!activeDocument && !isSynthesizing && (
          <div className="max-w-[1360px] mx-auto w-full px-4 sm:px-8 py-10 sm:py-14 space-y-12">
            {/* Top Editorial Command Deck */}
            <section className="rounded-lg border border-[#E2E0D8] bg-white p-6 sm:p-10 lg:p-12">
              <div className="max-w-3xl">
                <div className="text-[11px] font-mono uppercase tracking-widest text-[#787670] flex flex-wrap items-center gap-2 mb-3">
                  <span className="text-[#111111] font-semibold">4-AGENT SYNTHESIS ENGINE</span>
                  <span>·</span>
                  <span>SHANNON ENTROPY COMPRESSION</span>
                  <span>·</span>
                  <span>0% WATCH REQUIREMENT</span>
                </div>

                <h1 className="font-serif text-3xl sm:text-5xl font-normal tracking-tight text-[#111111] leading-[1.08] mb-4">
                  Distill hours of technical video into a verified research monograph.
                </h1>

                <p className="text-[15px] sm:text-[16px] text-[#4A4945] leading-relaxed max-w-2xl mb-8">
                  Paste any YouTube lecture, keynote URL, audio recording, or raw transcript. Four
                  autonomous agents extract the executive thesis, interactive system topology
                  diagrams, empirical benchmark charts, formal equations, and timestamped chapters.
                </p>
              </div>

              {/* Architectural Command Bar */}
              <div className="max-w-4xl">
                <div className="p-2 bg-[#F7F6F2] border border-[#111111] rounded-lg flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                  <div className="flex items-center px-3 py-1.5 flex-1 min-w-0 bg-white rounded border border-[#E2E0D8]">
                    <span className="material-symbols-outlined text-[#787670] text-[18px] mr-2.5 shrink-0">
                      link
                    </span>
                    <input
                      ref={inputRef}
                      id="video-url-input"
                      type="text"
                      placeholder="Paste YouTube URL or technical lecture link (e.g. https://www.youtube.com/watch?v=...)..."
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleStartSynthesis();
                      }}
                      className="w-full bg-transparent border-none text-[14px] font-mono text-[#111111] placeholder:text-[#787670] placeholder:font-sans focus:outline-none focus:ring-0 py-1"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 justify-end">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept=".mp3,.wav,.m4a,.webm,.ogg,.vtt,.srt,.txt"
                      className="hidden"
                    />

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-2 rounded bg-white border border-[#E2E0D8] hover:border-[#111111] text-[12px] font-medium text-[#111111] transition flex items-center gap-1.5 cursor-pointer"
                      title="Upload audio (.mp3, .wav) or subtitle (.srt, .vtt, .txt)"
                    >
                      <span className="material-symbols-outlined text-[16px] text-[#4A4945]">
                        upload_file
                      </span>
                      <span>Audio / .SRT</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowTranscriptModal(true)}
                      className="px-3 py-2 rounded bg-white border border-[#E2E0D8] hover:border-[#111111] text-[12px] font-medium text-[#111111] transition cursor-pointer"
                      title="Paste raw transcript"
                    >
                      {transcriptInput ? 'Transcript Ready ✓' : 'Paste Transcript'}
                    </button>

                    <button
                      id="synthesize-btn"
                      type="button"
                      onClick={() => handleStartSynthesis()}
                      disabled={isTranscribingAudio}
                      className="px-5 py-2 rounded bg-[#111111] text-white font-mono text-[12px] uppercase tracking-wider font-semibold hover:bg-neutral-800 transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                    >
                      <span>Synthesize</span>
                      <span>→</span>
                    </button>
                  </div>
                </div>

                {/* Status / Error Feedback */}
                {uploadStatus && (
                  <div className="mt-3 px-3.5 py-2 rounded bg-[#EFECE6] border border-[#E2E0D8] text-[12px] font-mono text-[#111111] flex items-center gap-2">
                    <span className="material-symbols-outlined text-[15px] animate-spin">sync</span>
                    <span>{uploadStatus}</span>
                  </div>
                )}

                {errorBanner && (
                  <div className="mt-3 p-3.5 rounded bg-[#FEF2F2] border border-[#FECACA] text-[12.5px] text-[#991B1B] flex items-center justify-between gap-3">
                    <div className="font-mono">
                      <strong className="uppercase mr-2">Pipeline Fault:</strong>
                      <span>{errorBanner}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowDiagnostics((s) => !s)}
                      className="px-2.5 py-1 rounded bg-white border border-[#FECACA] text-[11px] font-mono uppercase shrink-0 cursor-pointer"
                    >
                      {showDiagnostics ? 'Hide Logs' : 'Inspect Stream Logs'}
                    </button>
                  </div>
                )}

                {showDiagnostics && diagnosticLogs.length > 0 && (
                  <div className="mt-3 p-4 rounded bg-[#141413] text-[#F7F6F2] font-mono text-[11px] space-y-1.5 max-h-48 overflow-y-auto">
                    <div className="text-[#787670] uppercase tracking-wider pb-1 border-b border-[#2C2B29]">
                      API Stream Diagnostic Ring Buffer ({diagnosticLogs.length} events)
                    </div>
                    {diagnosticLogs.map((log) => (
                      <div key={log.id} className="flex items-start gap-2">
                        <span className="text-[#787670] shrink-0">
                          {log.timestamp.slice(11, 19)}
                        </span>
                        <span
                          className={`uppercase font-semibold shrink-0 ${
                            log.level === 'error'
                              ? 'text-red-400'
                              : log.level === 'warn'
                              ? 'text-amber-300'
                              : 'text-emerald-400'
                          }`}
                        >
                          [{log.agentId}/{log.phase}]
                        </span>
                        <span className="break-all">{log.message}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 4-Agent Architecture Ledger Strip */}
              <div className="mt-8 pt-6 border-t border-[#E2E0D8] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {INITIAL_AGENTS.map((agent) => (
                  <div key={agent.id} className="space-y-1">
                    <div className="text-[10.5px] font-mono uppercase tracking-wider text-[#787670]">
                      {agent.code}
                    </div>
                    <div className="text-[13.5px] font-semibold text-[#111111]">{agent.name}</div>
                    <p className="text-[12px] text-[#4A4945] leading-relaxed">{agent.detail}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Curated Reference Monographs (Instant Inspection & Live Stream Execution) */}
            <section className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-[#E2E0D8] pb-3">
                <div>
                  <span className="text-[10.5px] font-mono uppercase tracking-widest text-[#787670] block">
                    VERIFIED REFERENCE LIBRARY
                  </span>
                  <h2 className="text-[20px] font-semibold text-[#111111] tracking-tight">
                    Featured Technical Monographs
                  </h2>
                </div>
                <p className="text-[12.5px] text-[#4A4945] font-mono">
                  Inspect a complete multi-agent monograph immediately or run the live stream
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {EXEMPLAR_VIDEOS.map((exemplar, idx) => (
                  <div
                    key={exemplar.id}
                    className="rounded-lg border border-[#E2E0D8] bg-white hover:border-[#111111] transition flex flex-col justify-between overflow-hidden"
                  >
                    <div>
                      {/* Card Top Metadata Bar */}
                      <div className="px-5 py-3 bg-[#FAF9F6] border-b border-[#E2E0D8] flex items-center justify-between gap-2 text-[11px] font-mono">
                        <div className="flex items-center gap-2 text-[#4A4945] truncate">
                          <span className="font-semibold text-[#111111]">MONOGRAPH 0{idx + 1}</span>
                          <span>·</span>
                          <span className="truncate">{exemplar.meta.primaryDomain}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 tabular-nums">
                          <span className="text-[#15803D] font-semibold">
                            {exemplar.meta.zeroLossFidelityIndex}% Fidelity
                          </span>
                          <span>·</span>
                          <span className="text-[#111111] font-semibold">
                            {exemplar.meta.videoLengthMinutes}m → {exemplar.meta.readingTimeMinutes}m
                          </span>
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="p-6 space-y-3">
                        <div className="text-[12px] font-mono text-[#787670]">
                          {exemplar.meta.speaker}
                        </div>
                        <h3 className="font-serif text-[22px] font-normal text-[#111111] leading-snug">
                          {exemplar.meta.title}
                        </h3>
                        <p className="text-[13.5px] text-[#4A4945] line-clamp-3 leading-relaxed">
                          {exemplar.executiveBriefing.oneSentenceCrux}
                        </p>

                        {/* Artifact Inventory */}
                        <div className="pt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-mono text-[#4A4945] tabular-nums">
                          <span>{exemplar.diagrams.length} Architecture Flowcharts</span>
                          <span>·</span>
                          <span>{exemplar.quantitativeGraphs.length} Empirical Charts</span>
                          <span>·</span>
                          <span>
                            {exemplar.forensicMasterMatrix.coreTheoremsAndFormulas.length} Formal
                            Equations
                          </span>
                          <span>·</span>
                          <span>{exemplar.chronologicalChapters.length} Chapters</span>
                        </div>
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="px-6 py-3.5 bg-[#FAF9F6] border-t border-[#E2E0D8] flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => openMonographDocument(exemplar)}
                        className="px-4 py-2 rounded bg-[#111111] text-white text-[12px] font-mono uppercase tracking-wider font-semibold hover:bg-neutral-800 transition cursor-pointer"
                      >
                        Open Complete Monograph →
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setUrlInput(exemplar.meta.originalVideoUrl);
                          handleStartSynthesis(
                            idx === 0
                              ? 'https://youtube.com/watch?v=andrej-karpathy-state-of-gpt'
                              : 'https://youtube.com/watch?v=jensen-huang-blackwell-gpu',
                            exemplar.meta.title
                          );
                        }}
                        className="px-3 py-2 rounded bg-white border border-[#E2E0D8] hover:border-[#111111] text-[#111111] text-[11.5px] font-mono transition cursor-pointer"
                      >
                        Run Live 4-Agent Stream
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Cloud Firestore Recent Vault Preview */}
            {savedDossiers.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center justify-between border-b border-[#E2E0D8] pb-2.5">
                  <span className="text-[11px] font-mono uppercase tracking-widest text-[#787670]">
                    PERSISTENT CLOUD FIRESTORE ARCHIVE ({savedDossiers.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsSavedVaultOpen(true)}
                    className="text-[12px] font-mono text-[#111111] hover:underline cursor-pointer"
                  >
                    Open Full Vault →
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {savedDossiers.slice(0, 3).map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => openMonographDocument(d)}
                      className="p-4 rounded-lg bg-white border border-[#E2E0D8] hover:border-[#111111] transition text-left flex flex-col justify-between gap-2 cursor-pointer"
                    >
                      <div>
                        <div className="text-[10px] font-mono uppercase tracking-wider text-[#787670] flex items-center justify-between">
                          <span className="truncate">{d.meta?.primaryDomain}</span>
                          <span className="tabular-nums text-[#111111] font-semibold shrink-0 ml-2">
                            {d.meta?.videoLengthMinutes}m → {d.meta?.readingTimeMinutes}m
                          </span>
                        </div>
                        <p className="text-[14px] font-semibold text-[#111111] line-clamp-1 mt-1">
                          {d.meta?.title}
                        </p>
                      </div>
                      <p className="text-[11.5px] text-[#4A4945] font-mono truncate">
                        {d.meta?.speaker}
                      </p>
                    </button>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* =====================================================================
            VIEW 2: LIVE MULTI-AGENT NDJSON STREAM TELEMETRY
            ===================================================================== */}
        {isSynthesizing && (
          <section className="flex-1 flex flex-col items-center justify-center px-4 sm:px-8 py-16 max-w-3xl mx-auto w-full">
            <div className="w-full rounded-lg bg-white border border-[#111111] overflow-hidden shadow-sm">
              {/* Top Telemetry Header */}
              <div className="px-6 py-5 bg-[#141413] text-[#F7F6F2] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-[10.5px] font-mono uppercase tracking-widest text-[#A09E97]">
                    NDJSON EVENT-STREAM PIPELINE · ACTIVE
                  </div>
                  <h2 className="text-[19px] font-semibold tracking-tight mt-0.5">
                    Compiling Zero-Loss Video Monograph...
                  </h2>
                </div>
                <div className="text-right font-mono tabular-nums">
                  <span className="text-2xl font-semibold text-white">{progressPercent}%</span>
                  <span className="block text-[10px] text-[#A09E97]">
                    {streamStats.chunks} chunks · {(streamStats.bytes / 1024).toFixed(1)} KB
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-1.5 bg-[#EFECE6]">
                <div
                  className="h-full bg-[#111111] transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* 4-Agent Stage Matrix */}
              <div className="divide-y divide-[#E2E0D8]">
                {agentSteps.map((step) => (
                  <div
                    key={step.id}
                    className={`p-5 transition ${
                      step.status === 'running'
                        ? 'bg-[#FAF9F6]'
                        : step.status === 'error'
                        ? 'bg-[#FEF2F2]'
                        : 'bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="px-2 py-0.5 rounded bg-[#EFECE6] text-[#111111] font-mono text-[10.5px] font-semibold">
                          {step.code}
                        </span>
                        <span className="text-[14px] font-semibold text-[#111111]">
                          {step.name}
                        </span>
                      </div>

                      <span
                        className={`text-[11px] font-mono uppercase tracking-wider font-semibold ${
                          step.status === 'completed'
                            ? 'text-[#15803D]'
                            : step.status === 'running'
                            ? 'text-[#111111]'
                            : step.status === 'error'
                            ? 'text-[#991B1B]'
                            : 'text-[#787670]'
                        }`}
                      >
                        {step.status === 'completed'
                          ? 'VERIFIED ✓'
                          : step.status === 'running'
                          ? 'EXECUTING...'
                          : step.status === 'error'
                          ? 'FAULT / RECOVERING'
                          : 'QUEUED'}
                      </span>
                    </div>
                    <p className="text-[12.5px] text-[#4A4945] font-mono mt-1.5 pl-1">
                      {step.detail}
                    </p>
                  </div>
                ))}
              </div>

              {stageFault && (
                <div className="px-6 py-3 bg-[#FFFBEB] border-t border-[#FDE68A] text-[12px] font-mono text-[#92400E]">
                  Stream Diagnostic: Fault isolated at {stageFault.agentName} ({stageFault.phase}).
                  Automatic fallback recovery engaged.
                </div>
              )}
            </div>
          </section>
        )}

        {/* =====================================================================
            VIEW 3: THE FINAL PRODUCT — FULL-WIDTH RESEARCH MONOGRAPH DOSSIER
            ===================================================================== */}
        {activeDocument && !isSynthesizing && (
          <div className="max-w-[1400px] mx-auto w-full px-4 sm:px-8 py-8 space-y-8">
            {/* 1. MONOGRAPH MASTHEAD & TELEMETRY LEDGER */}
            <header className="rounded-lg border border-[#E2E0D8] bg-white overflow-hidden">
              {/* Top Action & Classification Bar */}
              <div className="px-6 py-3 bg-[#FAF9F6] border-b border-[#E2E0D8] flex flex-wrap items-center justify-between gap-3 no-print">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={resetToHome}
                    className="inline-flex items-center gap-1.5 text-[12px] font-mono uppercase tracking-wider text-[#111111] hover:underline cursor-pointer"
                  >
                    <span>← Workbench</span>
                  </button>
                  <span className="text-[#D5D3CA]">|</span>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#787670]">
                    {activeDocument.meta.primaryDomain}
                  </span>
                </div>

                {/* View Mode Filter + Export Controls */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center bg-[#EFECE6] p-0.5 rounded border border-[#E2E0D8] text-[11px] font-mono">
                    {[
                      { id: 'complete', label: 'Full Monograph' },
                      {
                        id: 'visuals',
                        label: `Diagrams & Charts (${
                          activeDocument.diagrams.length +
                          activeDocument.quantitativeGraphs.length
                        })`,
                      },
                      {
                        id: 'formulas',
                        label: `Theorems & Audit (${
                          activeDocument.forensicMasterMatrix.coreTheoremsAndFormulas.length
                        })`,
                      },
                      {
                        id: 'chapters',
                        label: `Chapters (${activeDocument.chronologicalChapters.length})`,
                      },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setViewFilter(tab.id as any)}
                        className={`px-2.5 py-1 rounded transition cursor-pointer ${
                          viewFilter === tab.id
                            ? 'bg-[#111111] text-white font-semibold'
                            : 'text-[#4A4945] hover:text-[#111111]'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleDownloadMarkdown}
                    className="px-3 py-1 rounded bg-white border border-[#E2E0D8] hover:border-[#111111] text-[11.5px] font-mono text-[#111111] transition cursor-pointer"
                  >
                    Export .MD
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-3 py-1 rounded bg-[#111111] text-white text-[11.5px] font-mono hover:bg-neutral-800 transition cursor-pointer"
                  >
                    Print / PDF
                  </button>
                </div>
              </div>

              {/* Monograph Title & Speaker */}
              <div className="p-6 sm:p-8 lg:p-10 border-b border-[#E2E0D8]">
                <div className="text-[12px] font-mono text-[#4A4945] mb-2 flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-[#111111]">
                    {activeDocument.meta.speaker}
                  </span>
                  <span>·</span>
                  <span>ID: {activeDocument.id}</span>
                  {streamStats.recoveredViaFallback && (
                    <>
                      <span>·</span>
                      <span className="text-[#B45309]">Verified via Direct Transport</span>
                    </>
                  )}
                </div>

                <h1 className="font-serif text-3xl sm:text-4xl lg:text-[42px] font-normal text-[#111111] tracking-tight leading-[1.12] max-w-4xl">
                  {activeDocument.meta.title}
                </h1>
              </div>

              {/* 5-Cell Tabular Telemetry Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-[#E2E0D8] bg-[#FAF9F6] font-mono tabular-nums">
                <div className="p-4">
                  <span className="text-[10px] uppercase tracking-wider text-[#787670] block">
                    Source Video
                  </span>
                  <span className="text-[18px] font-semibold text-[#111111]">
                    {activeDocument.meta.videoLengthMinutes} min
                  </span>
                  <span className="text-[11px] text-[#4A4945] block">
                    {activeDocument.meta.wordCountOriginal.toLocaleString()} words
                  </span>
                </div>

                <div className="p-4">
                  <span className="text-[10px] uppercase tracking-wider text-[#787670] block">
                    Reading Time
                  </span>
                  <span className="text-[18px] font-semibold text-[#111111]">
                    {activeDocument.meta.readingTimeMinutes} min
                  </span>
                  <span className="text-[11px] text-[#15803D] font-semibold block">
                    {activeDocument.meta.compressionRatio}% time saved
                  </span>
                </div>

                <div className="p-4">
                  <span className="text-[10px] uppercase tracking-wider text-[#787670] block">
                    Zero-Loss Index
                  </span>
                  <span className="text-[18px] font-semibold text-[#15803D]">
                    {activeDocument.meta.zeroLossFidelityIndex}%
                  </span>
                  <span className="text-[11px] text-[#4A4945] block">0% watch needed</span>
                </div>

                <div className="p-4">
                  <span className="text-[10px] uppercase tracking-wider text-[#787670] block">
                    Visual Artifacts
                  </span>
                  <span className="text-[18px] font-semibold text-[#111111]">
                    {activeDocument.diagrams.length +
                      activeDocument.quantitativeGraphs.length +
                      activeDocument.illustrationsAndMentalModels.length}
                  </span>
                  <span className="text-[11px] text-[#4A4945] block">
                    {activeDocument.diagrams.length} flows ·{' '}
                    {activeDocument.quantitativeGraphs.length} charts
                  </span>
                </div>

                <div className="p-4 col-span-2 sm:col-span-1">
                  <span className="text-[10px] uppercase tracking-wider text-[#787670] block">
                    Extracted Units
                  </span>
                  <span className="text-[18px] font-semibold text-[#111111]">
                    {activeDocument.chronologicalChapters.length} Ch ·{' '}
                    {activeDocument.forensicMasterMatrix.coreTheoremsAndFormulas.length} Laws
                  </span>
                  <span className="text-[11px] text-[#4A4945] block">
                    {activeDocument.actionablePlaybook.length}-step playbook
                  </span>
                </div>
              </div>
            </header>

            {/* 2. THREE-ZONE ASYMMETRIC MONOGRAPH WORKSPACE */}
            <div className="flex flex-col lg:flex-row items-start gap-7">
              {/* LEFT STICKY RAIL: SOURCE VIDEO PLAYER & TABLE OF CONTENTS */}
              <aside className="w-full lg:w-[270px] shrink-0 lg:sticky lg:top-20 space-y-5 no-print">
                {/* Video Source Reference & Live Embedded Player */}
                <div className="rounded-lg border border-[#E2E0D8] bg-white overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                  <div className="px-4 py-2.5 bg-[#FAF9F6] border-b border-[#E2E0D8] flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#111111] font-semibold">
                      EMBEDDED VIDEO PLAYER
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-[#EFECE6] text-[10.5px] font-mono tabular-nums text-[#111111] font-semibold">
                      [{activeTimestampLabel}]
                    </span>
                  </div>

                  {youtubeEmbedId ? (
                    <div>
                      {showEmbeddedPlayer && !theaterPlayerMode ? (
                        <div className="aspect-video w-full bg-black">
                          <iframe
                            key={`${youtubeEmbedId}-${activeSeekSeconds}`}
                            title={activeDocument.meta.title}
                            src={`https://www.youtube.com/embed/${youtubeEmbedId}?start=${activeSeekSeconds}&rel=0`}
                            className="w-full h-full border-0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      ) : (
                        <div
                          onClick={() => {
                            setShowEmbeddedPlayer(true);
                            setTheaterPlayerMode(false);
                          }}
                          className="relative aspect-video w-full bg-[#141413] cursor-pointer group overflow-hidden flex flex-col justify-between p-3.5 text-[#F7F6F2]"
                        >
                          <div className="flex items-center justify-between text-[9.5px] font-mono text-[#A09E97]">
                            <span>{theaterPlayerMode ? 'THEATER DOCK ACTIVE' : 'VIDEO SIGNAL INDEX'}</span>
                            <span className="tabular-nums text-white">
                              {activeDocument.meta.videoLengthMinutes}m SOURCE
                            </span>
                          </div>

                          <svg
                            viewBox="0 0 240 54"
                            className="w-full h-12 stroke-[#F7F6F2] fill-none opacity-80 group-hover:opacity-100 transition"
                          >
                            <line
                              x1="0"
                              y1="27"
                              x2="240"
                              y2="27"
                              stroke="#2C2B29"
                              strokeWidth="1"
                            />
                            {[
                              12, 22, 34, 18, 42, 30, 14, 38, 46, 20, 28, 40, 16, 36, 44, 24, 15,
                              32, 45, 26, 18, 38, 22, 14,
                            ].map((h, i) => (
                              <rect
                                key={i}
                                x={i * 10 + 3}
                                y={27 - h / 2}
                                width="4"
                                height={h}
                                rx="1"
                                fill={i % 4 === 0 ? '#FFFFFF' : '#787670'}
                              />
                            ))}
                          </svg>

                          <div className="flex items-center justify-between">
                            <span className="px-2.5 py-1 rounded bg-white text-[#111111] font-mono text-[10px] font-semibold uppercase tracking-wider group-hover:bg-[#EFECE6] transition">
                              ▶ Dock in Rail [{activeTimestampLabel}]
                            </span>
                            <span className="text-[10px] font-mono text-[#A09E97]">
                              {youtubeEmbedId}
                            </span>
                          </div>
                        </div>
                      )}
                      <div className="px-3 py-2.5 bg-[#FAF9F6] flex items-center justify-between text-[11px] font-mono border-t border-[#E2E0D8]">
                        <button
                          type="button"
                          onClick={() => setTheaterPlayerMode((v) => !v)}
                          className="text-[#111111] font-medium hover:underline cursor-pointer"
                        >
                          {theaterPlayerMode ? 'Dock in Rail' : 'Expand Theater ⤢'}
                        </button>
                        <a
                          href={`https://www.youtube.com/watch?v=${youtubeEmbedId}&t=${activeSeekSeconds}s`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#4A4945] hover:text-[#111111]"
                        >
                          YouTube ↗
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 text-[12px] text-[#4A4945] font-mono space-y-1">
                      <div className="text-[#111111] font-semibold truncate">
                        {activeDocument.meta.originalVideoUrl}
                      </div>
                      <div className="text-[11px] text-[#787670]">
                        Click any [MM:SS] badge in the monograph to inspect timestamp context.
                      </div>
                    </div>
                  )}
                </div>

                {/* Monograph Table of Contents */}
                <nav className="rounded-lg border border-[#E2E0D8] bg-white overflow-hidden">
                  <div className="px-4 py-2.5 bg-[#FAF9F6] border-b border-[#E2E0D8]">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#787670] font-semibold">
                      MONOGRAPH INDEX
                    </span>
                  </div>
                  <div className="p-2 space-y-0.5 text-[12.5px]">
                    {[
                      { id: 'section-thesis', code: '01', label: 'Executive Thesis & Crux' },
                      {
                        id: 'section-visuals',
                        code: '02',
                        label: `System Topology & Charts (${
                          activeDocument.diagrams.length +
                          activeDocument.quantitativeGraphs.length
                        })`,
                      },
                      {
                        id: 'section-formulas',
                        code: '03',
                        label: `Theorems & Audit (${activeDocument.forensicMasterMatrix.coreTheoremsAndFormulas.length})`,
                      },
                      {
                        id: 'section-chapters',
                        code: '04',
                        label: `Chronological Chapters (${activeDocument.chronologicalChapters.length})`,
                      },
                      {
                        id: 'section-playbook',
                        code: '05',
                        label: `Execution Playbook (${activeDocument.actionablePlaybook.length})`,
                      },
                    ].map((sec) => (
                      <button
                        key={sec.id}
                        type="button"
                        onClick={() => scrollToSection(sec.id)}
                        className="w-full px-2.5 py-2 rounded text-left hover:bg-[#F7F6F2] flex items-center gap-2.5 transition cursor-pointer"
                      >
                        <span className="font-mono text-[10.5px] text-[#787670] tabular-nums">
                          §{sec.code}
                        </span>
                        <span className="text-[#111111] font-medium truncate">{sec.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Quick Chapter Timestamp Jumpers */}
                  <div className="px-4 py-2 bg-[#FAF9F6] border-t border-b border-[#E2E0D8]">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#787670] font-semibold">
                      CHAPTER TIMESTAMPS
                    </span>
                  </div>
                  <div className="p-2 max-h-56 overflow-y-auto space-y-1">
                    {activeDocument.chronologicalChapters.map((ch) => (
                      <button
                        key={ch.id}
                        type="button"
                        onClick={() => {
                          handleSeekTimestamp(ch.seconds, ch.timestamp.split(' ')[0]);
                          const el = document.getElementById(`chapter-${ch.id}`);
                          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }}
                        className="w-full px-2 py-1.5 rounded text-left hover:bg-[#F7F6F2] flex items-baseline gap-2 text-[11.5px] transition cursor-pointer"
                      >
                        <span className="font-mono text-[10.5px] text-[#787670] tabular-nums shrink-0">
                          [{ch.timestamp.split(' ')[0]}]
                        </span>
                        <span className="text-[#4A4945] hover:text-[#111111] truncate">
                          {ch.title}
                        </span>
                      </button>
                    ))}
                  </div>
                </nav>
              </aside>

              {/* CENTER MAIN MONOGRAPH CANVAS */}
              <div className="flex-1 min-w-0 space-y-10">
                {/* OPTIONAL WIDESCREEN THEATER EMBEDDED PLAYER DOCK */}
                {youtubeEmbedId && theaterPlayerMode && (
                  <div className="rounded-lg border border-[#111111] bg-[#141413] overflow-hidden no-print">
                    <div className="px-4 py-2.5 bg-[#141413] border-b border-[#2C2B29] flex items-center justify-between text-[#F7F6F2] text-[11px] font-mono">
                      <span>THEATER SOURCE STREAM · [{activeTimestampLabel}]</span>
                      <button
                        type="button"
                        onClick={() => setTheaterPlayerMode(false)}
                        className="px-2 py-0.5 rounded bg-[#2C2B29] hover:bg-white hover:text-[#111111] transition cursor-pointer"
                      >
                        Minimize to Rail ↙
                      </button>
                    </div>
                    <div className="aspect-video w-full bg-black">
                      <iframe
                        key={`theater-${youtubeEmbedId}-${activeSeekSeconds}`}
                        title={activeDocument.meta.title}
                        src={`https://www.youtube.com/embed/${youtubeEmbedId}?start=${activeSeekSeconds}&autoplay=1&rel=0`}
                        className="w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  </div>
                )}

                {/* SECTION 01: EXECUTIVE THESIS & BRIEFING */}
                {viewFilter === 'complete' && (
                  <section id="section-thesis" className="space-y-5">
                    <div className="border-b border-[#E2E0D8] pb-2 flex items-baseline justify-between">
                      <h2 className="text-[18px] font-semibold text-[#111111] tracking-tight flex items-center gap-2">
                        <span className="font-mono text-[12px] text-[#787670]">§01</span>
                        <span>Executive Thesis & Strategic Synthesis</span>
                      </h2>
                      <span className="text-[11px] font-mono uppercase tracking-wider text-[#787670]">
                        AGENT 02 EPISTEMIC OUTPUT
                      </span>
                    </div>

                    {/* Primary Crux Callout */}
                    <div className="p-6 sm:p-7 rounded-lg bg-white border border-[#E2E0D8] border-l-4 border-l-[#111111]">
                      <span className="text-[10.5px] font-mono uppercase tracking-widest text-[#787670] block mb-2">
                        ONE-SENTENCE CRUX THESIS
                      </span>
                      <p className="font-serif text-[20px] sm:text-[23px] text-[#111111] leading-[1.42]">
                        {activeDocument.executiveBriefing.oneSentenceCrux}
                      </p>
                    </div>

                    {/* Key Metric Highlights Grid */}
                    {activeDocument.executiveBriefing.keyMetricHighlights?.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                        {activeDocument.executiveBriefing.keyMetricHighlights.map((m, idx) => (
                          <div
                            key={`metric-${idx}`}
                            className="p-4 rounded-lg bg-white border border-[#E2E0D8] flex flex-col justify-between gap-1.5"
                          >
                            <span className="text-[10px] font-mono uppercase tracking-wider text-[#787670]">
                              {m.label}
                            </span>
                            <div className="text-[15px] font-mono font-semibold text-[#111111] tabular-nums leading-snug">
                              {m.value}
                            </div>
                            <span className="text-[11.5px] text-[#4A4945] leading-snug">
                              {m.context}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Paradigm Shift & High-Stakes Takeaway */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-6 rounded-lg bg-white border border-[#E2E0D8]">
                        <span className="text-[10.5px] font-mono uppercase tracking-widest text-[#787670] block mb-2">
                          PARADIGM SHIFT
                        </span>
                        <p className="text-[14.5px] text-[#1E1E1C] leading-[1.65]">
                          {activeDocument.executiveBriefing.paradigmShift}
                        </p>
                      </div>

                      <div className="p-6 rounded-lg bg-white border border-[#E2E0D8]">
                        <span className="text-[10.5px] font-mono uppercase tracking-widest text-[#787670] block mb-2">
                          HIGH-STAKES ARCHITECTURAL TAKEAWAY
                        </span>
                        <p className="text-[14.5px] text-[#1E1E1C] leading-[1.65]">
                          {activeDocument.executiveBriefing.highStakesTakeaway}
                        </p>
                      </div>
                    </div>

                    {/* Practitioner Action Directive */}
                    <div className="px-5 py-4 rounded-lg bg-[#141413] text-[#F7F6F2] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-widest text-[#A09E97] block">
                          PRACTITIONER DIRECTIVE
                        </span>
                        <p className="text-[14px] font-medium mt-0.5 leading-relaxed">
                          {activeDocument.executiveBriefing.targetAudienceActionItem}
                        </p>
                      </div>
                    </div>
                  </section>
                )}

                {/* SECTION 02: SYSTEM ARCHITECTURE DIAGRAMS, EMPIRICAL CHARTS & MENTAL MODELS */}
                {(viewFilter === 'complete' || viewFilter === 'visuals') && (
                  <section id="section-visuals" className="space-y-6">
                    <div className="border-b border-[#E2E0D8] pb-2 flex flex-wrap items-baseline justify-between gap-2">
                      <h2 className="text-[18px] font-semibold text-[#111111] tracking-tight flex items-center gap-2">
                        <span className="font-mono text-[12px] text-[#787670]">§02</span>
                        <span>Reconstructed System Topology & Empirical Telemetry</span>
                      </h2>
                      <span className="text-[11px] font-mono uppercase tracking-wider text-[#787670] shrink-0">
                        AGENT 03 VISUAL ARCHITECT
                      </span>
                    </div>

                    {/* Interactive SVG Flowcharts */}
                    <div className="space-y-5">
                      {activeDocument.diagrams.map((diag, idx) => (
                        <InteractiveDiagram key={diag.id} diagram={diag} index={idx} />
                      ))}
                    </div>

                    {/* Quantitative Graphs */}
                    {activeDocument.quantitativeGraphs.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 items-start gap-5">
                        {activeDocument.quantitativeGraphs.map((graph, idx) => (
                          <QuantitativeChart
                            key={graph.id}
                            graph={graph}
                            index={idx}
                            onSeekTimestamp={(ts) => handleSeekTimestamp(ts)}
                          />
                        ))}
                      </div>
                    )}

                    {/* First-Principles Mental Models */}
                    {activeDocument.illustrationsAndMentalModels.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {activeDocument.illustrationsAndMentalModels.map((model, idx) => (
                          <MentalModelCard key={model.id} model={model} index={idx} />
                        ))}
                      </div>
                    )}
                  </section>
                )}

                {/* SECTION 03: CORE THEOREMS, FORMULAS & FORENSIC AUDIT */}
                {(viewFilter === 'complete' || viewFilter === 'formulas') && (
                  <section id="section-formulas" className="space-y-5">
                    <div className="border-b border-[#E2E0D8] pb-2 flex items-baseline justify-between">
                      <h2 className="text-[18px] font-semibold text-[#111111] tracking-tight flex items-center gap-2">
                        <span className="font-mono text-[12px] text-[#787670]">§03</span>
                        <span>Mathematical Formulations, Trade-Offs & Zero-Watch Audit</span>
                      </h2>
                      <span className="text-[11px] font-mono uppercase tracking-wider text-[#787670]">
                        AGENT 04 VERIFICATION MATRIX
                      </span>
                    </div>

                    <ForensicMatrix
                      document={activeDocument}
                      onSeekTimestamp={(ts) => handleSeekTimestamp(ts)}
                    />
                  </section>
                )}

                {/* SECTION 04: CHRONOLOGICAL CHAPTER LEDGER */}
                {(viewFilter === 'complete' || viewFilter === 'chapters') && (
                  <section id="section-chapters" className="space-y-5">
                    <div className="border-b border-[#E2E0D8] pb-2 flex items-baseline justify-between">
                      <h2 className="text-[18px] font-semibold text-[#111111] tracking-tight flex items-center gap-2">
                        <span className="font-mono text-[12px] text-[#787670]">§04</span>
                        <span>Chronological Chapter Monograph</span>
                      </h2>
                      <span className="text-[11px] font-mono uppercase tracking-wider text-[#787670] tabular-nums">
                        {activeDocument.chronologicalChapters.length} VERIFIED CHAPTERS
                      </span>
                    </div>

                    <ChapterTimeline
                      chapters={activeDocument.chronologicalChapters}
                      onSeekTimestamp={(sec, label) => handleSeekTimestamp(sec, label)}
                    />
                  </section>
                )}

                {/* SECTION 05: ACTIONABLE EXECUTION PLAYBOOK */}
                {viewFilter === 'complete' && activeDocument.actionablePlaybook.length > 0 && (
                  <section id="section-playbook" className="space-y-5">
                    <div className="border-b border-[#E2E0D8] pb-2 flex items-baseline justify-between">
                      <h2 className="text-[18px] font-semibold text-[#111111] tracking-tight flex items-center gap-2">
                        <span className="font-mono text-[12px] text-[#787670]">§05</span>
                        <span>Implementation & Execution Playbook</span>
                      </h2>
                      <span className="text-[11px] font-mono uppercase tracking-wider text-[#787670]">
                        OPERATIONAL PROTOCOL
                      </span>
                    </div>

                    <div className="divide-y divide-[#E2E0D8] rounded-lg border border-[#E2E0D8] bg-white overflow-hidden">
                      {activeDocument.actionablePlaybook.map((step) => (
                        <div
                          key={step.step}
                          className="p-5 sm:p-6 flex items-start gap-4 print-break-inside-avoid"
                        >
                          <div className="w-7 h-7 rounded bg-[#111111] text-white font-mono text-[12px] font-semibold tabular-nums flex items-center justify-center shrink-0 mt-0.5">
                            0{step.step}
                          </div>
                          <div className="space-y-1.5 flex-1">
                            <h4 className="text-[15.5px] font-semibold text-[#111111]">
                              {step.action}
                            </h4>
                            <p className="text-[14px] text-[#4A4945] leading-relaxed">
                              {step.implementationGuide}
                            </p>
                            <div className="pt-1 text-[12px] font-mono text-[#991B1B]">
                              <strong className="uppercase tracking-wider">Failure Mode to Avoid: </strong>
                              <span>{step.pitfallToAvoid}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>

              {/* RIGHT STICKY RAIL: DOMAIN SPECIALIST AI AGENT */}
              <aside className="w-full lg:w-[320px] xl:w-[340px] shrink-0 lg:sticky lg:top-20 no-print">
                <div className="rounded-lg border border-[#E2E0D8] bg-white overflow-hidden flex flex-col">
                  {/* Agent Header */}
                  <div className="px-4 py-3.5 bg-[#141413] text-[#F7F6F2]">
                    <div className="text-[10px] font-mono uppercase tracking-widest text-[#A09E97]">
                      INTERACTIVE DOSSIER INTERROGATION
                    </div>
                    <h3 className="text-[14.5px] font-semibold mt-0.5">
                      Domain Specialist Agent
                    </h3>
                  </div>

                  {/* Quick Technical Prompts */}
                  <div className="p-3 bg-[#FAF9F6] border-b border-[#E2E0D8] space-y-1.5">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#787670] block">
                      Quick Probes:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        'Explain the primary mathematical formula',
                        'What are the critical system bottlenecks?',
                        'Summarize the key engineering trade-offs',
                      ].map((probe) => (
                        <button
                          key={probe}
                          type="button"
                          onClick={() => handleAskAgent(probe)}
                          disabled={isAskingAgent}
                          className="text-left px-2 py-1 rounded bg-white border border-[#E2E0D8] hover:border-[#111111] text-[11px] font-mono text-[#111111] transition cursor-pointer disabled:opacity-50"
                        >
                          {probe} →
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Conversation Ledger */}
                  <div className="p-4 space-y-3 max-h-[380px] overflow-y-auto bg-white">
                    {chatHistory.map((m, idx) => (
                      <div
                        key={idx}
                        className={`p-3.5 rounded text-[12.5px] leading-relaxed ${
                          m.role === 'user'
                            ? 'bg-[#111111] text-white font-medium ml-4'
                            : 'bg-[#F7F6F2] border border-[#E2E0D8] text-[#111111]'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{m.text}</p>
                        {m.citation && m.role === 'agent' && (
                          <button
                            type="button"
                            onClick={() => handleSeekTimestamp(m.citation!)}
                            className="inline-block mt-2 px-2 py-0.5 rounded bg-white border border-[#E2E0D8] hover:border-[#111111] text-[10.5px] font-mono tabular-nums text-[#111111] cursor-pointer"
                          >
                            Citation: [{m.citation}]
                          </button>
                        )}
                      </div>
                    ))}
                    {isAskingAgent && (
                      <div className="p-3 rounded bg-[#F7F6F2] border border-[#E2E0D8] text-[11.5px] font-mono text-[#4A4945]">
                        Querying monograph vectors & citations...
                      </div>
                    )}
                  </div>

                  {/* Input Form */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleAskAgent();
                    }}
                    className="p-3 bg-[#FAF9F6] border-t border-[#E2E0D8] flex items-center gap-2"
                  >
                    <input
                      type="text"
                      placeholder="Ask about any formula or chapter..."
                      value={chatQuestion}
                      onChange={(e) => setChatQuestion(e.target.value)}
                      className="flex-1 bg-white border border-[#E2E0D8] rounded px-3 py-2 text-[12.5px] text-[#111111] placeholder:text-[#787670] focus:outline-none focus:border-[#111111]"
                    />
                    <button
                      type="submit"
                      disabled={isAskingAgent || !chatQuestion.trim()}
                      className="px-3.5 py-2 rounded bg-[#111111] text-white text-[11.5px] font-mono uppercase tracking-wider font-semibold hover:bg-neutral-800 transition disabled:opacity-50 cursor-pointer"
                    >
                      Ask
                    </button>
                  </form>
                </div>
              </aside>
            </div>
          </div>
        )}
      </main>

      {/* Firestore Saved Vault Modal */}
      <SavedVaultModal
        isOpen={isSavedVaultOpen}
        onClose={() => setIsSavedVaultOpen(false)}
        savedDossiers={savedDossiers}
        onSelectDossier={(doc) => openMonographDocument(doc)}
        isLoading={isLoadingSaved}
        onRefresh={loadSavedDossiers}
      />

      {/* Paste Transcript Modal */}
      {showTranscriptModal && (
        <div className="fixed inset-0 z-50 bg-[#111111]/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-xl rounded-lg bg-white border border-[#E2E0D8] overflow-hidden shadow-2xl">
            <div className="px-6 py-4 bg-[#FAF9F6] border-b border-[#E2E0D8] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#787670] block">
                  DIRECT CAPTION / TRANSCRIPT INPUT
                </span>
                <h3 className="text-[15px] font-semibold text-[#111111]">
                  Paste Raw Video Transcript
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowTranscriptModal(false)}
                className="px-2 py-1 rounded border border-[#E2E0D8] text-[11px] font-mono text-[#4A4945] hover:text-[#111111] cursor-pointer"
              >
                ESC
              </button>
            </div>

            <div className="p-6 space-y-4">
              <textarea
                rows={8}
                placeholder="Paste timestamped captions or lecture transcript (e.g. [00:00] Introduction to transformer architecture...)..."
                value={transcriptInput}
                onChange={(e) => setTranscriptInput(e.target.value)}
                className="w-full bg-[#F7F6F2] border border-[#E2E0D8] rounded p-3.5 text-[12.5px] text-[#111111] placeholder:text-[#787670] font-mono focus:outline-none focus:border-[#111111]"
              />

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setTranscriptInput('');
                    setShowTranscriptModal(false);
                  }}
                  className="px-4 py-2 rounded border border-[#E2E0D8] text-[12px] font-mono text-[#4A4945] hover:text-[#111111] cursor-pointer"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowTranscriptModal(false);
                    handleStartSynthesis();
                  }}
                  className="px-5 py-2 rounded bg-[#111111] text-white font-mono text-[12px] uppercase tracking-wider font-semibold hover:bg-neutral-800 transition cursor-pointer"
                >
                  Synthesize Transcript →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
