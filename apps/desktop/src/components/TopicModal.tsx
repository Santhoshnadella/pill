import React, { useState, useEffect } from 'react';
import { X, Check, AlertTriangle, Link as LinkIcon, Code, FileText, Tag } from 'lucide-react';
import { PillType } from '@pill/schemas';
import { detectSensitiveContent } from '@pill/domain';

interface TopicModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (pillData: {
    title: string;
    content: string;
    type: PillType;
    sourceUrl?: string;
    tags: string[];
  }) => void;
}

export const TopicModal: React.FC<TopicModalProps> = ({ isOpen, onClose, onSave }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<PillType>('note');
  const [sourceUrl, setSourceUrl] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);

  // Real-time sensitive data detection
  useEffect(() => {
    if (content.length > 5) {
      const { warnings: detected } = detectSensitiveContent(content);
      setWarnings(detected);
    } else {
      setWarnings([]);
    }
  }, [content]);

  // Global hotkey: Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleAddTag = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault();
      const cleanTag = tagInput.trim().replace(/^#/, '');
      if (!tags.includes(cleanTag)) {
        setTags([...tags, cleanTag]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleSave = () => {
    if (!title.trim() || !content.trim()) return;

    onSave({
      title: title.trim(),
      content: content.trim(),
      type,
      sourceUrl: sourceUrl.trim() || undefined,
      tags,
    });

    // Reset form
    setTitle('');
    setContent('');
    setSourceUrl('');
    setTags([]);
    setTagInput('');
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(5, 8, 9, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50,
      padding: '16px',
    }}>
      <div className="surface-raised animate-fade-in" style={{
        width: '100%',
        maxWidth: '560px',
        padding: '24px',
        border: '1px solid var(--pill-border-focus)',
      }}>
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '4px', background: 'var(--pill-primary)' }} />
            <h2 style={{ fontSize: '16px', fontWeight: 600 }}>Topic Capture Panel</h2>
            <span style={{ fontSize: '11px', color: 'var(--pill-text-muted)' }}>(Explicit User Capture)</span>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--pill-text-muted)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        {/* Type Selector Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
          {(['note', 'code', 'link', 'selection'] as PillType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              style={{
                flex: 1,
                padding: '6px 10px',
                borderRadius: 'var(--pill-radius-sm)',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                border: type === t ? '1px solid var(--pill-primary)' : '1px solid var(--pill-border)',
                background: type === t ? 'rgba(45, 212, 191, 0.12)' : 'var(--pill-surface)',
                color: type === t ? 'var(--pill-primary)' : 'var(--pill-text-muted)',
              }}
            >
              {t === 'note' && <FileText size={13} />}
              {t === 'code' && <Code size={13} />}
              {t === 'link' && <LinkIcon size={13} />}
              {t === 'selection' && <Check size={13} />}
              <span style={{ textTransform: 'capitalize' }}>{t}</span>
            </button>
          ))}
        </div>

        {/* Form Body */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input
            type="text"
            placeholder="Pill Title (e.g. SQLite FTS5 Schema Decisions)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              background: 'var(--pill-surface)',
              border: '1px solid var(--pill-border)',
              borderRadius: 'var(--pill-radius-sm)',
              color: 'var(--pill-text)',
              fontSize: '14px',
              outline: 'none',
            }}
          />

          <textarea
            placeholder="Context content, code snippet, or summary notes..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={5}
            style={{
              width: '100%',
              padding: '12px 14px',
              background: 'var(--pill-surface)',
              border: '1px solid var(--pill-border)',
              borderRadius: 'var(--pill-radius-sm)',
              color: 'var(--pill-text)',
              fontSize: '13px',
              fontFamily: type === 'code' ? 'JetBrains Mono, monospace' : 'inherit',
              resize: 'vertical',
              outline: 'none',
              lineHeight: 1.5,
            }}
          />

          {/* Credential / Secret Warnings */}
          {warnings.length > 0 && (
            <div style={{
              background: 'rgba(251, 191, 36, 0.12)',
              border: '1px solid rgba(251, 191, 36, 0.35)',
              padding: '10px 14px',
              borderRadius: 'var(--pill-radius-sm)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              fontSize: '12px',
              color: 'var(--pill-warning)',
            }}>
              <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Privacy & Secret Warning:</strong>
                {warnings.map((w, i) => (
                  <div key={i} style={{ marginTop: '2px' }}>• {w}</div>
                ))}
              </div>
            </div>
          )}

          {/* Source Provenance Link */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <LinkIcon size={14} color="var(--pill-text-muted)" />
            <input
              type="url"
              placeholder="Source URL (e.g. https://youtube.com/watch?v=... or GitHub doc link)"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              style={{
                flex: 1,
                padding: '8px 12px',
                background: 'var(--pill-surface)',
                border: '1px solid var(--pill-border)',
                borderRadius: 'var(--pill-radius-sm)',
                color: 'var(--pill-text)',
                fontSize: '12px',
                outline: 'none',
              }}
            />
          </div>

          {/* Tags */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: tags.length ? '8px' : 0 }}>
              <Tag size={14} color="var(--pill-text-muted)" />
              <input
                type="text"
                placeholder="Add tags (press Enter to commit, e.g. architecture, rust)"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  background: 'var(--pill-surface)',
                  border: '1px solid var(--pill-border)',
                  borderRadius: 'var(--pill-radius-sm)',
                  color: 'var(--pill-text)',
                  fontSize: '12px',
                  outline: 'none',
                }}
              />
            </div>
            {tags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {tags.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      background: 'var(--pill-surface-raised)',
                      border: '1px solid var(--pill-border)',
                      fontSize: '11px',
                      padding: '2px 8px',
                      borderRadius: 'var(--pill-radius-sm)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--pill-text-muted)', cursor: 'pointer' }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div style={{
          marginTop: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: '10px',
        }}>
          <button type="button" className="btn-secondary" onClick={onClose} style={{ fontSize: '13px' }}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={handleSave}
            disabled={!title.trim() || !content.trim()}
            style={{
              fontSize: '13px',
              opacity: (!title.trim() || !content.trim()) ? 0.5 : 1,
              cursor: (!title.trim() || !content.trim()) ? 'not-allowed' : 'pointer',
            }}
          >
            Save to Local Vault
          </button>
        </div>
      </div>
    </div>
  );
};
