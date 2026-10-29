import { SynthesizedDocument, VideoInput } from '../types/video';

export type AgentStageId =
  | 'agent-1'
  | 'agent-2'
  | 'agent-3'
  | 'agent-4'
  | 'stream-transport'
  | 'unknown';

export type FailurePhase =
  | 'connection'
  | 'http_status'
  | 'ndjson_chunk_parse'
  | 'agent_execution'
  | 'stream_premature_close'
  | 'fallback_recovery'
  | 'audio_transcription'
  | 'specialist_chat';

export interface ApiDiagnosticLogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  endpoint: string;
  phase: FailurePhase | 'lifecycle' | 'stream_chunk';
  agentId: AgentStageId;
  agentName?: string;
  message: string;
  statusCode?: number;
  byteOffset?: number;
  chunkIndex?: number;
  rawPreview?: string;
  durationMs?: number;
}

export class PipelineStageError extends Error {
  public readonly agentId: AgentStageId;
  public readonly agentName: string;
  public readonly phase: FailurePhase;
  public readonly statusCode?: number;
  public readonly rawChunkPreview?: string;
  public readonly byteOffset?: number;
  public readonly recoverable: boolean;

  constructor(params: {
    message: string;
    agentId: AgentStageId;
    agentName?: string;
    phase: FailurePhase;
    statusCode?: number;
    rawChunkPreview?: string;
    byteOffset?: number;
    recoverable?: boolean;
  }) {
    super(params.message);
    this.name = 'PipelineStageError';
    this.agentId = params.agentId;
    this.agentName = params.agentName || getDefaultAgentName(params.agentId);
    this.phase = params.phase;
    this.statusCode = params.statusCode;
    this.rawChunkPreview = params.rawChunkPreview;
    this.byteOffset = params.byteOffset;
    this.recoverable = params.recoverable ?? true;
  }
}

export function getDefaultAgentName(agentId: AgentStageId): string {
  switch (agentId) {
    case 'agent-1':
      return 'Agent 01 · Transcript & Signal Ingestion';
    case 'agent-2':
      return 'Agent 02 · Epistemic & Thesis Architect';
    case 'agent-3':
      return 'Agent 03 · Visual & Diagram Architect';
    case 'agent-4':
      return 'Agent 04 · Zero-Loss Verification Auditor';
    case 'stream-transport':
      return 'NDJSON Stream Transport Layer';
    default:
      return 'Multi-Agent Synthesis Pipeline';
  }
}

class ApiDiagnosticLogger {
  private logs: ApiDiagnosticLogEntry[] = [];
  private maxEntries = 100;
  private listeners: Set<(logs: ApiDiagnosticLogEntry[]) => void> = new Set();

  public record(
    entry: Omit<ApiDiagnosticLogEntry, 'id' | 'timestamp'>
  ): ApiDiagnosticLogEntry {
    const fullEntry: ApiDiagnosticLogEntry = {
      ...entry,
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toISOString(),
    };
    this.logs.push(fullEntry);
    if (this.logs.length > this.maxEntries) {
      this.logs.shift();
    }

    if (entry.level === 'error') {
      console.error(
        `[VidMash API][${entry.endpoint}][${entry.agentId}/${entry.phase}] ${entry.message}`,
        entry.rawPreview ? { rawPreview: entry.rawPreview } : ''
      );
    } else if (entry.level === 'warn') {
      console.warn(
        `[VidMash API][${entry.endpoint}][${entry.agentId}/${entry.phase}] ${entry.message}`
      );
    }

    this.notify();
    return fullEntry;
  }

  public getLogs(): ApiDiagnosticLogEntry[] {
    return [...this.logs];
  }

  public getLastFailure(): ApiDiagnosticLogEntry | null {
    for (let i = this.logs.length - 1; i >= 0; i--) {
      if (this.logs[i].level === 'error') {
        return this.logs[i];
      }
    }
    return null;
  }

  public clear(): void {
    this.logs = [];
    this.notify();
  }

  public subscribe(listener: (logs: ApiDiagnosticLogEntry[]) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    const snapshot = this.getLogs();
    this.listeners.forEach((fn) => fn(snapshot));
  }
}

