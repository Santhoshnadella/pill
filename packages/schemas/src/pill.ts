import { z } from 'zod';

export const PillTypeSchema = z.enum([
  'note',
  'link',
  'selection',
  'code',
  'summary',
  'attachment',
]);
export type PillType = z.infer<typeof PillTypeSchema>;

export const SourceKindSchema = z.enum([
  'manual',
  'browser',
  'ide',
  'mobile',
  'youtube',
  'file',
]);
export type SourceKind = z.infer<typeof SourceKindSchema>;

export const PillSourceSchema = z.object({
  kind: SourceKindSchema,
  url: z.string().url().nullable().optional(),
  title: z.string().nullable().optional(),
  capturedAt: z.string().datetime(),
  author: z.string().nullable().optional(),
  mediaTimestampSec: z.number().nonnegative().nullable().optional(),
});
export type PillSource = z.infer<typeof PillSourceSchema>;

export const PayloadFormatSchema = z.enum([
  'text/markdown',
  'text/plain',
  'code',
  'json',
  'binary_ref',
]);
export type PayloadFormat = z.infer<typeof PayloadFormatSchema>;

export const PillPayloadSchema = z.object({
  format: PayloadFormatSchema,
  content: z.string(),
  language: z.string().optional(),
  blobId: z.string().uuid().nullable().optional(),
  byteSize: z.number().int().nonnegative().optional(),
});
export type PillPayload = z.infer<typeof PillPayloadSchema>;

export const RelationshipTypeSchema = z.enum([
  'supports',
  'derived_from',
  'related_to',
  'supersedes',
]);
export type RelationshipType = z.infer<typeof RelationshipTypeSchema>;

export const PillRelationshipSchema = z.object({
  id: z.string().uuid(),
  targetPillId: z.string().uuid(),
  type: RelationshipTypeSchema,
  createdAt: z.string().datetime(),
});
export type PillRelationship = z.infer<typeof PillRelationshipSchema>;

export const PillTrustLabelSchema = z.enum([
  'user_authored',
  'external_untrusted',
  'ai_generated',
  'credential_warning',
  'sensitive_confidential',
]);
export type PillTrustLabel = z.infer<typeof PillTrustLabelSchema>;

export const PillSchema = z.object({
  id: z.string().uuid(),
  schemaVersion: z.literal(1).default(1),
  ownerId: z.string().min(1, 'ownerId is required for identity isolation'),
  type: PillTypeSchema,
  title: z.string().min(1).max(255),
  payload: PillPayloadSchema,
  source: PillSourceSchema,
  tags: z.array(z.string().min(1).max(50)).default([]),
  collectionIds: z.array(z.string().uuid()).default([]),
  relationships: z.array(PillRelationshipSchema).default([]),
  trustLabel: PillTrustLabelSchema.default('user_authored'),
  revision: z.number().int().positive().default(1),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  archivedAt: z.string().datetime().nullable().default(null),
});
export type Pill = z.infer<typeof PillSchema>;

export const CreatePillInputSchema = PillSchema.omit({
  id: true,
  schemaVersion: true,
  revision: true,
  createdAt: true,
  updatedAt: true,
  archivedAt: true,
}).extend({
  id: z.string().uuid().optional(),
  tags: z.array(z.string()).optional(),
  collectionIds: z.array(z.string().uuid()).optional(),
  relationships: z.array(PillRelationshipSchema).optional(),
  trustLabel: PillTrustLabelSchema.optional(),
});
export type CreatePillInput = z.infer<typeof CreatePillInputSchema>;
