import {
  SyncMutation,
  SyncPushPayload,
  SyncPushResult,
  SyncPullResult,
  SyncEvent,
  SyncConflict,
} from './types.js';
import { DurableSyncQueue } from './queue.js';

export interface ISyncApiClient {
  push(payload: SyncPushPayload): Promise<SyncPushResult>;
  pull(ownerId: string, deviceId: string, cursor: number): Promise<SyncPullResult>;
}

export class SyncEngine {
  public queue: DurableSyncQueue;
  public conflicts: Map<string, SyncConflict> = new Map();
  private cursors: Map<string, number> = new Map(); // Keyed by ownerId:deviceId

  constructor(queue?: DurableSyncQueue) {
    this.queue = queue ?? new DurableSyncQueue();
  }

  private getCursorKey(ownerId: string, deviceId: string): string {
    return `${ownerId}:${deviceId}`;
  }

  getCursor(ownerId: string, deviceId: string): number {
    return this.cursors.get(this.getCursorKey(ownerId, deviceId)) ?? 0;
  }

  setCursor(ownerId: string, deviceId: string, cursor: number): void {
    this.cursors.set(this.getCursorKey(ownerId, deviceId), cursor);
  }

  async pushPending(
    ownerId: string,
    deviceId: string,
    apiClient: ISyncApiClient
  ): Promise<{ pushedCount: number; serverCursor: number }> {
    const batch = this.queue.peekBatch(ownerId, 50);
    if (batch.length === 0) {
      return { pushedCount: 0, serverCursor: this.getCursor(ownerId, deviceId) };
    }

    const ids = batch.map(m => m.id);
    this.queue.markInFlight(ids);

    try {
      const payload: SyncPushPayload = {
        ownerId,
        deviceId,
        mutations: batch,
      };

      const result = await apiClient.push(payload);

      if (result.success) {
        this.queue.markCompleted(ids);
        this.setCursor(ownerId, deviceId, result.serverCursor);
        return { pushedCount: result.appliedCount, serverCursor: result.serverCursor };
      } else {
        // Handle partial or rejected mutations
        for (const rejected of result.rejectedMutations) {
          this.queue.markFailed(rejected.mutationId, rejected.reason);
        }
        return { pushedCount: result.appliedCount, serverCursor: result.serverCursor };
      }
    } catch (err: any) {
      // Network failure / offline
      for (const id of ids) {
        this.queue.markFailed(id, err.message || 'Network error');
      }
      throw err;
    }
  }

  async pullUpdates(
    ownerId: string,
    deviceId: string,
    apiClient: ISyncApiClient
  ): Promise<{ events: SyncEvent[]; newConflicts: SyncConflict[]; newCursor: number }> {
    const currentCursor = this.getCursor(ownerId, deviceId);
    const pullResult = await apiClient.pull(ownerId, deviceId, currentCursor);

    const pendingLocal = this.queue.getAll(ownerId);
    const newConflicts: SyncConflict[] = [];

    // Filter events and detect conflicts
    for (const remoteEvent of pullResult.events) {
      // Ignore remote events that originated from this exact device
      if (remoteEvent.deviceId === deviceId) {
        continue;
      }

      // Check for conflict: Does this entity have an unpushed local edit?
      const localConflicting = pendingLocal.find(
        local => local.entityId === remoteEvent.entityId
      );

      if (localConflicting && localConflicting.revision !== remoteEvent.revision) {
        // Concurrent edit detected! Preserve both to avoid silent data loss
        const conflict: SyncConflict = {
          entityId: remoteEvent.entityId,
          localMutation: localConflicting,
          remoteEvent,
          detectedAt: new Date().toISOString(),
          resolved: false,
        };
        this.conflicts.set(remoteEvent.entityId, conflict);
        newConflicts.push(conflict);
      }
    }

    this.setCursor(ownerId, deviceId, pullResult.serverCursor);
    return {
      events: pullResult.events,
      newConflicts,
      newCursor: pullResult.serverCursor,
    };
  }

  resolveConflict(
    entityId: string,
    strategy: 'keep_local' | 'accept_remote' | 'fork_both'
  ): { resolved: boolean; forkedPayload?: any } {
    const conflict = this.conflicts.get(entityId);
    if (!conflict) {
      return { resolved: false };
    }

    conflict.resolved = true;
    conflict.resolutionStrategy = strategy;

    if (strategy === 'fork_both') {
      // Create a forked copy of the remote pill with conflict indicator
      const remotePayload = conflict.remoteEvent.payload;
      const forkedPayload = {
        ...remotePayload,
        id: globalThis.crypto.randomUUID(),
        title: `${remotePayload.title || 'Untitled'} (Conflicted Remote Copy)`,
        revision: 1,
        createdAt: new Date().toISOString(),
      };
      return { resolved: true, forkedPayload };
    }

    return { resolved: true };
  }
}
