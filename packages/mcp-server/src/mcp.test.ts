import { describe, it, expect, beforeEach } from 'vitest';
import { PillMcpServer } from './server.js';
import { VaultStore } from '@pill/local-store';
import { Pill } from '@pill/schemas';

describe('PILL Model Context Protocol (MCP) Server', () => {
  let store: VaultStore;
  let server: PillMcpServer;

  const alicePill: Pill = {
    id: '11111111-1111-4111-8111-111111111111',
    schemaVersion: 1,
    ownerId: 'alice',
    type: 'note',
    title: 'MCP Integration Rationale',
    payload: {
      format: 'text/markdown',
      content: 'MCP provides an open standard for LLMs to query context.',
    },
    source: {
      kind: 'manual',
      url: 'https://modelcontextprotocol.io',
      capturedAt: '2026-10-20T18:00:00.000Z',
    },
    tags: ['mcp', 'ai'],
    collectionIds: [],
    relationships: [],
    trustLabel: 'user_authored',
    revision: 1,
    createdAt: '2026-10-20T18:00:00.000Z',
    updatedAt: '2026-10-20T18:00:00.000Z',
    archivedAt: null,
  };

  const bobPill: Pill = {
    id: '22222222-2222-4222-8222-222222222222',
    schemaVersion: 1,
    ownerId: 'bob',
    type: 'code',
    title: 'Bob Secret Logic',
    payload: { format: 'code', content: 'const privateKey = "...";' },
    source: { kind: 'manual', capturedAt: '2026-10-20T18:00:00.000Z' },
    tags: ['secret'],
    collectionIds: [],
    relationships: [],
    trustLabel: 'user_authored',
    revision: 1,
    createdAt: '2026-10-20T18:00:00.000Z',
    updatedAt: '2026-10-20T18:00:00.000Z',
    archivedAt: null,
  };

  beforeEach(async () => {
    store = new VaultStore();
    await store.savePill(alicePill);
    await store.savePill(bobPill);
    server = new PillMcpServer(store);
  });

  it('should declare scoped, read-only tools by default', () => {
    const tools = server.getTools();
    expect(tools.length).toBe(5);
    expect(tools.every(t => t.readOnly === true)).toBe(true);

    const toolNames = tools.map(t => t.name);
    expect(toolNames).toContain('pill_search');
    expect(toolNames).toContain('pill_get_metadata');
    expect(toolNames).toContain('pill_get_content');
    expect(toolNames).toContain('pill_list_collections');
    expect(toolNames).toContain('pill_context_preview');
  });

  it('pill_search should return matching context for authorized identity', async () => {
    const res = await server.executeTool('alice', 'pill_search', { query: 'MCP Integration' });
    expect(res.isError).toBeFalsy();
    expect(res.content.length).toBe(1);
    expect(res.content[0].title).toBe('MCP Integration Rationale');
  });

  it('CRITICAL IDENTITY TEST: Alice cannot search or get Bob pills via MCP', async () => {
    // 1. Search for Bob's secret
    const searchRes = await server.executeTool('alice', 'pill_search', { query: 'Secret' });
    expect(searchRes.content.length).toBe(0);

    // 2. Direct get_content on Bob's pill ID
    const contentRes = await server.executeTool('alice', 'pill_get_content', { pillId: bobPill.id });
    expect(contentRes.isError).toBe(true);
    expect(contentRes.content).toContain('access denied');
  });

  it('pill_context_preview should compile task bundle within token budget', async () => {
    const res = await server.executeTool('alice', 'pill_context_preview', {
      taskDescription: 'Explain MCP architecture to Claude',
      pillIds: [alicePill.id],
      tokenBudget: 2000,
    });

    expect(res.isError).toBeFalsy();
    expect(res.content.compiledText).toContain('MCP provides an open standard');
    expect(res.content.destination).toBe('mcp_client');
  });
});
