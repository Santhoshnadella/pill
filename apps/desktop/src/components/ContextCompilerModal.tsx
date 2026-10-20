import React, { useState, useMemo } from 'react';
import { X, Zap, Copy, Check, AlertTriangle, ShieldCheck, FileCode, MessageSquare, ExternalLink } from 'lucide-react';
import { Pill, DestinationType } from '@pill/schemas';
import { compileContextBundle } from '@pill/context-compiler';

interface ContextCompilerModalProps {
  isOpen: boolean;
  onClose: () => void;
  pills: Pill[];
  ownerId: string;
}

export const ContextCompilerModal: React.FC<ContextCompilerModalProps> = ({
  isOpen,
  onClose,
  pills,
  ownerId,
}) => {
  const [task, setTask] = useState('Implement local-first sync queue in IDE');
  const [destination, setDestination] = useState<DestinationType>('ide');
  const [selectedIds, setSelectedIds] = useState<string[]>(pills.map(p => p.id));
  const [tokenBudget, setTokenBudget] = useState(2500);
  const [copied, setCopied] = useState(false);
  const [consentGranted, setConsentGranted] = useState(true);

  // Sync selectedIds if pills change
  React.useEffect(() => {
    setSelectedIds(pills.map(p => p.id));
  }, [pills]);

  const selectedPills = useMemo(() => {
    return pills.filter(p => selectedIds.includes(p.id));
  }, [pills, selectedIds]);

  // Compile context bundle deterministically
  const bundle = useMemo(() => {
    if (selectedPills.length === 0) return null;
    try {
      return compileContextBundle({
        taskDescription: task,
        destination,
        ownerId,
        selectedPills,
        tokenBudget,
        requireConsent: !consentGranted,
      });
    } catch (err: any) {
      return null;
    }
  }, [task, destination, ownerId, selectedPills, tokenBudget, consentGranted]);

  if (!isOpen) return null;

  const toggleSelectPill = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleCopy = () => {
    if (!bundle) return;
    navigator.clipboard.writeText(bundle.compiledText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const budgetUsagePercent = bundle ? Math.min(100, Math.round((bundle.estimatedTokens / tokenBudget) * 100)) : 0;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(5, 8, 9, 0.85)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50,
      padding: '24px',
    }}>
      <div className="surface-raised animate-fade-in" style={{
        width: '100%',
        maxWidth: '960px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        border: '1px solid var(--pill-border-focus)',
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid var(--pill-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--pill-surface)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Zap size={18} color="var(--pill-primary)" />
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 600 }}>Context Compiler Studio</h2>
              <p style={{ fontSize: '11px', color: 'var(--pill-text-muted)' }}>
                Deterministic context packaging with provenance and budget enforcement
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--pill-text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Studio Content Split View */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Left Column: Configuration & Source Selector */}
          <div style={{
            width: '380px',
            borderRight: '1px solid var(--pill-border)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            overflowY: 'auto',
          }}>
            {/* Task Description */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--pill-text-muted)', display: 'block', marginBottom: '6px' }}>
                TARGET TASK / GOAL
              </label>
              <input
                type="text"
                value={task}
                onChange={(e) => setTask(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  background: 'var(--pill-surface)',
                  border: '1px solid var(--pill-border)',
                  borderRadius: 'var(--pill-radius-sm)',
                  color: 'var(--pill-text)',
                  fontSize: '13px',
                }}
              />
            </div>

            {/* Target Destination */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--pill-text-muted)', display: 'block', marginBottom: '6px' }}>
                DESTINATION ADAPTER
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {[
                  { id: 'ide', label: 'IDE Assistant', icon: FileCode },
                  { id: 'ai_chat', label: 'AI Chat (LLM)', icon: MessageSquare },
                  { id: 'clipboard', label: 'Clipboard', icon: Copy },
                  { id: 'file_export', label: 'Markdown File', icon: ExternalLink },
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setDestination(id as DestinationType)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 'var(--pill-radius-sm)',
                      border: destination === id ? '1px solid var(--pill-primary)' : '1px solid var(--pill-border)',
                      background: destination === id ? 'rgba(45, 212, 191, 0.12)' : 'var(--pill-surface)',
                      color: destination === id ? 'var(--pill-primary)' : 'var(--pill-text-muted)',
                      fontSize: '12px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Icon size={13} />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Token Budget Slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--pill-text-muted)' }}>
                  CONTEXT BUDGET
                </label>
                <span style={{ fontSize: '12px', color: 'var(--pill-primary)', fontWeight: 600 }}>
                  {tokenBudget} tokens
                </span>
              </div>
              <input
                type="range"
                min={500}
                max={8000}
                step={250}
                value={tokenBudget}
                onChange={(e) => setTokenBudget(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--pill-primary)' }}
              />
              {bundle && (
                <div style={{ marginTop: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--pill-text-muted)', marginBottom: '4px' }}>
                    <span>Estimated: ~{bundle.estimatedTokens} tokens</span>
                    <span>{budgetUsagePercent}% allocated</span>
                  </div>
                  <div style={{ width: '100%', height: '4px', background: 'var(--pill-border)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${budgetUsagePercent}%`,
                      height: '100%',
                      background: budgetUsagePercent > 90 ? 'var(--pill-warning)' : 'var(--pill-primary)',
                      transition: 'width 200ms ease',
                    }} />
                  </div>
                </div>
              )}
            </div>

            {/* Candidate Pills Selection */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--pill-text-muted)' }}>
                  VAULT SOURCES ({selectedIds.length}/{pills.length})
                </label>
                <button
                  onClick={() => setSelectedIds(selectedIds.length === pills.length ? [] : pills.map(p => p.id))}
                  style={{ background: 'transparent', border: 'none', color: 'var(--pill-primary)', fontSize: '11px', cursor: 'pointer' }}
                >
                  {selectedIds.length === pills.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto' }}>
                {pills.map((pill) => {
                  const isSelected = selectedIds.includes(pill.id);
                  return (
                    <div
                      key={pill.id}
                      onClick={() => toggleSelectPill(pill.id)}
                      style={{
                        padding: '8px 10px',
                        borderRadius: 'var(--pill-radius-sm)',
                        border: isSelected ? '1px solid var(--pill-border-focus)' : '1px solid var(--pill-border)',
                        background: isSelected ? 'var(--pill-surface-raised)' : 'transparent',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '12px',
                      }}
                    >
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <div style={{ fontWeight: 500, color: isSelected ? 'var(--pill-text)' : 'var(--pill-text-muted)' }}>
                          {pill.title}
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--pill-text-subtle)' }}>
                          {pill.type} • {pill.tags.slice(0, 2).map(t => `#${t}`).join(' ')}
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        style={{ accentColor: 'var(--pill-primary)' }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Compiled Preview & Warnings */}
          <div style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', overflowY: 'auto' }}>
            {/* Warnings Alert */}
            {bundle && bundle.warnings.length > 0 && (
              <div style={{
                background: 'rgba(251, 191, 36, 0.1)',
                border: '1px solid rgba(251, 191, 36, 0.3)',
                padding: '10px 14px',
                borderRadius: 'var(--pill-radius-sm)',
                color: 'var(--pill-warning)',
                fontSize: '12px',
                display: 'flex',
                gap: '8px',
              }}>
                <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong>Compiler Safety Notices:</strong>
                  {bundle.warnings.map((w, idx) => (
                    <div key={idx} style={{ marginTop: '2px' }}>• {w}</div>
                  ))}
                </div>
              </div>
            )}

            {/* Provenance Badges */}
            {bundle && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: 'var(--pill-text-muted)', fontWeight: 600 }}>
                  PROVENANCE:
                </span>
                {bundle.provenance.map((prov) => (
                  <span
                    key={prov.pillId}
                    style={{
                      background: 'var(--pill-surface)',
                      border: '1px solid var(--pill-border)',
                      padding: '3px 8px',
                      borderRadius: 'var(--pill-radius-sm)',
                      fontSize: '11px',
                      color: 'var(--pill-cyan)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <ShieldCheck size={11} color="var(--pill-primary)" />
                    {prov.title}
                  </span>
                ))}
              </div>
            )}

            {/* Exact Compiled Preview Textarea */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--pill-text-muted)' }}>
                  COMPILED CONTEXT PACKAGE (Ready for {destination})
                </label>
                <button
                  className="btn-primary"
                  onClick={handleCopy}
                  style={{ fontSize: '12px', padding: '4px 10px' }}
                >
                  {copied ? <Check size={13} /> : <Copy size={13} />}
                  <span>{copied ? 'Copied Context!' : 'Copy Bundle'}</span>
                </button>
              </div>

              <textarea
                readOnly
                value={bundle?.compiledText ?? 'No pills selected.'}
                style={{
                  flex: 1,
                  minHeight: '260px',
                  padding: '14px',
                  background: 'var(--pill-surface)',
                  border: '1px solid var(--pill-border)',
                  borderRadius: 'var(--pill-radius-sm)',
                  color: 'var(--pill-text)',
                  fontSize: '12px',
                  fontFamily: 'JetBrains Mono, monospace',
                  lineHeight: 1.6,
                  resize: 'none',
                  outline: 'none',
                }}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 24px',
          borderTop: '1px solid var(--pill-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--pill-surface)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--pill-text-muted)' }}>
            <input
              type="checkbox"
              id="consent"
              checked={consentGranted}
              onChange={(e) => setConsentGranted(e.target.checked)}
              style={{ accentColor: 'var(--pill-primary)' }}
            />
            <label htmlFor="consent" style={{ cursor: 'pointer' }}>
              I review and approve transmitting this compiled context bundle to the destination.
            </label>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn-secondary" onClick={onClose} style={{ fontSize: '13px' }}>
              Close
            </button>
            <button
              className="btn-primary"
              onClick={handleCopy}
              disabled={!bundle || !consentGranted}
              style={{
                fontSize: '13px',
                opacity: (!bundle || !consentGranted) ? 0.5 : 1,
              }}
            >
              Export Context Package
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
