import { describe, it, expect, beforeEach } from 'vitest';
import { SyncEngine, ISyncApiClient } from './engine.js';
import { DurableSyncQueue } from './queue.js';
import { SyncPushPayload, SyncPushResult, SyncPullResult, SyncEvent } from './types.js';

describe('SyncEngine & Conflict Preservation', () => {
  let queue: DurableSyncQueue;
  let engine: SyncEngine;
  let mockApiClient: ISyncApiClient;

  beforeEach(() => {
    queue = new DurableSyncQueue();
    engine = new SyncEngine(queue);
  });

  it('should enqueue offline mutations with unique idempotency keys', () => {
    const mut1 = queue.enqueue({
      ownerId: 'alice',
      deviceId: 'device_mac',
      type: 'create_pill',
      entityId: '11111111-1111-4111-8111-111111111111',
      payload: { title: 'Offline Note 1' },
      revision: 1,
    });

    const mut2 = queue.enqueue({
      ownerId: 'alice',
      deviceId: 'device_mac',
      type: 'create_pill',
      entityId: '22222222-2222-4222-8222-222222222222',
      payload: { title: 'Offline Note 2' },
      revision: 1,
    });

    expect(mut1.id).toBeDefined();
    expect(mut2.id).toBeDefined();
    expect(mut1.id).not.toBe(mut2.id); // Idempotency keys are unique
    expect(queue.getPendingCount('alice')).toBe(2);
  });

  it('should push pending mutations and update cursor on success', async () => {
    queue.enqueue({
      ownerId: 'alice',
      deviceId: 'device_mac',
      type: 'create_pill',
      entityId: '11111111-1111-4111-8111-111111111111',
      payload: { title: 'Sync Note' },
      revision: 1,
    });

    mockApiClient = {
      push: async (payload: SyncPushPayload): Promise<SyncPushResult> => {
        expect(payload.mutations.length).toBe(1);
        return {
          success: true,
          appliedCount: 1,
          serverCursor: 105,
          rejectedMutations: [],
        };
      },
      pull: async (): Promise<SyncPullResult> => {
        return { serverCursor: 105, hasMore: false, events: [] };
      },
    };

    const pushResult = await engine.pushPending('alice', 'device_mac', mockApiClient);
    expect(pushResult.pushedCount).toBe(1);
    expect(pushResult.serverCursor).toBe(105);
    expect(engine.getCursor('alice', 'device_mac')).toBe(105);
    expect(queue.getPendingCount('alice')).toBe(0); // Queue drained
  });

  it('should preserve queued mutations when network push fails', async () => {
    const mut = queue.enqueue({
      ownerId: 'alice',
      deviceId: 'device_mac',
      type: 'create_pill',
      entityId: '11111111-1111-4111-8111-111111111111',
      payload: { title: 'Failed Sync Note' },
      revision: 1,
    });

    mockApiClient = {
      push: async (): Promise<SyncPushResult> => {
        throw new Error('Connection refused (Offline)');
      },
      pull: async (): Promise<SyncPullResult> => {
        throw new Error('Offline');
      },
    };

    await expect(engine.pushPending('alice', 'device_mac', mockApiClient)).rejects.toThrow(/Offline/);

    // Mutation is still in queue, marked as failed with incremented retry count
    const pending = queue.getAll('alice');
    expect(pending.length).toBe(1);
    expect(pending[0]?.status).toBe('failed');
    expect(pending[0]?.retryCount).toBe(1);

    // Backoff delay calculated
    const backoff = queue.calculateBackoffMs(pending[0]!.retryCount);
    expect(backoff).toBeGreaterThan(500);
  });

  it('should detect concurrent conflicts and preserve both versions without silent loss', async () => {
    const sharedEntityId = '33333333-3333-4333-8333-333333333333';

    // Alice made an edit on local Device A that is still unpushed
    queue.enqueue({
      ownerId: 'alice',
      deviceId: 'device_phone',
      type: 'update_pill',
      entityId: sharedEntityId,
      payload: { title: 'Local Phone Edit' },
      revision: 2,
    });

    // Device A pulls from server and sees an edit made concurrently on Device B (laptop)
    const remoteEvent: SyncEvent = {
      cursor: 120,
      eventId: '44444444-4444-4444-8444-444444444444',
      ownerId: 'alice',
      deviceId: 'device_laptop', // Different device!
      type: 'update_pill',
      entityId: sharedEntityId,
      payload: { title: 'Concurrent Laptop Edit' },
      revision: 3, // Different revision!
      timestamp: new Date().toISOString(),
    };

    mockApiClient = {
      push: async () => ({ success: true, appliedCount: 0, serverCursor: 120, rejectedMutations: [] }),
      pull: async (): Promise<SyncPullResult> => {
        return {
          serverCursor: 120,
          hasMore: false,
          events: [remoteEvent],
        };
      },
    };

    const pullResult = await engine.pullUpdates('alice', 'device_phone', mockApiClient);

    expect(pullResult.events.length).toBe(1);
    expect(pullResult.newConflicts.length).toBe(1);
    expect(pullResult.newConflicts[0]?.entityId).toBe(sharedEntityId);

    // Resolve conflict with 'fork_both' to guarantee zero data loss
    const resolution = engine.resolveConflict(sharedEntityId, 'fork_both');
    expect(resolution.resolved).toBe(true);
    expect(resolution.forkedPayload).toBeDefined();
    expect(resolution.forkedPayload.title).toContain('Conflicted Remote Copy');
  });
});
