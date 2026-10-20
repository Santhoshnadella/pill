import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { PillType } from '@pill/schemas';
import { detectSensitiveContent } from '@pill/domain';
import { Check, AlertTriangle, Link as LinkIcon, FileText, Code, Tag, ExternalLink } from 'lucide-react';

export const PopupApp: React.FC = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [type, setType] = useState<PillType>('note');
  const [tags, setTags] = useState<string[]>(['browser-capture']);
  const [tagInput, setTagInput] = useState('');
  const [saved, setSaved] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);

  // Capture active tab metadata on mount
  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs[0];
        if (activeTab) {
          setTitle(activeTab.title || 'Untitled Page');
          setSourceUrl(activeTab.url || '');

          // Check if YouTube
          if (activeTab.url?.includes('youtube.com/watch')) {
            setType('link');
            setTags(prev => [...prev, 'youtube']);
          }

          // Try getting active selection via executeScript if allowed
          if (activeTab.id) {
            chrome.scripting?.executeScript(
              {
                target: { tabId: activeTab.id },
                func: () => window.getSelection()?.toString() || '',
              },
              (results) => {
                const selectedText = results?.[0]?.result;
                if (selectedText) {
                  setContent(selectedText);
                  setType('selection');
                }
              }
            );
          }
        }
      });
    } else {
      // Fallback preview data for standalone testing
      setTitle('Sample Research Tab — Context Architecture');
      setSourceUrl('https://pill.so/docs');
      setContent('Capturing once to continue anywhere.');
    }
  }, []);

  // Credential scanner
  useEffect(() => {
    if (content.length > 5) {
      const { warnings: detected } = detectSensitiveContent(content);
      setWarnings(detected);
    } else {
      setWarnings([]);
    }
  }, [content]);

  const handleAddTag = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault();
      const clean = tagInput.trim().replace(/^#/, '');
      if (!tags.includes(clean)) {
        setTags([...tags, clean]);
      }
      setTagInput('');
    }
  };

  const handleSave = async () => {
    const pillPayload = {
      id: globalThis.crypto.randomUUID(),
      title,
      content,
      sourceUrl,
      type,
      tags,
      capturedAt: new Date().toISOString(),
    };

    // Save to chrome.storage.local
    if (typeof chrome !== 'undefined' && chrome.storage) {
      const stored = await chrome.storage.local.get(['pill_captures']);
      const currentList = stored.pill_captures || [];
      await chrome.storage.local.set({ pill_captures: [pillPayload, ...currentList] });
    }

    setSaved(true);
    setTimeout(() => {
      if (typeof window !== 'undefined' && window.close) {
        window.close();
      }
    }, 1200);
  };

  return (
    <div style={{
      padding: '16px',
      background: '#0B1012',
      color: '#F1F7F7',
      fontFamily: 'Inter, sans-serif',
      boxSizing: 'border-box',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '20px',
            height: '20px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #2DD4BF 0%, #67E8F9 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <div style={{ width: '8px', height: '8px', background: '#0B1012', borderRadius: '4px' }} />
          </div>
          <span style={{ fontSize: '14px', fontWeight: 700 }}>pill</span>
          <span style={{ fontSize: '10px', background: 'rgba(45, 212, 191, 0.1)', color: '#2DD4BF', padding: '1px 6px', borderRadius: '4px' }}>
            EXTENSION
          </span>
        </div>
        <span style={{ fontSize: '11px', color: '#9AAEB0' }}>Explicit Capture</span>
      </div>

      {/* Type buttons */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
        {(['note', 'selection', 'link', 'code'] as PillType[]).map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            style={{
              flex: 1,
              padding: '4px 6px',
              borderRadius: '6px',
              border: type === t ? '1px solid #2DD4BF' : '1px solid #26383B',
              background: type === t ? 'rgba(45, 212, 191, 0.12)' : '#111A1D',
              color: type === t ? '#2DD4BF' : '#9AAEB0',
              fontSize: '11px',
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Form Fields */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          style={{
            padding: '8px 10px',
            background: '#111A1D',
            border: '1px solid #26383B',
            borderRadius: '6px',
            color: '#F1F7F7',
            fontSize: '12px',
            outline: 'none',
          }}
        />

        <textarea
          rows={3}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Selection or note content..."
          style={{
            padding: '8px 10px',
            background: '#111A1D',
            border: '1px solid #26383B',
            borderRadius: '6px',
            color: '#F1F7F7',
            fontSize: '11px',
            fontFamily: type === 'code' ? 'monospace' : 'inherit',
            resize: 'vertical',
            outline: 'none',
          }}
        />

        {warnings.length > 0 && (
          <div style={{
            background: 'rgba(251, 191, 36, 0.1)',
            border: '1px solid rgba(251, 191, 36, 0.3)',
            padding: '6px 8px',
            borderRadius: '6px',
            color: '#FBBF24',
            fontSize: '10px',
            display: 'flex',
            gap: '6px',
          }}>
            <AlertTriangle size={12} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>{warnings[0]}</div>
          </div>
        )}

        {/* Source URL preview */}
        {sourceUrl && (
          <div style={{
            fontSize: '10px',
            color: '#67E8F9',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}>
            <ExternalLink size={10} />
            <span>{sourceUrl}</span>
          </div>
        )}

        {/* Tags */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {tags.map(t => (
            <span key={t} style={{ fontSize: '10px', background: '#172326', padding: '2px 6px', borderRadius: '4px', color: '#9AAEB0' }}>
              #{t}
            </span>
          ))}
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleAddTag}
            placeholder="+ tag"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#F1F7F7',
              fontSize: '10px',
              outline: 'none',
              width: '50px',
            }}
          />
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={saved}
        style={{
          marginTop: '12px',
          width: '100%',
          padding: '8px',
          borderRadius: '6px',
          background: saved ? '#34D399' : '#2DD4BF',
          color: '#061A18',
          fontWeight: 600,
          fontSize: '12px',
          border: 'none',
          cursor: saved ? 'default' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
        }}
      >
        {saved ? (
          <>
            <Check size={14} />
            <span>Saved to Pill Vault!</span>
          </>
        ) : (
          <span>Save to Pill Vault</span>
        )}
      </button>
    </div>
  );
};

const rootEl = document.getElementById('popup-root');
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(<PopupApp />);
}
