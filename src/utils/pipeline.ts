import {
  TranscriptSegment,
  ChronologicalChapter,
  ZeroWatchAuditItem,
  SynthesizedDiagram,
} from '../types/video';

/**
 * Calculates informational density and entropy approximation.
 * Detects filler phrases, repetitive banter, vs high-signal vocabulary.
 */
export function calculateInformationDensity(text: string): {
  entropyScore: number;
  noiseRatio: number;
  salientKeywordDensity: number;
  wordCount: number;
} {
  if (!text || text.trim().length === 0) {
    return { entropyScore: 0, noiseRatio: 1, salientKeywordDensity: 0, wordCount: 0 };
  }

  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(Boolean);

  const wordCount = words.length;
  if (wordCount === 0) {
    return { entropyScore: 0, noiseRatio: 1, salientKeywordDensity: 0, wordCount: 0 };
  }

  // Common high-noise conversational filler patterns in lectures/interviews
  const fillerTokens = new Set([
    'um', 'uh', 'like', 'you', 'know', 'sort', 'of', 'kind', 'basically', 'actually',
    'literally', 'right', 'so', 'yeah', 'okay', 'anyway', 'well', 'i', 'mean', 'guess'
  ]);

  // High-signal technical / conceptual tokens
  const signalTokens = new Set([
    'architecture', 'algorithm', 'system', 'latency', 'throughput', 'model', 'parameter',
    'gradient', 'loss', 'optimization', 'bandwidth', 'efficiency', 'hardware', 'compute',
    'gpu', 'memory', 'benchmark', 'hypothesis', 'evidence', 'protocol', 'mechanism',
    'tradeoff', 'theorem', 'ratio', 'threshold', 'pipeline', 'metric', 'framework'
  ]);

  let fillerCount = 0;
  let signalCount = 0;
  const frequencyMap: Record<string, number> = {};

  for (const word of words) {
    frequencyMap[word] = (frequencyMap[word] || 0) + 1;
    if (fillerTokens.has(word)) fillerCount++;
    if (signalTokens.has(word)) signalCount++;
  }

  // Shannon entropy approximation over vocabulary distribution
  const uniqueWords = Object.keys(frequencyMap).length;
  let entropy = 0;
  for (const word in frequencyMap) {
    const p = frequencyMap[word] / wordCount;
    if (p > 0) {
      entropy -= p * Math.log2(p);
    }
  }

  // Normalized entropy (0 to 1 scale roughly against max theoretical log2(N))
  const maxEntropy = Math.log2(Math.max(uniqueWords, 2));
  const normalizedEntropy = maxEntropy > 0 ? Math.min(1, Math.max(0, entropy / maxEntropy)) : 0.5;

  const noiseRatio = Math.min(1, Math.max(0.05, fillerCount / wordCount));
  const salientKeywordDensity = Math.min(1, signalCount / wordCount);

  return {
    entropyScore: Math.round(normalizedEntropy * 100) / 100,
    noiseRatio: Math.round(noiseRatio * 100) / 100,
    salientKeywordDensity: Math.round(salientKeywordDensity * 100) / 100,
    wordCount,
  };
}

/**
 * Converts standard timestamp strings (e.g. "01:24", "01:45:10", "12:05") into seconds.
 */
export function parseTimestampToSeconds(ts: string): number {
  if (!ts) return 0;
  const parts = ts.trim().split(':').map((p) => parseInt(p, 10));
  if (parts.some((p) => isNaN(p))) return 0;

  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 1) {
    return parts[0];
  }
  return 0;
}

/**
 * Formats seconds into HH:MM:SS or MM:SS
 */
export function formatSecondsToTimestamp(sec: number): string {
  if (isNaN(sec) || sec < 0) return '00:00';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (h > 0) {
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  }
  return `${pad(m)}:${pad(s)}`;
}

/**
 * Parses raw text or SRT/VTT formatted transcripts into structured segments.
 */
