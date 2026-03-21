import { useImageBlob } from '@/hooks/useImageBlob';
import { useStore } from '@/store';
import type { MemoEntry } from '@/types/memo';
import { CharacterBadgeBar } from '@/components/characters/characterBadgeBar';

interface ImageEntryProps {
  entry: MemoEntry;
  isHovered: boolean;
}

export function ImageEntry({ entry, isHovered }: ImageEntryProps) {
  const src = useImageBlob(entry.imageBlobKey);
  const deleteEntry = useStore((s) => s.deleteEntry);
  const settings = useStore((s) => s.settings);

  const panelDefault = settings.defaultCharacterDisplay[entry.panel];
  const effectiveFormat = entry.characterDisplayFormat ?? panelDefault.format;
  const effectiveVisibility = entry.characterDisplayVisibility ?? panelDefault.visibility;

  return (
    <div className="relative px-2 py-1.5">
      {src ? (
        <img
          src={src}
          alt=""
          className="block max-w-full rounded-sm border border-border-subtle"
          style={{ maxHeight: 300 }}
        />
      ) : (
        <div className="p-3 text-text-muted text-sm text-center">
          画像を読み込み中…
        </div>
      )}
      {entry.content && (
        <div className="mt-1 text-sm text-text-secondary whitespace-pre-wrap break-words">
          {entry.content}
        </div>
      )}
      <button
        onClick={() => deleteEntry(entry.id)}
        title="画像を削除"
        className="absolute top-2 right-2.5 w-5 h-5 flex items-center justify-center border-none rounded-sm text-text-secondary text-sm cursor-pointer opacity-0 hover:opacity-100 transition-opacity duration-150"
        style={{ background: 'rgba(0,0,0,0.6)' }}
      >
        ×
      </button>

      {/* 役職マーカー */}
      <CharacterBadgeBar
        entry={entry}
        format={effectiveFormat}
        visibility={effectiveVisibility}
        isEntryHovered={isHovered}
      />
    </div>
  );
}
