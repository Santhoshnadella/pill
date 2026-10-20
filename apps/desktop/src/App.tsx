import React, { useState, useEffect, useMemo } from 'react';
import { Search, Plus, Lock, Layers } from 'lucide-react';
import { Pill, PillType } from '@pill/schemas';
import { buildPill } from '@pill/domain';
import { VaultStore } from '@pill/local-store';
import { Header } from './components/Header.js';
import { PillCard } from './components/PillCard.js';
import { TopicModal } from './components/TopicModal.js';
import { ContextCompilerModal } from './components/ContextCompilerModal.js';

// Sample seed context for Alice and Bob
const INITIAL_ALICE_PILLS = [
  {
    ownerId: 'alice',
    type: 'note' as PillType,
    title: 'Research: SQLite FTS5 Tokenizer & Triggers',
    payload: {
      format: 'text/markdown' as const,
      content: 'FTS5 virtual tables require automatic sync triggers (AFTER INSERT, AFTER DELETE, AFTER UPDATE) on the primary pills table to stay synchronized without duplicate storage.',
    },
    source: {
      kind: 'browser' as const,
      url: 'https://sqlite.org/fts5.html',
      capturedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
    tags: ['research', 'sqlite', 'fts5'],
  },
  {
    ownerId: 'alice',
    type: 'code' as PillType,
    title: 'YouTube to Code: Video Timestamp Snippet',
    payload: {
      format: 'code' as const,
      content: '// Captured from tutorial timestamp 12:34\nconst useSyncQueue = () => {\n  const [queue, setQueue] = useState([]);\n  return { queue, push: (item) => setQueue([...queue, item]) };\n};',
    },
    source: {
      kind: 'youtube' as const,
      url: 'https://youtube.com/watch?v=tutorial_sync_queue&t=754s',
      capturedAt: new Date(Date.now() - 3600000).toISOString(),
    },
    tags: ['youtube', 'react', 'hooks'],
  },
  {
    ownerId: 'alice',
    type: 'link' as PillType,
    title: 'Cloudflare R2 Free Tier & Egress Zero-Cost Docs',
    payload: {
      format: 'text/plain' as const,
      content: 'Cloudflare R2 provides 10GB of storage with zero data egress fees, perfect for user-encrypted context attachments without bandwidth cost spikes.',
    },
    source: {
      kind: 'browser' as const,
      url: 'https://developers.cloudflare.com/r2/pricing/',
      capturedAt: new Date(Date.now() - 1800000).toISOString(),
    },
    tags: ['cloudflare', 'r2', 'pricing'],
  },
];

const INITIAL_BOB_PILLS = [
  {
    ownerId: 'bob',
    type: 'note' as PillType,
    title: 'Bob Design System Guidelines',
    payload: {
      format: 'text/markdown' as const,
      content: 'Deep charcoal background (#0B1012) paired with vibrant teal accents (#2DD4BF) provides a calm, high-contrast workspace for developers.',
    },
    source: {
      kind: 'manual' as const,
      capturedAt: new Date().toISOString(),
    },
    tags: ['design', 'tokens', 'ui'],
  },
];

export const App: React.FC = () => {
  // Vault & Identity State
  const [currentIdentity, setCurrentIdentity] = useState('alice');
  const [isLocked, setIsLocked] = useState(false);
  const [pills, setPills] = useState<Pill[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');

  // Modals
  const [isTopicOpen, setIsTopicOpen] = useState(false);
  const [isCompilerOpen, setIsCompilerOpen] = useState(false);

  // Initialize persistent VaultStore singleton
  const vaultStore = useMemo(() => new VaultStore(), []);

  // Seed sample data on first load
  useEffect(() => {
    const seed = async () => {
      for (const p of INITIAL_ALICE_PILLS) {
        await vaultStore.savePill(buildPill(p));
      }
      for (const p of INITIAL_BOB_PILLS) {
        await vaultStore.savePill(buildPill(p));
      }
      refreshPills('alice');
    };
    seed();
  }, [vaultStore]);

  // Load pills for active identity
  const refreshPills = async (ownerId: string, query?: string) => {
    try {
      if (vaultStore.isUnlocked(ownerId)) {
        if (query && query.trim()) {
          const results = await vaultStore.searchPills(ownerId, query);
          setPills(results);
        } else {
          const results = await vaultStore.listPills(ownerId);
          setPills(results);
        }
      } else {
        setPills([]);
      }
    } catch (err) {
      setPills([]);
    }
  };

  // Switch identity with vault lock and cache clearance
  const handleSwitchIdentity = async (newIdentity: string) => {
    // 1. Lock previous vault & clear decrypted caches
    await vaultStore.lockVault(currentIdentity);
    await vaultStore.wipeDecryptedCache(currentIdentity);

    // 2. Unlock new identity
    await vaultStore.unlockVault(newIdentity);
    setCurrentIdentity(newIdentity);
    setIsLocked(false);
    setSearchQuery('');
    setSelectedType('all');
    refreshPills(newIdentity);
  };

  const handleToggleLock = async () => {
    if (isLocked) {
      await vaultStore.unlockVault(currentIdentity);
      setIsLocked(false);
      refreshPills(currentIdentity, searchQuery);
    } else {
      await vaultStore.lockVault(currentIdentity);
      setIsLocked(true);
      setPills([]);
    }
  };

  // Global Hotkey Listener: Ctrl + Shift + C
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'C' || e.key === 'c')) {
        e.preventDefault();
        setIsTopicOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Save new Pill via Topic Panel
  const handleSavePill = async (data: {
    title: string;
    content: string;
    type: PillType;
    sourceUrl?: string;
    tags: string[];
  }) => {
    const newPill = buildPill({
      ownerId: currentIdentity,
      type: data.type,
      title: data.title,
      payload: {
        format: data.type === 'code' ? 'code' : 'text/markdown',
        content: data.content,
      },
      source: {
        kind: data.sourceUrl ? 'browser' : 'manual',
        url: data.sourceUrl,
        capturedAt: new Date().toISOString(),
      },
      tags: data.tags,
    });

    await vaultStore.savePill(newPill);
    refreshPills(currentIdentity, searchQuery);
  };

  // Delete Pill
  const handleDeletePill = async (id: string) => {
    await vaultStore.deletePill(id, currentIdentity);
    refreshPills(currentIdentity, searchQuery);
  };

  // Filtered pills based on type
  const displayedPills = useMemo(() => {
    if (selectedType === 'all') return pills;
    return pills.filter(p => p.type === selectedType);
  }, [pills, selectedType]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navbar */}
      <Header
        currentIdentity={currentIdentity}
        onSwitchIdentity={handleSwitchIdentity}
        isLocked={isLocked}
        onToggleLock={handleToggleLock}
        onOpenTopic={() => setIsTopicOpen(true)}
        onOpenCompiler={() => setIsCompilerOpen(true)}
        pillCount={pills.length}
      />

      {/* Main Body */}
      <main style={{ flex: 1, padding: '24px 32px', maxWidth: '1280px', margin: '0 auto', width: '100%' }}>
        {/* Vault Locked Screen */}
        {isLocked ? (
          <div className="surface-raised" style={{
            padding: '48px 24px',
            textAlign: 'center',
            maxWidth: '480px',
            margin: '60px auto',
            border: '1px solid var(--pill-danger)',
          }}>
            <Lock size={40} color="var(--pill-danger)" style={{ marginBottom: '16px' }} />
            <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px' }}>
              Vault Locked ({currentIdentity})
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--pill-text-muted)', marginBottom: '20px', lineHeight: 1.5 }}>
              Active memory buffers have been flushed. In accordance with zero-leak identity isolation, no private context is accessible until unlocked.
            </p>
            <button className="btn-primary" onClick={handleToggleLock}>
              Unlock Vault for {currentIdentity}
            </button>
          </div>
        ) : (
          <>
            {/* Top Search & Filter Bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
              {/* Search input */}
              <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: 'var(--pill-surface)',
                border: '1px solid var(--pill-border)',
                borderRadius: 'var(--pill-radius-md)',
                padding: '10px 14px',
              }}>
                <Search size={16} color="var(--pill-text-muted)" />
                <input
                  type="text"
                  placeholder="Lexical search pills (title, tags, content)..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    refreshPills(currentIdentity, e.target.value);
                  }}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--pill-text)',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      refreshPills(currentIdentity, '');
                    }}
                    style={{ background: 'transparent', border: 'none', color: 'var(--pill-text-muted)', cursor: 'pointer', fontSize: '12px' }}
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Type Filter buttons */}
              <div style={{ display: 'flex', gap: '6px' }}>
                {['all', 'note', 'code', 'link'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setSelectedType(t)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 'var(--pill-radius-sm)',
                      fontSize: '12px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      border: selectedType === t ? '1px solid var(--pill-primary)' : '1px solid var(--pill-border)',
                      background: selectedType === t ? 'rgba(45, 212, 191, 0.12)' : 'var(--pill-surface)',
                      color: selectedType === t ? 'var(--pill-primary)' : 'var(--pill-text-muted)',
                      textTransform: 'capitalize',
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Pill Cards Grid */}
            {displayedPills.length > 0 ? (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                gap: '16px',
              }}>
                {displayedPills.map((pill) => (
                  <PillCard
                    key={pill.id}
                    pill={pill}
                    onDelete={handleDeletePill}
                  />
                ))}
              </div>
            ) : (
              /* Empty State */
              <div className="surface-card" style={{
                padding: '60px 24px',
                textAlign: 'center',
                border: '1px dashed var(--pill-border)',
              }}>
                <Layers size={36} color="var(--pill-text-muted)" style={{ marginBottom: '14px' }} />
                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '6px' }}>
                  {searchQuery ? 'No matching pills found' : 'Your vault is ready'}
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--pill-text-muted)', marginBottom: '18px' }}>
                  {searchQuery
                    ? `No context pills matched '${searchQuery}' in ${currentIdentity}'s vault.`
                    : `Capture your first context pill or press Ctrl+Shift+C.`}
                </p>
                <button className="btn-primary" onClick={() => setIsTopicOpen(true)}>
                  <Plus size={14} />
                  <span>Capture New Pill</span>
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Modals */}
      <TopicModal
        isOpen={isTopicOpen}
        onClose={() => setIsTopicOpen(false)}
        onSave={handleSavePill}
      />

      <ContextCompilerModal
        isOpen={isCompilerOpen}
        onClose={() => setIsCompilerOpen(false)}
        pills={pills}
        ownerId={currentIdentity}
      />
    </div>
  );
};