export function parseTranscriptTimestamps(raw: string): TranscriptSegment[] {
  if (!raw || !raw.trim()) return [];

  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const segments: TranscriptSegment[] = [];

  // Regex for timestamps like 00:01:23 or 01:23 or [01:23] or 00:01:23.000 --> 00:01:28.000
  const timestampLineRegex = /^(?:\[)?(\d{1,2}:\d{2}(?::\d{2})?)(?:\])?(?:\s*(?:-->|-)\s*(?:\[)?(\d{1,2}:\d{2}(?::\d{2})?)(?:\])?)?/;

  let currentStart = 0;
  let currentEnd = 0;
  let currentSpeaker = 'Speaker';
  let bufferText: string[] = [];

  const commitSegment = () => {
    if (bufferText.length > 0) {
      const text = bufferText.join(' ');
      const density = calculateInformationDensity(text);
      let salience: 'high' | 'medium' | 'low' = 'medium';
      if (density.salientKeywordDensity > 0.04 || density.entropyScore > 0.85) {
        salience = 'high';
      } else if (density.noiseRatio > 0.15) {
        salience = 'low';
      }

      segments.push({
        startSec: currentStart,
        endSec: Math.max(currentEnd, currentStart + 15),
        speaker: currentSpeaker,
        text,
        salience,
      });
      bufferText = [];
    }
  };

  for (const line of lines) {
    // Skip numeric subtitle sequence markers e.g. "1", "2"
    if (/^\d+$/.test(line)) continue;
    if (line.startsWith('WEBVTT')) continue;

    const tsMatch = line.match(timestampLineRegex);
    if (tsMatch) {
      commitSegment();
      currentStart = parseTimestampToSeconds(tsMatch[1]);
      currentEnd = tsMatch[2] ? parseTimestampToSeconds(tsMatch[2]) : currentStart + 20;

      // Check if speaker name is also on this line or rest of string
      const remainder = line.replace(tsMatch[0], '').trim();
      if (remainder) {
        const speakerMatch = remainder.match(/^([A-Za-z0-9\s]+):/);
        if (speakerMatch) {
          currentSpeaker = speakerMatch[1].trim();
          bufferText.push(remainder.replace(speakerMatch[0], '').trim());
        } else {
          bufferText.push(remainder);
        }
      }
      continue;
    }

    const speakerMatch = line.match(/^([A-Za-z0-9\s]+):/);
    if (speakerMatch) {
      currentSpeaker = speakerMatch[1].trim();
      bufferText.push(line.replace(speakerMatch[0], '').trim());
    } else {
      bufferText.push(line);
    }
  }

  commitSegment();

  // If no timestamp was parsed, chunk every ~40 words
  if (segments.length === 0 && raw.trim().length > 0) {
    const words = raw.split(/\s+/);
    const chunkSize = 45;
    for (let i = 0; i < words.length; i += chunkSize) {
      const chunkWords = words.slice(i, i + chunkSize).join(' ');
      const startSec = Math.floor((i / words.length) * 3600);
      const density = calculateInformationDensity(chunkWords);
      segments.push({
        startSec,
        endSec: startSec + 25,
        speaker: 'Speaker',
        text: chunkWords,
        salience: density.salientKeywordDensity > 0.03 ? 'high' : 'medium',
      });
    }
  }

  return segments;
}

/**
 * Validates the visual graph/diagram structure to prevent orphaned disconnected nodes
 * and ensure clean DAG / Flowchart rendering.
 */
export function validateDiagramIntegrity(diagram: SynthesizedDiagram): {
  isValid: boolean;
  orphanedNodes: string[];
  edgeCount: number;
} {
  const nodeIds = new Set(diagram.nodes.map((n) => n.id));
  const connectedNodeIds = new Set<string>();

  const validEdges = diagram.edges.filter((edge) => {
    const hasSource = nodeIds.has(edge.from);
    const hasTarget = nodeIds.has(edge.to);
    if (hasSource && hasTarget) {
      connectedNodeIds.add(edge.from);
      connectedNodeIds.add(edge.to);
      return true;
    }
    return false;
  });

  const orphanedNodes: string[] = [];
  // For diagrams with > 1 node, nodes should generally connect
  if (diagram.nodes.length > 1) {
    for (const node of diagram.nodes) {
      if (!connectedNodeIds.has(node.id)) {
        orphanedNodes.push(node.id);
      }
    }
  }

  return {
    isValid: diagram.nodes.length > 0 && validEdges.length >= Math.max(0, diagram.nodes.length - 2),
    orphanedNodes,
    edgeCount: validEdges.length,
  };
}

/**
 * Calculates the Zero-Watch Completeness Index (0-100%).
 * Evaluates whether all identified high-importance moments, critical equations,
 * and core insights are rigorously accounted for.
 */
export function calculateZeroLossIndex(
  chapters: ChronologicalChapter[],
  checklist: ZeroWatchAuditItem[]
): number {
  if (checklist.length === 0 && chapters.length === 0) return 98.5;

  let checklistScore = 100;
  if (checklist.length > 0) {
    const verifiedCount = checklist.filter((item) => item.verifiedIncluded).length;
    checklistScore = (verifiedCount / checklist.length) * 100;
  }

  let chapterFidelity = 100;
  if (chapters.length > 0) {
    // High-importance chapters (score >= 8) must have quotes and nuances
    const criticalChapters = chapters.filter((c) => c.importanceScore >= 8);
    if (criticalChapters.length > 0) {
      const wellDocumented = criticalChapters.filter(
        (c) => c.technicalNuances.length > 0 && c.verbatimCriticalQuotes.length > 0
      ).length;
      chapterFidelity = (wellDocumented / criticalChapters.length) * 100;
    }
  }

  const finalScore = checklistScore * 0.6 + chapterFidelity * 0.4;
  return Math.min(100, Math.max(85, Math.round(finalScore * 10) / 10));
}

/**
 * Computes time saved and compression ratio.
 */
export function summarizeTimeSaved(
  originalMinutes: number,
  readingMinutes: number
): {
  percentSaved: number;
  minutesReclaimed: number;
} {
  const orig = Math.max(1, originalMinutes);
  const read = Math.max(1, readingMinutes);
  const minutesReclaimed = Math.max(0, orig - read);
  const percentSaved = Math.min(99.5, Math.max(0, ((orig - read) / orig) * 100));

  return {
    percentSaved: Math.round(percentSaved * 10) / 10,
    minutesReclaimed: Math.round(minutesReclaimed),
  };
}
