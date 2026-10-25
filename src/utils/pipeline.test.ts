import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateInformationDensity,
  parseTimestampToSeconds,
  formatSecondsToTimestamp,
  parseTranscriptTimestamps,
  validateDiagramIntegrity,
  calculateZeroLossIndex,
  summarizeTimeSaved,
} from './pipeline';

test('parseTimestampToSeconds correctly parses MM:SS and HH:MM:SS', () => {
  assert.equal(parseTimestampToSeconds('01:30'), 90);
  assert.equal(parseTimestampToSeconds('01:00:00'), 3600);
  assert.equal(parseTimestampToSeconds('02:15:30'), 8130);
  assert.equal(parseTimestampToSeconds('45'), 45);
  assert.equal(parseTimestampToSeconds('invalid'), 0);
});

test('formatSecondsToTimestamp outputs clean string format', () => {
  assert.equal(formatSecondsToTimestamp(90), '01:30');
  assert.equal(formatSecondsToTimestamp(3600), '01:00:00');
  assert.equal(formatSecondsToTimestamp(8130), '02:15:30');
  assert.equal(formatSecondsToTimestamp(0), '00:00');
});

test('calculateInformationDensity penalizes filler conversational banter and detects signal', () => {
  const noisyBanter = 'um like you know kind of basically like uh yeah sort of you know literally';
  const technicalAnalysis = 'The transformer architecture gradient loss optimization improves bandwidth latency throughput on GPU compute clusters.';

  const noiseResult = calculateInformationDensity(noisyBanter);
  const techResult = calculateInformationDensity(technicalAnalysis);

  assert.ok(noiseResult.noiseRatio > 0.4, 'Noise ratio should be high for filler words');
  assert.ok(techResult.salientKeywordDensity > 0.3, 'Signal keyword density should be high for technical terms');
  assert.ok(techResult.entropyScore > 0, 'Entropy score should be positive');
});

test('parseTranscriptTimestamps parses timestamped text correctly', () => {
  const sample = `
00:00 - 00:30
Speaker: Introduction to GPU cluster architectures.
00:31 - 01:15
Speaker: Next we discuss memory bandwidth bottlenecks.
`;
  const segments = parseTranscriptTimestamps(sample);
  assert.equal(segments.length, 2);
  assert.equal(segments[0].startSec, 0);
  assert.equal(segments[1].startSec, 31);
});

test('validateDiagramIntegrity verifies node connectivity', () => {
  const validDiagram = {
    id: 'd1',
    title: 'Pipeline Flow',
    type: 'flowchart' as const,
    caption: 'Test pipeline',
    explanation: 'Test',
    nodes: [
      { id: 'n1', label: 'Input', role: 'input' as const },
      { id: 'n2', label: 'Process', role: 'process' as const },
      { id: 'n3', label: 'Output', role: 'output' as const },
    ],
    edges: [
      { from: 'n1', to: 'n2' },
      { from: 'n2', to: 'n3' },
    ],
  };

  const validation = validateDiagramIntegrity(validDiagram);
  assert.equal(validation.isValid, true);
  assert.equal(validation.orphanedNodes.length, 0);
  assert.equal(validation.edgeCount, 2);
});

test('calculateZeroLossIndex returns expected high-fidelity metric', () => {
  const chapters = [
    {
      id: 'c1',
      timestamp: '00:00',
      seconds: 0,
      title: 'Chapter 1',
      importanceScore: 9,
      denseSummary: 'Detailed overview',
      verbatimCriticalQuotes: [{ quote: 'Key quote', speaker: 'Host', significance: 'High' }],
      technicalNuances: ['100 TFLOPS FP16'],
    },
  ];
  const checklist = [
    { item: 'Thermal envelope', verifiedIncluded: true, originalVideoTimestamp: '05:20', exactDetail: '400W cap' },
    { item: 'Throughput', verifiedIncluded: true, originalVideoTimestamp: '12:10', exactDetail: '3.2 TB/s' },
  ];

  const score = calculateZeroLossIndex(chapters, checklist);
  assert.ok(score >= 95, 'Score should reflect verified fidelity');
});

test('summarizeTimeSaved computes percentage and minutes saved accurately', () => {
  const result = summarizeTimeSaved(120, 8); // 2 hours video read in 8 minutes
  assert.equal(result.percentSaved, 93.3);
  assert.equal(result.minutesReclaimed, 112);
});
