import { describe, it, expect, beforeEach } from 'vitest';
import { VaultStore } from './store.js';
import { Pill, Collection } from '@pill/schemas';

describe('VaultStore & Identity Isolation', () => {
  let store: VaultStore;

  const alicePill: Pill = {
    id: '11111111-1111-4111-8111-111111111111',
    schemaVersion: 1,
    ownerId: 'alice',
    type: 'note',
    title: 'Alice Confidential Research',
    payload: {
      format: 'text/markdown',
      content: 'Top secret algorithm research notes.',
    },
    source: {
      kind: 'manual',
      capturedAt: '2026-10-20T18:00:00.000Z',
    },
    tags: ['research', 'confidential'],
    collectionIds: [],
    relationships: [],
    trustLabel: 'user_authored',
    revision: 1,
    createdAt: '2026-10-20T18:00:00.000Z',
    updatedAt: '2026-10-20T18:00:00.000Z',
    archivedAt: null,
  };

  const bobPill: Pill = {
    id: '22222222-2222-4222-8222-222222222222',
    schemaVersion: 1,
    ownerId: 'bob',
    type: 'code',
    title: 'Bob UI Design System',
    payload: {
      format: 'code',
      content: 'const primaryColor = "#2DD4BF";',
    },
    source: {
      kind: 'manual',
      capturedAt: '2026-10-20T18:00:00.000Z',
    },
    tags: ['design', 'ui'],
    collectionIds: [],
    relationships: [],
    trustLabel: 'user_authored',
    revision: 1,
    createdAt: '2026-10-20T18:00:00.000Z',
    updatedAt: '2026-10-20T18:00:00.000Z',
    archivedAt: null,
  };

  beforeEach(() => {
    store = new VaultStore();
  });

  it('should save and retrieve pills within the same identity', async () => {
    await store.savePill(alicePill);
    const retrieved = await store.getPill(alicePill.id, 'alice');
    expect(retrieved).not.toBeNull();
    expect(retrieved?.title).toBe('Alice Confidential Research');
  });

  it('CRITICAL SECURITY: Bob cannot read Alice pill (Identity Isolation)', async () => {
    await store.savePill(alicePill);

    // Bob tries to get Alice's pill ID
    const leakAttempt = await store.getPill(alicePill.id, 'bob');
    expect(leakAttempt).toBeNull();

    // Bob queries his list
    const bobList = await store.listPills('bob');
    expect(bobList.some(p => p.id === alicePill.id)).toBe(false);

    // Bob searches with keywords that exist in Alice's note
    const bobSearch = await store.searchPills('bob', 'Confidential Research');
    expect(bobSearch.length).toBe(0);
  });

  it('should perform lexical search across title, tags, and content', async () => {
    await store.savePill(alicePill);

    // Search by title term
    const titleResults = await store.searchPills('alice', 'Research');
    expect(titleResults.length).toBe(1);

    // Search by tag
    const tagResults = await store.searchPills('alice', 'confidential');
    expect(tagResults.length).toBe(1);

    // Search by content keyword
    const contentResults = await store.searchPills('alice', 'algorithm');
    expect(contentResults.length).toBe(1);

    // Search nonexistent keyword
    const emptyResults = await store.searchPills('alice', 'quantum');
    expect(emptyResults.length).toBe(0);
  });

  it('should lock vault and reject queries until unlocked', async () => {
    await store.savePill(alicePill);
    await store.lockVault('alice');

    expect(store.isUnlocked('alice')).toBe(false);

    await expect(store.getPill(alicePill.id, 'alice')).rejects.toThrow(/locked/);

    await store.unlockVault('alice');
    expect(store.isUnlocked('alice')).toBe(true);
    const afterUnlock = await store.getPill(alicePill.id, 'alice');
    expect(afterUnlock).not.toBeNull();
  });

  it('should wipe decrypted memory cache on logout', async () => {
    await store.savePill(alicePill);
    await store.wipeDecryptedCache('alice');

    expect(store.isUnlocked('alice')).toBe(false);

    await store.unlockVault('alice');
    const afterWipe = await store.getPill(alicePill.id, 'alice');
    expect(afterWipe).toBeNull();
  });
});
