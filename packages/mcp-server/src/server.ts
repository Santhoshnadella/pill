import { z } from 'zod';
import { IVaultStore } from '@pill/local-store';
import { compileContextBundle } from '@pill/context-compiler';
import { sanitizeUntrustedContent } from '@pill/domain';

export interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, any>;
  readOnly: boolean;
}

export const MCP_TOOLS: McpToolDefinition[] = [
  {
    name: 'pill_search',
    description: 'Search contextual Pills in the authorized vault by keyword or tags (capped at 20 results)',
    readOnly: true,
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search term or keywords' },
      },
      required: ['query'],
    },
  },
  {
    name: 'pill_get_metadata',
    description: 'Retrieve Pill metadata (title, tags, source, revision) without full content body',
    readOnly: true,
    inputSchema: {
      type: 'object',
      properties: {
        pillId: { type: 'string', description: 'UUID of the target Pill' },
      },
      required: ['pillId'],
    },
  },
  {
    name: 'pill_get_content',
    description: 'Retrieve sanitized content of a specific approved Pill by ID',
    readOnly: true,
    inputSchema: {
      type: 'object',
      properties: {
        pillId: { type: 'string', description: 'UUID of the target Pill' },
      },
      required: ['pillId'],
    },
  },
  {
    name: 'pill_list_collections',
    description: 'List user collections and categories in the vault',
    readOnly: true,
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'pill_context_preview',
    description: 'Compile a deterministic, token-bounded context package for an AI task',
    readOnly: true,
    inputSchema: {
      type: 'object',
      properties: {
        taskDescription: { type: 'string', description: 'Task or question description' },
        pillIds: { type: 'array', items: { type: 'string' }, description: 'Target Pill UUIDs' },
        tokenBudget: { type: 'number', description: 'Maximum token budget (default: 3000)' },
      },
      required: ['taskDescription', 'pillIds'],
    },
  },
];

export class PillMcpServer {
  constructor(private vaultStore: IVaultStore) {}

  getTools(): McpToolDefinition[] {
    return MCP_TOOLS;
  }

  async executeTool(
    ownerId: string,
    toolName: string,
    args: Record<string, any>
  ): Promise<{ content: any; isError?: boolean }> {
    if (!ownerId) {
      return { content: 'Identity Error: Missing authenticated ownerId', isError: true };
    }

    try {
      switch (toolName) {
        case 'pill_search': {
          const query = String(args.query || '');
          const results = await this.vaultStore.searchPills(ownerId, query);
          // Safety cap: Never return unbounded vault dump
          const capped = results.slice(0, 20).map(p => ({
            id: p.id,
            title: p.title,
            type: p.type,
            tags: p.tags,
            sourceUrl: p.source.url,
            capturedAt: p.source.capturedAt,
            trustLabel: p.trustLabel,
          }));
          return { content: capped };
        }

        case 'pill_get_metadata': {
          const pill = await this.vaultStore.getPill(args.pillId, ownerId);
          if (!pill) return { content: 'Pill not found or access denied', isError: true };
          return {
            content: {
              id: pill.id,
              title: pill.title,
              type: pill.type,
              tags: pill.tags,
              source: pill.source,
              trustLabel: pill.trustLabel,
              revision: pill.revision,
              createdAt: pill.createdAt,
            },
          };
        }

        case 'pill_get_content': {
          const pill = await this.vaultStore.getPill(args.pillId, ownerId);
          if (!pill) return { content: 'Pill not found or access denied', isError: true };
          return {
            content: {
              id: pill.id,
              title: pill.title,
              format: pill.payload.format,
              content: sanitizeUntrustedContent(pill.payload.content),
              trustLabel: pill.trustLabel,
            },
          };
        }

        case 'pill_list_collections': {
          const collections = await this.vaultStore.listCollections(ownerId);
          return { content: collections };
        }

        case 'pill_context_preview': {
          const { taskDescription, pillIds, tokenBudget = 3000 } = args;
          const candidatePills = await Promise.all(
            (pillIds as string[]).map(id => this.vaultStore.getPill(id, ownerId))
          );
          const validPills = candidatePills.filter((p): p is NonNullable<typeof p> => p !== null);

          if (validPills.length === 0) {
            return { content: 'No valid pills found for the requested IDs', isError: true };
          }

          const bundle = compileContextBundle({
            taskDescription,
            destination: 'mcp_client',
            ownerId,
            selectedPills: validPills,
            tokenBudget: Number(tokenBudget),
            requireConsent: false,
          });

          return { content: bundle };
        }

        default:
          return { content: `Unknown tool: ${toolName}`, isError: true };
      }
    } catch (err: any) {
      return { content: err.message || 'Error executing MCP tool', isError: true };
    }
  }
}
