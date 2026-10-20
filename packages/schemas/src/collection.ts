import { z } from 'zod';

export const CollectionSchema = z.object({
  id: z.string().uuid(),
  schemaVersion: z.literal(1).default(1),
  ownerId: z.string().min(1, 'ownerId is required for identity isolation'),
  name: z.string().min(1).max(100),
  description: z.string().max(500).default(''),
  color: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/).default('#2DD4BF'),
  icon: z.string().max(50).default('folder'),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  archivedAt: z.string().datetime().nullable().default(null),
});
export type Collection = z.infer<typeof CollectionSchema>;

export const CreateCollectionInputSchema = CollectionSchema.omit({
  id: true,
  schemaVersion: true,
  createdAt: true,
  updatedAt: true,
  archivedAt: true,
}).extend({
  id: z.string().uuid().optional(),
  description: z.string().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
});
export type CreateCollectionInput = z.infer<typeof CreateCollectionInputSchema>;
