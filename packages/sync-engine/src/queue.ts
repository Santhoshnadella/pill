import { SyncMutation, SyncMutationSchema } from './types.js';

export class DurableSyncQueue {
  private queue: Map<string, SyncMutation> = new Map();

  enqueue(mutation: Omit<SyncMutation, 'id' | 'status' | 'retryCount' | 'timestamp'>): SyncMutation {
    const fullMutation: SyncMutation = {
      ...mutation,
      id: globalThis.crypto.randomUUID(), // Stable idempotency key
      status: 'pending',
      retryCount: 0,
      timestamp: new Date().toISOString(),
    };

    const validated = SyncMutationSchema.parse(fullMutation);
    this.queue.set(validated.id, validated);
    return validated;
  }

  peekBatch(ownerId: string, limit = 50): SyncMutation[] {
    const batch: SyncMutation[] = [];
    for (const mutation of this.queue.values()) {
      if (mutation.ownerId === ownerId && (mutation.status === 'pending' || mutation.status === 'failed')) {
        batch.push(mutation);
        if (batch.length >= limit) break;
      }
    }
    return batch;
  }

  markInFlight(ids: string[]): void {
    for (const id of ids) {
      const mut = this.queue.get(id);
      if (mut) {
        mut.status = 'in_flight';
      }
    }
  }

  markCompleted(ids: string[]): void {
    for (const id of ids) {
      this.queue.delete(id);
    }
  }

  markFailed(id: string, error: string): void {
    const mut = this.queue.get(id);
    if (mut) {
      mut.status = 'failed';
      mut.retryCount += 1;
      mut.lastError = error;
    }
  }

  getPendingCount(ownerId: string): number {
    let count = 0;
    for (const mut of this.queue.values()) {
      if (mut.ownerId === ownerId && mut.status !== 'completed') {
        count++;
      }
    }
    return count;
  }

  getAll(ownerId: string): SyncMutation[] {
    return Array.from(this.queue.values()).filter(m => m.ownerId === ownerId);
  }

  clear(ownerId: string): void {
    for (const [id, mut] of this.queue.entries()) {
      if (mut.ownerId === ownerId) {
        this.queue.delete(id);
      }
    }
  }

  calculateBackoffMs(retryCount: number): number {
    // Bounded exponential backoff: 2^retryCount * 500ms + random jitter up to 30 seconds
    const base = Math.min(30000, Math.pow(2, retryCount) * 500);
    const jitter = Math.floor(Math.random() * 250);
    return base + jitter;
  }
}
