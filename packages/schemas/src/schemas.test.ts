import { describe, it, expect } from 'vitest';
import { PillSchema, CollectionSchema, ContextBundleSchema } from './index.js';

describe('Pill Schema Validation', () => {
  it('should validate a valid Pill object', () => {
    const validPill = {
      id: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
      schemaVersion: 1,
      ownerId: 'user_123',
      type: 'note',
      title: 'Context Continuity Architecture',
      payload: {
        format: 'text/markdown',
        content: '# Architecture Overview\nLocal-first design.',
      },
      source: {
        kind: 'manual',
        capturedAt: '2026-10-20T18:00:00.000Z',
      },
      tags: ['architecture', 'local-first'],
      collectionIds: [],
      relationships: [],
      trustLabel: 'user_authored',
      revision: 1,
      createdAt: '2026-10-20T18:00:00.000Z',
      updatedAt: '2026-10-20T18:00:00.000Z',
      archivedAt: null,
    };

    const parsed = PillSchema.safeParse(validPill);
    expect(parsed.success).toBe(true);
  });

  it('should reject Pill missing ownerId (identity isolation)', () => {
    const invalidPill = {
      id: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
      schemaVersion: 1,
      ownerId: '', // Invalid!
      type: 'note',
      title: 'Test',
      payload: { format: 'text/plain', content: 'hello' },
      source: { kind: 'manual', capturedAt: '2026-10-20T18:00:00.000Z' },
      createdAt: '2026-10-20T18:00:00.000Z',
      updatedAt: '2026-10-20T18:00:00.000Z',
    };

    const parsed = PillSchema.safeParse(invalidPill);
    expect(parsed.success).toBe(false);
  });

  it('should validate Collection schema', () => {
    const validCollection = {
      id: 'c1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
      schemaVersion: 1,
      ownerId: 'user_123',
      name: 'Pill Project Research',
      description: 'All pills related to pill.so design',
      color: '#2DD4BF',
      icon: 'folder',
      createdAt: '2026-10-20T18:00:00.000Z',
      updatedAt: '2026-10-20T18:00:00.000Z',
      archivedAt: null,
    };

    const parsed = CollectionSchema.safeParse(validCollection);
    expect(parsed.success).toBe(true);
  });

  it('should validate Context Bundle schema', () => {
    const validBundle = {
      id: 'b1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
      schemaVersion: 1,
      ownerId: 'user_123',
      taskDescription: 'Coding context for IDE',
      destination: 'ide',
      selectedPillIds: ['a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'],
      provenance: [
        {
          pillId: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
          title: 'Architecture Spec',
          capturedAt: '2026-10-20T18:00:00.000Z',
          trustLabel: 'user_authored',
        },
      ],
      tokenBudget: 4000,
      estimatedTokens: 350,
      compiledText: '# Compiled Context\nSource: Architecture Spec',
      warnings: [],
      userConsentGranted: true,
      createdAt: '2026-10-20T18:00:00.000Z',
      expiresAt: '2026-10-20T19:00:00.000Z',
    };

    const parsed = ContextBundleSchema.safeParse(validBundle);
    expect(parsed.success).toBe(true);
  });
});
