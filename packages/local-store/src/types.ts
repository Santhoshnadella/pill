import { Pill, Collection } from '@pill/schemas';

export interface VaultQueryFilter {
  tags?: string[];
  collectionId?: string;
  type?: string;
  includeArchived?: boolean;
}

export interface IVaultStore {
  savePill(pill: Pill): Promise<void>;
  getPill(id: string, ownerId: string): Promise<Pill | null>;
  listPills(ownerId: string, filter?: VaultQueryFilter): Promise<Pill[]>;
  searchPills(ownerId: string, query: string): Promise<Pill[]>;
  deletePill(id: string, ownerId: string): Promise<boolean>;

  saveCollection(collection: Collection): Promise<void>;
  getCollection(id: string, ownerId: string): Promise<Collection | null>;
  listCollections(ownerId: string): Promise<Collection[]>;

  lockVault(ownerId: string): Promise<void>;
  unlockVault(ownerId: string): Promise<void>;
  isUnlocked(ownerId: string): boolean;
  wipeDecryptedCache(ownerId: string): Promise<void>;
}
