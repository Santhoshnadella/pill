import { z } from 'zod';
import { PillSchema, CollectionSchema } from '@pill/schemas';

export const SyncMutationTypeSchema = z.enum([
  'create_pill',
  'update_pill',
  'delete_pill',
  'create_collection',
  'update_collection',
  'delete_collection',
]);
export type SyncMutationType = z.infer<typeof SyncMutationTypeSchema>;

export const SyncMutationStatusSchema = z.enum([
  'pending',
  'in_flight',
  'failed',
  'completed',
]);
export type SyncMutationStatus = z.infer<typeof SyncMutationStatusSchema>;

export const SyncMutationSchema = z.object({
  id: z.string().uuid(), // Idempotency key
  ownerId: z.string().min(1),
  deviceId: z.string().min(1),
  type: SyncMutationTypeSchema,
  entityId: z.string().uuid(),
  payload: z.any(),
  revision: z.number().int().positive(),
  timestamp: z.string().datetime(),
  status: SyncMutationStatusSchema.default('pending'),
  retryCount: z.number().int().nonnegative().default(0),
  lastError: z.string().nullable().optional(),
});
export type SyncMutation = z.infer<typeof SyncMutationSchema>;

export const SyncEventSchema = z.object({
  cursor: z.number().int().positive(),
  eventId: z.string().uuid(),
  ownerId: z.string().min(1),
  deviceId: z.string().min(1),
  type: SyncMutationTypeSchema,
  entityId: z.string().uuid(),
  payload: z.any(),
  revision: z.number().int().positive(),
  timestamp: z.string().datetime(),
});
export type SyncEvent = z.infer<typeof SyncEventSchema>;

export const SyncPushPayloadSchema = z.object({
  ownerId: z.string().min(1),
  deviceId: z.string().min(1),
  mutations: z.array(SyncMutationSchema).max(50), // Batch limit for free-tier safety
});
export type SyncPushPayload = z.infer<typeof SyncPushPayloadSchema>;

export const SyncPushResultSchema = z.object({
  success: z.boolean(),
  appliedCount: z.number().int().nonnegative(),
  serverCursor: z.number().int().nonnegative(),
  rejectedMutations: z.array(z.object({
    mutationId: z.string().uuid(),
    reason: z.string(),
  })).default([]),
});
export type SyncPushResult = z.infer<typeof SyncPushResultSchema>;

export const SyncPullResultSchema = z.object({
  serverCursor: z.number().int().nonnegative(),
  hasMore: z.boolean(),
  events: z.array(SyncEventSchema),
});
export type SyncPullResult = z.infer<typeof SyncPullResultSchema>;

export interface SyncConflict {
  entityId: string;
  localMutation: SyncMutation;
  remoteEvent: SyncEvent;
  detectedAt: string;
  resolved: boolean;
  resolutionStrategy?: 'keep_local' | 'accept_remote' | 'fork_both';
}