export const apiLogger = new ApiDiagnosticLogger();

export interface StreamProgressEvent {
  type: 'progress';
  agentId: AgentStageId;
  agentName: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  detail: string;
  progress: number;
}

export interface StreamCompleteEvent {
  type: 'complete';
  success: boolean;
  document: SynthesizedDocument;
  source?: string;
}

export interface StreamErrorEvent {
  type: 'error';
  error: string;
  agentId?: AgentStageId;
  agentName?: string;
  stage?: string;
}

export type SynthesisStreamEvent =
  | StreamProgressEvent
  | StreamCompleteEvent
  | StreamErrorEvent;

/**
 * Extracts balanced top-level JSON objects from a raw string buffer.
 * Used when chunks contain concatenated JSON objects without newline separators
 * or when a line contains trailing/leading non-JSON artifacts.
 */
export function extractBalancedJsonObjects(raw: string): {
  parsedObjects: any[];
  remainder: string;
} {
  const parsedObjects: any[] = [];
  let depth = 0;
  let inString = false;
  let escape = false;
  let objectStart = -1;
  let lastConsumedIndex = 0;

  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (ch === '\\' && inString) {
      escape = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (!inString) {
      if (ch === '{') {
        if (depth === 0) {
          objectStart = i;
        }
        depth++;
      } else if (ch === '}') {
        if (depth > 0) {
          depth--;
          if (depth === 0 && objectStart !== -1) {
            const candidate = raw.slice(objectStart, i + 1);
            try {
              const obj = JSON.parse(candidate);
              parsedObjects.push(obj);
              lastConsumedIndex = i + 1;
              objectStart = -1;
            } catch {
              // Keep scanning if malformed
            }
          }
        }
      }
    }
  }

  const remainder = raw.slice(lastConsumedIndex);
  return { parsedObjects, remainder };
}

export interface StreamProcessorCallbacks {
  onProgress?: (event: StreamProgressEvent) => void;
  onChunkDiagnostic?: (info: {
    chunkIndex: number;
    byteOffset: number;
    activeAgentId: AgentStageId;
  }) => void;
}

export interface StreamProcessorResult {
  document: SynthesizedDocument;
  source: string;
  chunksProcessed: number;
  totalBytes: number;
  recoveredViaFallback: boolean;
  lastAgentId: AgentStageId;
}

/**
 * Resilient NDJSON event-stream processor that buffers partial UTF-8 / JSON chunks,
 * handles multi-chunk split payloads and un-terminated final lines, and attributes
 * any failure to the exact active agent in the 4-stage pipeline.
 */
