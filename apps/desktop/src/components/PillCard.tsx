import React, { useState } from 'react';
import { Pill } from '@pill/schemas';
import { Copy, Check, Trash2, ExternalLink, AlertTriangle, Clock } from 'lucide-react';

interface PillCardProps {
  pill: Pill;
  onDelete: (id: string) => void;
}

export const PillCard: React.FC<PillCardProps> = ({ pill, onDelete }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(pill.payload.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const formattedDate = new Date(pill.createdAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="surface-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Top Meta Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className={`badge badge-${pill.type}`}>
            {pill.type}
          </span>
          <span style={{ fontSize: '11px', color: 'var(--pill-text-subtle)', display: 'flex', alignItems: 'center', gap: '3px' }}>
            <Clock size={11} />
            {formattedDate}
          </span>
          <span style={{ fontSize: '11px', color: 'var(--pill-text-subtle)' }}>
            rev.{pill.revision}
          </span>
        </div>

        {/* Action icons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={handleCopy}
            className="btn-secondary"
            title="Copy content"
            style={{ padding: '4px 8px', fontSize: '11px' }}
          >
            {copied ? <Check size={12} color="var(--pill-primary)" /> : <Copy size={12} />}
          </button>
          <button
            onClick={() => onDelete(pill.id)}
            className="btn-danger"
            title="Delete Pill"
            style={{ padding: '4px 8px' }}
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Title */}
      <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--pill-text)', lineHeight: 1.3 }}>
        {pill.title}
      </h3>

      {/* Payload Content Preview */}
      <div style={{
        background: 'var(--pill-surface-raised)',
        padding: '10px 12px',
        borderRadius: 'var(--pill-radius-sm)',
        fontSize: '12px',
        color: 'var(--pill-text-muted)',
        maxHeight: '120px',
        overflowY: 'auto',
        fontFamily: pill.type === 'code' ? 'JetBrains Mono, monospace' : 'inherit',
        lineHeight: 1.5,
        whiteSpace: 'pre-wrap',
      }}>
        {pill.payload.content}
      </div>

      {/* Warnings if sensitive */}
      {pill.trustLabel === 'credential_warning' && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'var(--pill-warning-surface)',
          padding: '4px 8px',
          borderRadius: 'var(--pill-radius-sm)',
          fontSize: '11px',
          color: 'var(--pill-warning)',
        }}>
          <AlertTriangle size={12} />
          <span>Contains potential sensitive credentials</span>
        </div>
      )}

      {/* Footer: Tags & Source Provenance */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '6px' }}>
        {/* Tags */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {pill.tags.map(tag => (
            <span
              key={tag}
              style={{
                fontSize: '10px',
                color: 'var(--pill-text-muted)',
                background: 'rgba(255, 255, 255, 0.04)',
                padding: '2px 6px',
                borderRadius: '4px',
              }}
            >
              #{tag}
            </span>
          ))}
        </div>

        {/* Source link */}
        {pill.source.url && (
          <a
            href={pill.source.url}
            target="_blank"
            rel="noreferrer"
            style={{
              fontSize: '11px',
              color: 'var(--pill-cyan)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              textDecoration: 'none',
              maxWidth: '180px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            <ExternalLink size={11} />
            <span>{pill.source.url.replace(/^https?:\/\//, '')}</span>
          </a>
        )}
      </div>
    </div>
  );
};
