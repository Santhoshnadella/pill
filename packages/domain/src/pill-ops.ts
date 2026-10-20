import {
  Pill,
  CreatePillInput,
  RelationshipType,
  PillRelationship,
  PillSchema,
} from '@pill/schemas';
import { detectSensitiveContent } from './security-ops.js';

export function buildPill(input: CreatePillInput): Pill {
  const now = new Date().toISOString();
  const id = input.id ?? globalThis.crypto.randomUUID();
  
  // Analyze content for potential sensitive credentials or untrusted external markers
  const { warnings, trustLabel } = detectSensitiveContent(input.payload.content);
  
  const pillData = {
    ...input,
    id,
    schemaVersion: 1 as const,
    tags: input.tags ?? [],
    collectionIds: input.collectionIds ?? [],
    relationships: input.relationships ?? [],
    trustLabel: input.trustLabel ?? trustLabel,
    revision: 1,
    createdAt: now,
    updatedAt: now,
    archivedAt: null,
  };

  return PillSchema.parse(pillData);
}

export function updatePill(existing: Pill, patch: Partial<Omit<Pill, 'id' | 'ownerId' | 'createdAt'>>): Pill {
  const now = new Date().toISOString();
  
  const updatedData = {
    ...existing,
    ...patch,
    revision: existing.revision + 1,
    updatedAt: now,
  };

  return PillSchema.parse(updatedData);
}

export function archivePill(existing: Pill): Pill {
  const now = new Date().toISOString();
  return updatePill(existing, {
    archivedAt: now,
  });
}

export function linkPills(source: Pill, targetPillId: string, type: RelationshipType): Pill {
  // Prevent duplicate links of the same type to the same target
  const exists = source.relationships.some(
    r => r.targetPillId === targetPillId && r.type === type
  );

  if (exists) {
    return source;
  }

  const newRel: PillRelationship = {
    id: globalThis.crypto.randomUUID(),
    targetPillId,
    type,
    createdAt: new Date().toISOString(),
  };

  return updatePill(source, {
    relationships: [...source.relationships, newRel],
  });
}