export async function processSynthesisReadableStream(
  stream: ReadableStream<Uint8Array>,
  callbacks?: StreamProcessorCallbacks,
  endpoint = '/api/analyze-video-stream'
): Promise<{
  document: SynthesizedDocument | null;
  source: string;
  chunksProcessed: number;
  totalBytes: number;
  lastAgentId: AgentStageId;
  lastAgentName: string;
}> {
  const reader = stream.getReader();
  const decoder = new TextDecoder('utf-8');

  let buffer = '';
  let chunkIndex = 0;
  let totalBytes = 0;
  let lastAgentId: AgentStageId = 'agent-1';
  let lastAgentName: string = getDefaultAgentName('agent-1');
  let finalDocument: SynthesizedDocument | null = null;
  let synthesisSource = 'stream';

  const handleParsedEvent = (event: any) => {
    if (!event || typeof event !== 'object') return;

    if (event.type === 'progress') {
      if (event.agentId) {
        lastAgentId = event.agentId as AgentStageId;
      }
      if (event.agentName) {
        lastAgentName = event.agentName;
      }
      callbacks?.onProgress?.({
        type: 'progress',
        agentId: lastAgentId,
        agentName: lastAgentName,
        status: event.status || 'running',
        detail: event.detail || '',
        progress: typeof event.progress === 'number' ? event.progress : 50,
      });
    } else if (event.type === 'complete' && event.document) {
      lastAgentId = 'agent-4';
      lastAgentName = getDefaultAgentName('agent-4');
      finalDocument = event.document;
      synthesisSource = event.source || 'gemini_multi_agent_swarm';
    } else if (event.type === 'error') {
      const errorAgentId = (event.agentId as AgentStageId) || lastAgentId;
      const errorAgentName = event.agentName || lastAgentName;
      apiLogger.record({
        level: 'error',
        endpoint,
        phase: 'agent_execution',
        agentId: errorAgentId,
        agentName: errorAgentName,
        message: `Server reported pipeline error at ${errorAgentName}: ${event.error || 'Unknown error'}`,
        byteOffset: totalBytes,
        chunkIndex,
      });
      throw new PipelineStageError({
        message: event.error || `Failure in ${errorAgentName}`,
        agentId: errorAgentId,
        agentName: errorAgentName,
        phase: 'agent_execution',
        byteOffset: totalBytes,
        recoverable: true,
      });
    }
  };

  const processBufferLines = (isFinalFlush: boolean) => {
    const lines = buffer.split(/\r?\n/);
    // Keep the last potentially incomplete line in buffer unless this is the final flush
    buffer = isFinalFlush ? '' : lines.pop() ?? '';

    for (let i = 0; i < lines.length; i++) {
      const rawLine = lines[i].trim();
      if (!rawLine) continue;

      try {
        const parsed = JSON.parse(rawLine);
        handleParsedEvent(parsed);
      } catch (lineErr: any) {
        // Attempt balanced JSON recovery (handles concatenated objects or partial chunk boundaries)
        const { parsedObjects, remainder } = extractBalancedJsonObjects(rawLine);
        if (parsedObjects.length > 0) {
          for (const obj of parsedObjects) {
            handleParsedEvent(obj);
          }
          if (remainder.trim() && !isFinalFlush) {
            buffer = remainder + (buffer ? '\n' + buffer : '');
          }
        } else if (!isFinalFlush) {
          // The line itself may have been split by an embedded newline inside a string or incomplete chunk;
          // prepend it back to the buffer so the next chunk can complete it.
          const unconsumed = [rawLine, ...lines.slice(i + 1), buffer]
            .filter(Boolean)
            .join('\n');
          buffer = unconsumed;
          return;
        } else {
          const preview = rawLine.slice(0, 180);
          apiLogger.record({
            level: 'error',
            endpoint,
            phase: 'ndjson_chunk_parse',
            agentId: lastAgentId,
            agentName: lastAgentName,
            message: `Unrecoverable JSON parse error during ${lastAgentName}: ${lineErr?.message || 'Malformed JSON'}`,
            byteOffset: totalBytes,
            chunkIndex,
            rawPreview: preview,
          });
          throw new PipelineStageError({
            message: `Malformed JSON chunk while running ${lastAgentName}`,
            agentId: lastAgentId,
            agentName: lastAgentName,
            phase: 'ndjson_chunk_parse',
            rawChunkPreview: preview,
            byteOffset: totalBytes,
            recoverable: true,
          });
        }
      }
    }
  };

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        buffer += decoder.decode();
        if (buffer.trim()) {
          processBufferLines(true);
        }
        break;
      }

      if (value) {
        chunkIndex++;
        totalBytes += value.byteLength;
        buffer += decoder.decode(value, { stream: true });
        callbacks?.onChunkDiagnostic?.({
          chunkIndex,
          byteOffset: totalBytes,
          activeAgentId: lastAgentId,
        });
        processBufferLines(false);
      }
    }
  } finally {
    reader.releaseLock();
  }

  return {
    document: finalDocument,
    source: synthesisSource,
    chunksProcessed: chunkIndex,
    totalBytes,
    lastAgentId,
    lastAgentName,
  };
}

/**
 * Error-handling middleware wrapper for standard JSON API endpoints.
 */
