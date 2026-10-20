import {
  Pill,
  ContextBundle,
  DestinationType,
  BundleItemProvenance,
  ContextBundleSchema,
} from '@pill/schemas';
import { sanitizeUntrustedContent } from '@pill/domain';

export interface CompileOptions {
  taskDescription: string;
  destination: DestinationType;
  ownerId: string;
  selectedPills: Pill[];
  tokenBudget?: number; // Approximate token limit (default: 4000)
  requireConsent?: boolean;
}

export function estimateTokenCount(text: string): number {
  // Rough estimate: ~4 characters per token in English text
  return Math.max(1, Math.ceil(text.length / 4));
}

export function compileContextBundle(options: CompileOptions): ContextBundle {
  const {
    taskDescription,
    destination,
    ownerId,
    selectedPills,
    tokenBudget = 4000,
    requireConsent = true,
  } = options;

  // 1. Identity isolation verification: Ensure all pills belong strictly to active ownerId
  const authorizedPills = selectedPills.filter(p => p.ownerId === ownerId && p.archivedAt === null);
  if (authorizedPills.length !== selectedPills.length) {
    throw new Error('Identity Boundary Violation: Attempted to compile pills from a different account.');
  }

  // 2. Deduplication while preserving source references
  const uniquePillsMap = new Map<string, Pill>();
  for (const pill of authorizedPills) {
    if (!uniquePillsMap.has(pill.id)) {
      uniquePillsMap.set(pill.id, pill);
    }
  }
  const deduplicatedPills = Array.from(uniquePillsMap.values());

  // 3. Build Provenance metadata
  const provenance: BundleItemProvenance[] = deduplicatedPills.map(p => ({
    pillId: p.id,
    title: p.title,
    sourceUrl: p.source.url ?? null,
    capturedAt: p.source.capturedAt,
    trustLabel: p.trustLabel,
  }));

  // 4. Detect warnings (credentials, conflicts, external untrusted data)
  const warnings: string[] = [];
  const hasCredentialWarning = deduplicatedPills.some(p => p.trustLabel === 'credential_warning');
  if (hasCredentialWarning) {
    warnings.push('CRITICAL: One or more selected Pills contain potential credentials or API keys.');
  }

  const hasExternalUntrusted = deduplicatedPills.some(p => p.trustLabel === 'external_untrusted');
  if (hasExternalUntrusted) {
    warnings.push('NOTICE: Context contains external web clippings. Content is treated as untrusted data.');
  }

  // 5. Compile content within budget
  let compiledText = `<!-- PILL CONTEXT BUNDLE -->\n`;
  compiledText += `<!-- Task: ${taskDescription} | Destination: ${destination} -->\n\n`;

  let currentTokens = estimateTokenCount(compiledText);
  const includedPillIds: string[] = [];

  for (const pill of deduplicatedPills) {
    const cleanContent = sanitizeUntrustedContent(pill.payload.content);
    const sourceInfo = pill.source.url ? ` (Source: ${pill.source.url})` : '';
    const sectionHeader = `### [Pill] ${pill.title}${sourceInfo}\n*Trust: ${pill.trustLabel} | Captured: ${pill.source.capturedAt}*\n\n`;
    const sectionBody = `${cleanContent}\n\n---\n\n`;
    const sectionText = sectionHeader + sectionBody;
    const sectionTokens = estimateTokenCount(sectionText);

    if (currentTokens + sectionTokens > tokenBudget) {
      warnings.push(`Context budget reached. Pill '${pill.title}' and subsequent items were truncated to respect ${tokenBudget} token budget.`);
      break;
    }

    compiledText += sectionText;
    currentTokens += sectionTokens;
    includedPillIds.push(pill.id);
  }

  if (includedPillIds.length === 0 && deduplicatedPills.length > 0) {
    // If even the first pill exceeded budget
    compiledText += `*(Selected context exceeded the strict token budget of ${tokenBudget} tokens.)*\n`;
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour temporary bundle lifetime

  const bundleData = {
    id: globalThis.crypto.randomUUID(),
    schemaVersion: 1 as const,
    ownerId,
    taskDescription,
    destination,
    selectedPillIds: includedPillIds.length > 0 ? includedPillIds : [deduplicatedPills[0]?.id ?? globalThis.crypto.randomUUID()],
    provenance,
    tokenBudget,
    estimatedTokens: currentTokens,
    compiledText,
    warnings,
    userConsentGranted: !requireConsent, // Pending explicit confirmation unless bypassed
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };

  return ContextBundleSchema.parse(bundleData);
}
