import { describe, it, expect } from 'vitest';
import { buildPill, updatePill, archivePill, linkPills } from './pill-ops.js';
import { detectSensitiveContent } from './security-ops.js';

describe('Domain Operations', () => {
  it('should build a new valid Pill with revision 1', () => {
    const pill = buildPill({
      ownerId: 'user_alice',
      type: 'note',
      title: 'First Thought',
      payload: {
        format: 'text/markdown',
        content: 'This is my captured context.',
      },
      source: {
        kind: 'manual',
        capturedAt: new Date().toISOString(),
      },
    });

    expect(pill.id).toBeDefined();
    expect(pill.revision).toBe(1);
    expect(pill.ownerId).toBe('user_alice');
    expect(pill.trustLabel).toBe('user_authored');
    expect(pill.archivedAt).toBeNull();
  });

  it('should increment revision when updating a Pill', () => {
    const pill = buildPill({
      ownerId: 'user_alice',
      type: 'note',
      title: 'Initial Title',
      payload: {
        format: 'text/markdown',
        content: 'Initial Content',
      },
      source: {
        kind: 'manual',
        capturedAt: new Date().toISOString(),
      },
    });

    const updated = updatePill(pill, {
      title: 'Updated Title',
    });

    expect(updated.revision).toBe(2);
    expect(updated.title).toBe('Updated Title');
    expect(new Date(updated.updatedAt).getTime()).toBeGreaterThanOrEqual(new Date(pill.createdAt).getTime());
  });

  it('should mark a Pill as archived with archivedAt timestamp', () => {
    const pill = buildPill({
      ownerId: 'user_alice',
      type: 'note',
      title: 'To Archive',
      payload: { format: 'text/markdown', content: 'content' },
      source: { kind: 'manual', capturedAt: new Date().toISOString() },
    });

    const archived = archivePill(pill);
    expect(archived.archivedAt).not.toBeNull();
    expect(archived.revision).toBe(2);
  });

  it('should link pills with typed relationships and prevent duplicates', () => {
    const pillA = buildPill({
      ownerId: 'user_alice',
      type: 'note',
      title: 'Pill A',
      payload: { format: 'text/markdown', content: 'Base idea' },
      source: { kind: 'manual', capturedAt: new Date().toISOString() },
    });

    const targetId = 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e';
    const linked = linkPills(pillA, targetId, 'supports');

    expect(linked.relationships.length).toBe(1);
    expect(linked.relationships[0]?.targetPillId).toBe(targetId);
    expect(linked.relationships[0]?.type).toBe('supports');

    // Linking again with the same target and type should be a no-op
    const relinked = linkPills(linked, targetId, 'supports');
    expect(relinked.relationships.length).toBe(1);
  });

  it('should detect sensitive credential patterns and flag trustLabel', () => {
    const sensitiveText = 'export AWS_SECRET_KEY="sk_live_1234567890abcdef123456"';
    const result = detectSensitiveContent(sensitiveText);

    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.trustLabel).toBe('credential_warning');
  });
});
