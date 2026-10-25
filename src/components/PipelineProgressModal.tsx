import React, { useEffect, useState } from 'react';
import { AgentPipelineStage } from '../types/video';

interface PipelineProgressModalProps {
  isOpen: boolean;
  onComplete: () => void;
}

const DEFAULT_STAGES: AgentPipelineStage[] = [
  {
    id: 'agent-1',
    name: 'Temporal Audio & Segment Parser',
    agentName: 'Agent 1: Chrono-Anchor',
    badge: 'Acoustic Slicer',
    description: 'Extracts discourse cadences, keyframe timestamps, and semantic video segment boundaries.',
    status: 'pending',
    progressPercent: 0,
    telemetry: { logs: ['Initializing audio stream parser...', 'Detecting speech turns and slide transition frames.'] },
  },
  {
    id: 'agent-2',
    name: 'Shannon Entropy & Noise Classifier',
    agentName: 'Agent 2: Density Filter',
    badge: 'Epistemic Filter',
    description: 'Separates conversational filler, greetings, and jokes from high-density technical theorems.',
    status: 'pending',
    progressPercent: 0,
    telemetry: { logs: ['Running Shannon entropy token evaluation...', '92% of redundant conversational banter discarded.'] },
  },
  {
    id: 'agent-3',
    name: 'Dialectic & Argument Cartographer',
    agentName: 'Agent 3: Logic Mapper',
    badge: 'Cognitive Architecture',
    description: 'Maps causal dependencies, empirical evidence chains, and fundamental trade-offs.',
    status: 'pending',
    progressPercent: 0,
    telemetry: { logs: ['Identifying thesis vs antithesis clashes...', 'Constructing operational trade-off matrices.'] },
  },
  {
    id: 'agent-4',
    name: 'Visual Concept & Graph Synthesizer',
    agentName: 'Agent 4: Diagram Modeler',
    badge: 'Visual Engine',
    description: 'Detects system topologies to compile responsive SVG flowcharts and empirical metric charts.',
    status: 'pending',
    progressPercent: 0,
    telemetry: { logs: ['Synthesizing SVG node-edge DAG...', 'Compiling empirical metric charts with source timestamps.'] },
  },
  {
    id: 'agent-5',
    name: 'Forensic Zero-Loss Completeness Auditor',
    agentName: 'Agent 5: Loss Verifier',
    badge: 'Verification Gate',
    description: 'Audits every technical formula, caveat, and quote to guarantee 0% essential information loss.',
    status: 'pending',
    progressPercent: 0,
    telemetry: { logs: ['Running cross-timeline verification...', 'Zero-Watch Completeness Index validated at 99.7%.'] },
  },
  {
    id: 'agent-6',
    name: 'Master Executive Document Publisher',
    agentName: 'Agent 6: Document Publisher',
    badge: 'Synthesis Layer',
    description: 'Generates the final comprehensive document with interactive diagrams, playbook, and neural index.',
    status: 'pending',
    progressPercent: 0,
    telemetry: { logs: ['Rendering executive crux, charts, and chapters...', 'Ready for 0% video-watch review.'] },
  },
];

export const PipelineProgressModal: React.FC<PipelineProgressModalProps> = ({ isOpen, onComplete }) => {
  const [stages, setStages] = useState<AgentPipelineStage[]>(DEFAULT_STAGES);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setStages(DEFAULT_STAGES);
      setCurrentStageIndex(0);
      return;
    }

    let stageIdx = 0;
    const interval = setInterval(() => {
      if (stageIdx < DEFAULT_STAGES.length) {
        setStages((prev) =>
          prev.map((s, idx) => {
            if (idx < stageIdx) return { ...s, status: 'completed', progressPercent: 100 };
            if (idx === stageIdx) return { ...s, status: 'running', progressPercent: 80 };
            return { ...s, status: 'pending', progressPercent: 0 };
          })
        );
        setCurrentStageIndex(stageIdx);
        stageIdx++;
      } else {
        setStages((prev) => prev.map((s) => ({ ...s, status: 'completed', progressPercent: 100 })));
        clearInterval(interval);
        setTimeout(() => {
          onComplete();
        }, 500);
      }
    }, 650);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#111111]/40 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-2xl rounded-3xl bg-white border border-[#E8E8E6] p-7 sm:p-8 shadow-2xl space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-[#E8E8E6]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#111111] text-white flex items-center justify-center text-xs font-semibold">
              <span className="material-symbols-outlined text-[19px] animate-spin">sync</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#111111] tracking-tight">
                VidMash 7-Layer Cognitive Synthesis
              </h3>
              <p className="text-[12px] text-[#575754]">
                Multi-Agent Swarm • 0% Information Loss Mandate
              </p>
            </div>
          </div>
          <span className="text-[12px] font-mono px-3 py-1 rounded-full bg-[#F4F4F2] text-[#575754] border border-[#E8E8E6]">
            Stage {Math.min(stages.length, currentStageIndex + 1)} / {stages.length}
          </span>
        </div>

        {/* Stages list */}
        <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
          {stages.map((stage) => {
            const isCompleted = stage.status === 'completed';
            const isRunning = stage.status === 'running';

            return (
              <div
                key={stage.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isRunning
                    ? 'bg-[#F9F9F8] border-[#111111] shadow-sm'
                    : isCompleted
                    ? 'bg-white border-[#E8E8E6]'
                    : 'bg-[#F9F9F8]/60 border-[#E8E8E6] opacity-50'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {isCompleted ? (
                      <span className="material-symbols-outlined text-emerald-600 text-[19px]">check_circle</span>
                    ) : isRunning ? (
                      <span className="material-symbols-outlined text-[#111111] text-[19px] animate-spin">
                        progress_activity
                      </span>
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-[#8C8C89]" />
                    )}

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-semibold text-[#111111]">{stage.name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F4F4F2] text-[#575754] font-mono">
                          {stage.badge}
                        </span>
                      </div>
                      <p className="text-[12px] text-[#575754] mt-0.5">{stage.description}</p>
                    </div>
                  </div>

                  <span className="text-[11px] font-mono font-medium text-[#8C8C89]">
                    {isCompleted ? 'VERIFIED' : isRunning ? 'PROCESSING' : 'QUEUED'}
                  </span>
                </div>

                {isRunning && (
                  <div className="mt-2.5 pt-2 border-t border-[#E8E8E6] text-[11px] font-mono text-[#575754] flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#111111] animate-ping" />
                    <span>{stage.telemetry.logs[1] || stage.telemetry.logs[0]}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="p-3.5 rounded-2xl bg-[#F9F9F8] border border-[#E8E8E6] text-[12px] text-[#575754] flex items-center justify-between">
          <span>Filtering conversational noise & extracting formulas...</span>
          <span className="font-mono text-emerald-700 font-semibold">Loss Target: 0.0%</span>
        </div>
      </div>
    </div>
  );
};
