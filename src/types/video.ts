export type AnalysisDepth = 'executive' | 'comprehensive' | 'forensic_technical';

export interface VideoInput {
  url: string;
  title?: string;
  speaker?: string;
  durationMinutes?: number;
  rawTranscript?: string;
  analysisDepth: AnalysisDepth;
  focusAreas?: string[];
}

export type PipelineStageStatus = 'pending' | 'running' | 'completed' | 'error';

export interface PipelineStageTelemetry {
  inputTokensAnalyzed?: number;
  entropyRatio?: number;
  salientNodesExtracted?: number;
  equationsIdentified?: number;
  diagramCandidates?: number;
  dialecticClashes?: number;
  zeroLossFidelityScore?: number;
  durationMs?: number;
  logs: string[];
}

export interface AgentPipelineStage {
  id: string;
  name: string;
  agentName: string;
  badge: string;
  description: string;
  status: PipelineStageStatus;
  progressPercent: number;
  telemetry: PipelineStageTelemetry;
}

export interface MetricHighlight {
  label: string;
  value: string;
  change?: string;
  context: string;
}

export interface DiagramNode {
  id: string;
  label: string;
  role: 'input' | 'process' | 'decision' | 'output' | 'database';
  detail?: string;
  color?: string;
}

export interface DiagramEdge {
  from: string;
  to: string;
  label?: string;
  style?: 'solid' | 'dashed';
}

export interface SynthesizedDiagram {
  id: string;
  title: string;
  type: 'flowchart' | 'architecture' | 'state_machine' | 'decision_tree' | 'timeline_swimlane';
  caption: string;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  explanation: string;
}

export interface DataPoint {
  label: string;
  value: number;
  secondaryValue?: number;
  annotation?: string;
}

export interface QuantitativeGraph {
  id: string;
  title: string;
  type: 'bar' | 'line' | 'comparison' | 'distribution';
  xAxisLabel: string;
  yAxisLabel: string;
  unit: string;
  dataPoints: DataPoint[];
  insight: string;
  sourceTimestamp: string;
}

export interface IllustrationMentalModel {
  id: string;
  title: string;
  concept: string;
  metaphor: string;
  svgConceptType: 'neural_transformer' | 'hardware_bandwidth' | 'compound_growth' | 'feedback_loop' | 'security_funnel' | 'custom';
  keyInsightQuote: string;
  practicalApplication: string;
}

export interface VerbatimCriticalQuote {
  quote: string;
  speaker: string;
  significance: string;
}

export interface ChronologicalChapter {
  id: string;
  timestamp: string;
  seconds: number;
  title: string;
  importanceScore: number; // 1 to 10
  denseSummary: string;
  verbatimCriticalQuotes: VerbatimCriticalQuote[];
  technicalNuances: string[];
  visualReference?: string;
}

export interface CoreTheoremFormula {
  name: string;
  formulaOrLaw: string;
  implications: string;
  timestamp: string;
}

export interface TradeoffItem {
  dimension: string;
  optionA: string;
  optionB: string;
  winnerOrContext: string;
}

export interface ZeroWatchAuditItem {
  item: string;
  verifiedIncluded: boolean;
  originalVideoTimestamp: string;
  exactDetail: string;
}

export interface ActionablePlaybookItem {
  step: number;
  action: string;
  implementationGuide: string;
  pitfallToAvoid: string;
}

export interface TranscriptSegment {
  startSec: number;
  endSec: number;
  speaker: string;
  text: string;
  salience: 'high' | 'medium' | 'low';
}

export interface SynthesizedDocument {
  id: string;
  meta: {
    title: string;
    originalVideoUrl: string;
    videoLengthMinutes: number;
    readingTimeMinutes: number;
    wordCountOriginal: number;
    wordCountSynthesized: number;
    compressionRatio: number; // e.g. 94.5%
    zeroLossFidelityIndex: number; // e.g. 99.4%
    speaker: string;
    primaryDomain: string;
    analyzedAt: string;
  };
  executiveBriefing: {
    oneSentenceCrux: string;
    paradigmShift: string;
    highStakesTakeaway: string;
    targetAudienceActionItem: string;
    keyMetricHighlights: MetricHighlight[];
  };
  cognitiveArchitectureAudit: {
    discardedNoiseCategories: { category: string; percentDiscarded: number; reason: string }[];
    preservedKnowledgeVectors: { category: string; count: number; importanceRationale: string }[];
    epistemicUncertaintyNotes: string[];
  };
  diagrams: SynthesizedDiagram[];
  quantitativeGraphs: QuantitativeGraph[];
  illustrationsAndMentalModels: IllustrationMentalModel[];
  chronologicalChapters: ChronologicalChapter[];
  forensicMasterMatrix: {
    coreTheoremsAndFormulas: CoreTheoremFormula[];
    tradeoffAnalysis: TradeoffItem[];
    zeroWatchChecklist: ZeroWatchAuditItem[];
  };
  actionablePlaybook: ActionablePlaybookItem[];
  transcriptSegments: TranscriptSegment[];
}
