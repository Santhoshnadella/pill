import { z } from 'zod';
import { PillTrustLabelSchema } from './pill.js';

export const DestinationTypeSchema = z.enum([
  'ide',
  'ai_chat',
  'clipboard',
  'mcp_client',
  'file_export',
]);
export type DestinationType = z.infer<typeof DestinationTypeSchema>;

export const BundleItemProvenanceSchema = z.object({
  pillId: z.string().uuid(),
  title: z.string(),
  sourceUrl: z.string().nullable().optional(),
  capturedAt: z.string(),
  trustLabel: PillTrustLabelSchema,
});
export type BundleItemProvenance = z.infer<typeof BundleItemProvenanceSchema>;

export const ContextBundleSchema = z.object({
  id: z.string().uuid(),
  schemaVersion: z.literal(1).default(1),
  ownerId: z.string().min(1),
  taskDescription: z.string().min(1).max(1000),
  destination: DestinationTypeSchema,
  selectedPillIds: z.array(z.string().uuid()).min(1),
  provenance: z.array(BundleItemProvenanceSchema),
  tokenBudget: z.number().int().positive(),
  estimatedTokens: z.number().int().nonnegative(),
  compiledText: z.string(),
  warnings: z.array(z.string()).default([]),
  userConsentGranted: z.boolean().default(false),
  createdAt: z.string().datetime(),
  expiresAt: z.string().datetime(),
});
export type ContextBundle = z.infer<typeof ContextBundleSchema>;
