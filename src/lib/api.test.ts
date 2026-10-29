import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  processSynthesisReadableStream,
  extractBalancedJsonObjects,
  PipelineStageError,
  apiLogger,
} from './api';

function createMockStream(chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  let index = 0;
  return new ReadableStream<Uint8Array>({
    pull(controller) {
      if (index < chunks.length) {
        controller.enqueue(encoder.encode(chunks[index++]));
      } else {
        controller.close();
      }
    },
  });
}

describe('Resilient NDJSON Event-Stream Processor & API Diagnostics (src/lib/api.ts)', () => {
  it('reassembles partial JSON chunks split mid-token across multiple Uint8Array reads and flushes trailing EOF buffer', async () => {
    const progress1 = JSON.stringify({
      type: 'progress',
      agentId: 'agent-1',
      agentName: 'Agent 01 • Ingestion',
      status: 'completed',
      detail: 'Extracted captions',
      progress: 35,
    });
    const progress2 = JSON.stringify({
      type: 'progress',
      agentId: 'agent-2',
      agentName: 'Agent 02 • Thesis',
      status: 'running',
      detail: 'Building crux',
      progress: 65,
    });
    const completePayload = JSON.stringify({
      type: 'complete',
      success: true,
      source: 'gemini_multi_agent_swarm',
      document: {
        id: 'doc-test-123',
        meta: {
          title: 'Split Stream Synthesis Test',
          originalVideoUrl: 'https://youtube.com/watch?v=test',
          videoLengthMinutes: 45,
          readingTimeMinutes: 3,
          wordCountOriginal: 6000,
          wordCountSynthesized: 900,
          compressionRatio: 93,
          zeroLossFidelityIndex: 99.4,
          speaker: 'Test Speaker',
          primaryDomain: 'Systems Engineering',
          analyzedAt: '2026-10-25T00:00:00Z',
        },
      },
    });

    // Deliberately slice strings mid-JSON and omit trailing newline on the final chunk
    const rawStreamString = `${progress1}\n${progress2}\n${completePayload}`;
    const chunks = [
      rawStreamString.slice(0, 27),
      rawStreamString.slice(27, 95),
      rawStreamString.slice(95, 210),
      rawStreamString.slice(210, 340),
      rawStreamString.slice(340),
    ];

    const seenStages: string[] = [];
    const result = await processSynthesisReadableStream(createMockStream(chunks), {
      onProgress: (ev) => {
        seenStages.push(`${ev.agentId}:${ev.status}:${ev.progress}`);
      },
    });

    assert.ok(result.document, 'Expected final document to be reassembled from partial chunks');
    assert.equal(result.document?.id, 'doc-test-123');
    assert.equal(result.document?.meta.title, 'Split Stream Synthesis Test');
    assert.equal(result.chunksProcessed, 5);
    assert.deepEqual(seenStages, ['agent-1:completed:35', 'agent-2:running:65']);
  });

  it('recovers concatenated JSON objects that arrive without newline delimiters', () => {
    const concatenated =
      '{"type":"progress","agentId":"agent-1","progress":25}{"type":"progress","agentId":"agent-2","progress":60}';
    const { parsedObjects, remainder } = extractBalancedJsonObjects(concatenated);
    assert.equal(parsedObjects.length, 2);
    assert.equal(parsedObjects[0].agentId, 'agent-1');
    assert.equal(parsedObjects[1].agentId, 'agent-2');
    assert.equal(remainder, '');
  });

  it('identifies the exact point of failure (agentId & phase) when an agent emits an error or malformed chunk', async () => {
    apiLogger.clear();
    const chunks = [
      JSON.stringify({
        type: 'progress',
        agentId: 'agent-1',
        agentName: 'Agent 01 • Ingestion',
        status: 'completed',
        detail: 'OK',
        progress: 35,
      }) + '\n',
      JSON.stringify({
        type: 'progress',
        agentId: 'agent-3',
        agentName: 'Agent 03 • Visual & Diagram Architect',
        status: 'running',
        detail: 'Constructing topology...',
        progress: 75,
      }) + '\n',
      '{"type":"invalid_corrupted_json_at_agent_3", UNTERMINATED_GARBAGE',
    ];

    await assert.rejects(
      async () => {
        await processSynthesisReadableStream(createMockStream(chunks));
      },
      (err: any) => {
        assert.ok(err instanceof PipelineStageError);
        assert.equal(err.agentId, 'agent-3');
        assert.equal(err.phase, 'ndjson_chunk_parse');
        assert.match(err.message, /Agent 03/);
        return true;
      }
    );

    const lastFailure = apiLogger.getLastFailure();
    assert.ok(lastFailure, 'Expected diagnostic logger to capture the failure');
    assert.equal(lastFailure?.agentId, 'agent-3');
    assert.equal(lastFailure?.phase, 'ndjson_chunk_parse');
  });
});