export async function apiRequestWithMiddleware<TResponse>(
  endpoint: string,
  options: RequestInit,
  context: {
    phase: FailurePhase;
    agentId: AgentStageId;
  }
): Promise<TResponse> {
  const startTime = Date.now();
  apiLogger.record({
    level: 'info',
    endpoint,
    phase: 'lifecycle',
    agentId: context.agentId,
    message: `Dispatching ${options.method || 'GET'} ${endpoint}`,
  });

  let response: Response;
  try {
    response = await fetch(endpoint, options);
  } catch (networkErr: any) {
    const durationMs = Date.now() - startTime;
    apiLogger.record({
      level: 'error',
      endpoint,
      phase: 'connection',
      agentId: context.agentId,
      message: `Network connection failed: ${networkErr?.message || 'Fetch error'}`,
      durationMs,
    });
    throw new PipelineStageError({
      message: `Network error connecting to ${endpoint}: ${networkErr?.message || 'Connection refused'}`,
      agentId: context.agentId,
      phase: 'connection',
      recoverable: true,
    });
  }

  const durationMs = Date.now() - startTime;
  const rawText = await response.text();

  if (!response.ok) {
    let errorMessage = `Request to ${endpoint} failed with HTTP ${response.status}`;
    try {
      const errJson = JSON.parse(rawText);
      if (errJson.error) errorMessage = errJson.error;
    } catch {
      if (rawText) errorMessage = `${errorMessage}: ${rawText.slice(0, 120)}`;
    }

    apiLogger.record({
      level: 'error',
      endpoint,
      phase: 'http_status',
      agentId: context.agentId,
      statusCode: response.status,
      message: errorMessage,
      rawPreview: rawText.slice(0, 180),
      durationMs,
    });

    throw new PipelineStageError({
      message: errorMessage,
      agentId: context.agentId,
      phase: 'http_status',
      statusCode: response.status,
      rawChunkPreview: rawText.slice(0, 180),
      recoverable: response.status >= 500 || response.status === 429,
    });
  }

  try {
    const data = JSON.parse(rawText) as TResponse;
    apiLogger.record({
      level: 'info',
      endpoint,
      phase: 'lifecycle',
      agentId: context.agentId,
      statusCode: response.status,
      message: `Completed ${endpoint} in ${durationMs}ms`,
      durationMs,
    });
    return data;
  } catch (parseErr: any) {
    apiLogger.record({
      level: 'error',
      endpoint,
      phase: context.phase,
      agentId: context.agentId,
      statusCode: response.status,
      message: `Invalid JSON response from ${endpoint}: ${parseErr?.message}`,
      rawPreview: rawText.slice(0, 180),
      durationMs,
    });
    throw new PipelineStageError({
      message: `Invalid JSON response from ${endpoint}`,
      agentId: context.agentId,
      phase: context.phase,
      statusCode: response.status,
      rawChunkPreview: rawText.slice(0, 180),
      recoverable: false,
    });
  }
}

/**
 * Primary multi-agent synthesis client.
 * Streams real-time NDJSON agent updates from `/api/analyze-video-stream`,
 * identifies exact agent failure points if the stream faults, and automatically
 * recovers via `/api/analyze-video` if the stream is interrupted or truncated.
 */
