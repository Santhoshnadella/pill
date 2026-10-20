import { describe, it, expect } from 'vitest';
import { compileContextBundle } from './compiler.js';
import { Pill } from '@pill/schemas';

describe('Context Compiler Pipeline', () => {
  const alicePill1: Pill = {
    id: '11111111-1111-4111-8111-111111111111',
    schemaVersion: 1,
    ownerId: 'alice',
    type: 'note',
    title: 'Architecture Overview',
    payload: {
      format: 'text/markdown',
      content: 'Local-first architecture using SQLite and Cloudflare Workers.',
    },
    source: {
      kind: 'manual',
      url: 'https://pill.so/docs/architecture',
      capturedAt: '2026-10-20T18:00:00.000Z',
    },
    tags: ['architecture'],
    collectionIds: [],
    relationships: [],
    trustLabel: 'user_authored',
    revision: 1,
    createdAt: '2026-10-20T18:00:00.000Z',
    updatedAt: '2026-10-20T18:00:00.000Z',
    archivedAt: null,
  };

  const alicePill2: Pill = {
    id: '22222222-2222-4222-8222-222222222222',
    schemaVersion: 1,
    ownerId: 'alice',
    type: 'code',
    title: 'API Client snippet',
    payload: {
      format: 'code',
      content: 'export const client = new PillApiClient();',
    },
    source: {
      kind: 'ide',
      capturedAt: '2026-10-20T18:05:00.000Z',
    },
    tags: ['api'],
    collectionIds: [],
    relationships: [],
    trustLabel: 'user_authored',
    revision: 1,
    createdAt: '2026-10-20T18:05:00.000Z',
    updatedAt: '2026-10-20T18:05:00.000Z',
    archivedAt: null,
  };

  const bobPill: Pill = {
    id: '33333333-3333-4333-8333-333333333333',
    schemaVersion: 1,
    ownerId: 'bob', // Different owner!
    type: 'note',
    title: 'Bob Secret Notes',
    payload: { format: 'text/plain', content: 'Secret' },
    source: { kind: 'manual', capturedAt: '2026-10-20T18:00:00.000Z' },
    tags: [],
    collectionIds: [],
    relationships: [],
    trustLabel: 'user_authored',
    revision: 1,
    createdAt: '2026-10-20T18:00:00.000Z',
    updatedAt: '2026-10-20T18:00:00.000Z',
    archivedAt: null,
  };

  it('should compile context bundle with exact provenance and headers', () => {
    const bundle = compileContextBundle({
      taskDescription: 'Provide context for IDE coding assistant',
      destination: 'ide',
      ownerId: 'alice',
      selectedPills: [alicePill1, alicePill2],
      tokenBudget: 4000,
    });

    expect(bundle.ownerId).toBe('alice');
    expect(bundle.destination).toBe('ide');
    expect(bundle.provenance.length).toBe(2);
    expect(bundle.provenance[0]?.sourceUrl).toBe('https://pill.so/docs/architecture');
    expect(bundle.compiledText).toContain('Local-first architecture using SQLite');
    expect(bundle.compiledText).toContain('export const client = new PillApiClient()');
  });

  it('should deduplicate identical Pills in selection', () => {
    const bundle = compileContextBundle({
      taskDescription: 'Test dedup',
      destination: 'clipboard',
      ownerId: 'alice',
      selectedPills: [alicePill1, alicePill1], // Duplicated!
    });

    expect(bundle.provenance.length).toBe(1);
    expect(bundle.selectedPillIds.length).toBe(1);
  });

  it('CRITICAL: should throw on cross-account pills', () => {
    expect(() => {
      compileContextBundle({
        taskDescription: 'Exfiltration attempt',
        destination: 'ai_chat',
        ownerId: 'alice',
        selectedPills: [alicePill1, bobPill], // Bob's pill included!
      });
    }).toThrow(/Identity Boundary Violation/);
  });

  it('should enforce token budget and append warning if truncated', () => {
    // Very small budget: 30 tokens
    const bundle = compileContextBundle({
      taskDescription: 'Tiny budget task',
      destination: 'ai_chat',
      ownerId: 'alice',
      selectedPills: [alicePill1, alicePill2],
      tokenBudget: 35,
    });

    expect(bundle.warnings.some(w => w.includes('budget'))).toBe(true);
    expect(bundle.selectedPillIds.length).toBeLessThan(2);
  });

  it('should surface warnings when credential_warning label is present', () => {
    const pillWithSecret: Pill = {
      ...alicePill1,
      id: '44444444-4444-4444-8444-444444444444',
      trustLabel: 'credential_warning',
    };

    const bundle = compileContextBundle({
      taskDescription: 'Export with secret',
      destination: 'clipboard',
      ownerId: 'alice',
      selectedPills: [pillWithSecret],
    });

    expect(bundle.warnings.some(w => w.includes('credentials'))).toBe(true);
  });
});
