import { useEffect, useState } from 'react';

import { getImage } from '../../lib/idb';
import { useStore } from '../../store';
import type { MemoEntry } from '../../types/memo';

interface ImageEntryProps {
  entry: MemoEntry;
}

export function ImageEntry({ entry }: ImageEntryProps) {
  const [src, setSrc] = useState<string | null>(null);
  const deleteEntry = useStore((s) => s.deleteEntry);

  useEffect(() => {
    let revoked = false;
    if (!entry.imageBlobKey) return;

    getImage(entry.imageBlobKey).then((blob) => {
      if (revoked || !blob) return;
      const url = URL.createObjectURL(blob);
      setSrc(url);
    });

    return () => {
      revoked = true;
      if (src) URL.revokeObjectURL(src);
    };
    // src を依存に入れると無限ループになるため除外
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry.imageBlobKey]);

  return (
    <div style={{ padding: '6px 8px', position: 'relative' }}>
      {src ? (
        <img
          src={src}
          alt=""
          style={{
            maxWidth: '100%',
            maxHeight: 300,
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
            display: 'block',
          }}
        />
      ) : (
        <div
          style={{
            padding: '12px',
            color: 'var(--text-muted)',
            fontSize: 12,
            textAlign: 'center',
          }}
        >
          画像を読み込み中…
        </div>
      )}
      {entry.content && (
        <div
          style={{
            marginTop: 4,
            fontSize: 12,
            color: 'var(--text-secondary)',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {entry.content}
        </div>
      )}
      <button
        onClick={() => deleteEntry(entry.id)}
        title="画像を削除"
        style={{
          position: 'absolute',
          top: 8,
          right: 10,
          width: 20,
          height: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0,0,0,0.6)',
          border: 'none',
          borderRadius: 'var(--radius-sm)',
          color: 'var(--text-secondary)',
          fontSize: 12,
          cursor: 'pointer',
          opacity: 0,
          transition: 'opacity 0.15s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
        onMouseLeave={(e) => { e.currentTarget.style.opacity = '0'; }}
      >
        ×
      </button>
    </div>
  );
}