export async function streamVideoSynthesis(
  payload: VideoInput,
  callbacks?: StreamProcessorCallbacks & {
    onStageFault?: (fault: PipelineStageError) => void;
  }
): Promise<StreamProcessorResult> {
  const startTime = Date.now();
  const endpoint = '/api/analyze-video-stream';

  apiLogger.record({
    level: 'info',
    endpoint,
    phase: 'lifecycle',
    agentId: 'agent-1',
    message: `Starting 4-Agent synthesis stream for "${payload.url || payload.title || 'Input'}"`,
  });

  let lastKnownAgent: AgentStageId = 'agent-1';

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok || !response.body) {
      const errText = await response.text().catch(() => '');
      throw new PipelineStageError({
        message: `Stream endpoint returned HTTP ${response.status}${errText ? `: ${errText.slice(0, 100)}` : ''}`,
        agentId: 'agent-1',
        phase: 'http_status',
        statusCode: response.status,
        rawChunkPreview: errText.slice(0, 180),
        recoverable: true,
      });
    }

    const result = await processSynthesisReadableStream(
      response.body,
      {
        onProgress: (ev) => {
          lastKnownAgent = ev.agentId;
          callbacks?.onProgress?.(ev);
        },
        onChunkDiagnostic: callbacks?.onChunkDiagnostic,
      },
      endpoint
    );

    lastKnownAgent = result.lastAgentId;

    if (!result.document) {
      throw new PipelineStageError({
        message: `Stream closed prematurely after ${result.chunksProcessed} chunks (${result.totalBytes} bytes) during ${result.lastAgentName} without emitting a complete dossier.`,
        agentId: result.lastAgentId,
        agentName: result.lastAgentName,
        phase: 'stream_premature_close',
        byteOffset: result.totalBytes,
        recoverable: true,
      });
    }

    apiLogger.record({
      level: 'info',
      endpoint,
      phase: 'lifecycle',
      agentId: 'agent-4',
      message: `Stream synthesis completed (${result.chunksProcessed} chunks, ${result.totalBytes} bytes) in ${Date.now() - startTime}ms`,
      byteOffset: result.totalBytes,
      chunkIndex: result.chunksProcessed,
      durationMs: Date.now() - startTime,
    });

    return {
      document: result.document,
      source: result.source,
      chunksProcessed: result.chunksProcessed,
      totalBytes: result.totalBytes,
      recoveredViaFallback: false,
      lastAgentId: 'agent-4',
    };
  } catch (err: any) {
    const stageError: PipelineStageError =
      err instanceof PipelineStageError
        ? err
        : new PipelineStageError({
            message: err?.message || 'Unexpected synthesis stream interruption',
            agentId: lastKnownAgent,
            phase: 'stream_premature_close',
            recoverable: true,
          });

    callbacks?.onStageFault?.(stageError);

    apiLogger.record({
      level: 'warn',
      endpoint: '/api/analyze-video',
      phase: 'fallback_recovery',
      agentId: stageError.agentId,
      agentName: stageError.agentName,
      message: `Stream fault at ${stageError.agentName} (${stageError.phase}). Engaging deterministic fallback via /api/analyze-video...`,
    });

    // Notify UI that recovery is active on the faulted agent
    callbacks?.onProgress?.({
      type: 'progress',
      agentId: stageError.agentId,
      agentName: stageError.agentName,
      status: 'running',
      detail: `Re-synchronizing ${stageError.agentName} via direct JSON transport...`,
      progress: 85,
    });

    const fallbackData = await apiRequestWithMiddleware<{
      success: boolean;
      document?: SynthesizedDocument;
      source?: string;
      error?: string;
    }>(
      '/api/analyze-video',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
      {
        phase: 'fallback_recovery',
        agentId: stageError.agentId,
      }
    );

    if (!fallbackData.document) {
      throw new PipelineStageError({
        message: fallbackData.error || `Failed at ${stageError.agentName} and fallback returned no document`,
        agentId: stageError.agentId,
        agentName: stageError.agentName,
        phase: 'fallback_recovery',
        recoverable: false,
      });
    }

    callbacks?.onProgress?.({
      type: 'progress',
      agentId: 'agent-4',
      agentName: getDefaultAgentName('agent-4'),
      status: 'completed',
      detail: 'Verified Zero-Loss Dossier via resilient recovery transport.',
      progress: 100,
    });

    return {
      document: fallbackData.document,
      source: fallbackData.source || 'fallback_recovery',
      chunksProcessed: 1,
      totalBytes: JSON.stringify(fallbackData.document).length,
      recoveredViaFallback: true,
      lastAgentId: 'agent-4',
    };
  }
}

/**
 * Audio transcription API client with middleware logging.
 */
export async function transcribeAudioFile(
  audioBase64: string,
  mimeType: string
): Promise<{ transcript: string }> {
  return apiRequestWithMiddleware<{ transcript: string }>(
    '/api/transcribe-audio',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ audioBase64, mimeType }),
    },
    {
      phase: 'audio_transcription',
      agentId: 'agent-1',
    }
  );
}

/**
 * Domain Specialist AI Agent Q&A client with middleware logging.
 */
export async function askVideoSpecialistAgent(
  question: string,
  document: SynthesizedDocument
): Promise<{ reply: string; timestampCitation: string }> {
  return apiRequestWithMiddleware<{ reply: string; timestampCitation: string }>(
    '/api/chat-video',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, document }),
    },
    {
      phase: 'specialist_chat',
      agentId: 'agent-2',
    }
  );
}
