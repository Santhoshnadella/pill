import React from 'react';
import { Plus, Zap, Users, Lock, Unlock, Database } from 'lucide-react';

interface HeaderProps {
  currentIdentity: string;
  onSwitchIdentity: (identity: string) => void;
  isLocked: boolean;
  onToggleLock: () => void;
  onOpenTopic: () => void;
  onOpenCompiler: () => void;
  pillCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentIdentity,
  onSwitchIdentity,
  isLocked,
  onToggleLock,
  onOpenTopic,
  onOpenCompiler,
  pillCount,
}) => {
  return (
    <header style={{
      borderBottom: '1px solid var(--pill-border)',
      background: 'rgba(11, 16, 18, 0.85)',
      backdropFilter: 'blur(12px)',
      position: 'sticky',
      top: 0,
      zIndex: 40,
      padding: '12px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      {/* Brand & Mission */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, var(--pill-primary) 0%, var(--pill-cyan) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--pill-shadow-glow)',
          }}>
            <div style={{ width: '12px', height: '12px', background: '#0B1012', borderRadius: '6px' }} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.5px' }}>pill</span>
              <span className="badge" style={{ background: 'rgba(45, 212, 191, 0.1)', color: 'var(--pill-primary)' }}>
                LOCAL-FIRST
              </span>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--pill-text-muted)' }}>
              Capture once. Continue anywhere.
            </p>
          </div>
        </div>

        {/* Vault & Storage Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'var(--pill-surface)',
          padding: '4px 10px',
          borderRadius: 'var(--pill-radius-sm)',
          fontSize: '12px',
          border: '1px solid var(--pill-border)',
          color: 'var(--pill-text-muted)',
        }}>
          <Database size={13} color="var(--pill-primary)" />
          <span>Vault: <strong>{pillCount} pills</strong></span>
          <span style={{ color: 'var(--pill-border)' }}>|</span>
          <span style={{ color: 'var(--pill-success)', fontSize: '11px' }}>● 100% Offline Active</span>
        </div>
      </div>

      {/* Action Center & Identity Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Compiler Button */}
        <button
          className="btn-secondary"
          onClick={onOpenCompiler}
          title="Open Context Compiler studio"
          style={{ fontSize: '13px' }}
        >
          <Zap size={14} color="var(--pill-primary)" />
          <span>Context Studio</span>
        </button>

        {/* Topic Quick Capture Trigger */}
        <button
          className="btn-primary"
          onClick={onOpenTopic}
          title="Global shortcut: Ctrl + Shift + C"
          style={{ fontSize: '13px' }}
        >
          <Plus size={15} />
          <span>Capture Pill</span>
          <kbd style={{
            fontSize: '10px',
            background: 'rgba(0,0,0,0.25)',
            padding: '2px 5px',
            borderRadius: '4px',
            fontWeight: 500,
          }}>
            Ctrl+Shift+C
          </kbd>
        </button>

        {/* Vault Lock Toggle */}
        <button
          onClick={onToggleLock}
          className="btn-secondary"
          title={isLocked ? 'Unlock Vault' : 'Lock Vault (Zero-Leak Memory Wipe)'}
          style={{
            borderColor: isLocked ? 'var(--pill-danger)' : 'var(--pill-border)',
            color: isLocked ? 'var(--pill-danger)' : 'var(--pill-text)',
          }}
        >
          {isLocked ? <Lock size={14} color="var(--pill-danger)" /> : <Unlock size={14} />}
          <span style={{ fontSize: '12px' }}>{isLocked ? 'Locked' : 'Unlocked'}</span>
        </button>

        {/* Identity Switcher (Alice ⇄ Bob) */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'var(--pill-surface-raised)',
          padding: '4px 8px',
          borderRadius: 'var(--pill-radius-sm)',
          border: '1px solid var(--pill-border)',
        }}>
          <Users size={13} color="var(--pill-cyan)" />
          <select
            value={currentIdentity}
            onChange={(e) => onSwitchIdentity(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--pill-text)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="alice" style={{ background: '#111A1D' }}>👤 Alice (Research)</option>
            <option value="bob" style={{ background: '#111A1D' }}>👤 Bob (Design)</option>
          </select>
        </div>
      </div>
    </header>
  );
};
