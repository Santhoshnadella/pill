import { Pill, Collection, PillSchema, CollectionSchema } from '@pill/schemas';
import { IVaultStore, VaultQueryFilter } from './types.js';

interface UserVaultPartition {
  unlocked: boolean;
  pills: Map<string, Pill>;
  collections: Map<string, Collection>;
}

export class VaultStore implements IVaultStore {
  // Isolated in-memory vault partitions keyed strictly by ownerId
  private vaults: Map<string, UserVaultPartition> = new Map();

  private getPartition(ownerId: string, autoUnlock = true): UserVaultPartition {
    if (!ownerId) {
      throw new Error('Identity Security Violation: ownerId cannot be empty');
    }

    let partition = this.vaults.get(ownerId);
    if (!partition) {
      partition = {
        unlocked: autoUnlock,
        pills: new Map(),
        collections: new Map(),
      };
      this.vaults.set(ownerId, partition);
    }

    if (!partition.unlocked) {
      throw new Error(`Vault for identity '${ownerId}' is locked. Authentication required.`);
    }

    return partition;
  }

  async savePill(pill: Pill): Promise<void> {
    const validated = PillSchema.parse(pill);
    const partition = this.getPartition(validated.ownerId);
    partition.pills.set(validated.id, validated);
  }

  async getPill(id: string, ownerId: string): Promise<Pill | null> {
    const partition = this.getPartition(ownerId);
    const pill = partition.pills.get(id);
    if (!pill || pill.ownerId !== ownerId) {
      return null;
    }
    return pill;
  }

  async listPills(ownerId: string, filter?: VaultQueryFilter): Promise<Pill[]> {
    const partition = this.getPartition(ownerId);
    let results = Array.from(partition.pills.values()).filter(p => p.ownerId === ownerId);

    if (!filter?.includeArchived) {
      results = results.filter(p => p.archivedAt === null);
    }

    if (filter?.type) {
      results = results.filter(p => p.type === filter.type);
    }

    if (filter?.collectionId) {
      results = results.filter(p => p.collectionIds.includes(filter.collectionId!));
    }

    if (filter?.tags && filter.tags.length > 0) {
      results = results.filter(p => filter.tags!.some(t => p.tags.includes(t)));
    }

    // Sort by updatedAt descending
    return results.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  async searchPills(ownerId: string, query: string): Promise<Pill[]> {
    const partition = this.getPartition(ownerId);
    const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
    if (terms.length === 0) {
      return this.listPills(ownerId);
    }

    const pills = Array.from(partition.pills.values()).filter(
      p => p.ownerId === ownerId && p.archivedAt === null
    );

    // Lexical scoring (matching title, tags, and content)
    const scored = pills.map(pill => {
      let score = 0;
      const titleLower = pill.title.toLowerCase();
      const contentLower = pill.payload.content.toLowerCase();
      const tagsLower = pill.tags.map(t => t.toLowerCase());

      for (const term of terms) {
        if (titleLower.includes(term)) score += 10;
        if (tagsLower.includes(term)) score += 5;
        if (contentLower.includes(term)) score += 2;
      }

      return { pill, score };
    });

    return scored
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(item => item.pill);
  }

  async deletePill(id: string, ownerId: string): Promise<boolean> {
    const partition = this.getPartition(ownerId);
    const pill = partition.pills.get(id);
    if (!pill || pill.ownerId !== ownerId) {
      return false;
    }
    return partition.pills.delete(id);
  }

  async saveCollection(collection: Collection): Promise<void> {
    const validated = CollectionSchema.parse(collection);
    const partition = this.getPartition(validated.ownerId);
    partition.collections.set(validated.id, validated);
  }

  async getCollection(id: string, ownerId: string): Promise<Collection | null> {
    const partition = this.getPartition(ownerId);
    const col = partition.collections.get(id);
    if (!col || col.ownerId !== ownerId) return null;
    return col;
  }

  async listCollections(ownerId: string): Promise<Collection[]> {
    const partition = this.getPartition(ownerId);
    return Array.from(partition.collections.values()).filter(
      c => c.ownerId === ownerId && c.archivedAt === null
    );
  }

  async lockVault(ownerId: string): Promise<void> {
    const partition = this.vaults.get(ownerId);
    if (partition) {
      partition.unlocked = false;
    }
  }

  async unlockVault(ownerId: string): Promise<void> {
    let partition = this.vaults.get(ownerId);
    if (!partition) {
      partition = {
        unlocked: true,
        pills: new Map(),
        collections: new Map(),
      };
      this.vaults.set(ownerId, partition);
    } else {
      partition.unlocked = true;
    }
  }

  isUnlocked(ownerId: string): boolean {
    const partition = this.vaults.get(ownerId);
    return partition ? partition.unlocked : false;
  }

  async wipeDecryptedCache(ownerId: string): Promise<void> {
    const partition = this.vaults.get(ownerId);
    if (partition) {
      partition.pills.clear();
      partition.collections.clear();
      partition.unlocked = false;
    }
  }
}
