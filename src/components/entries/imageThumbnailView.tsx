import { THUMB_HEIGHT } from '@/components/entries/thumbConstants';

interface ImageThumbnailViewProps {
  /** 画像 URL。未解決（undefined）ならプレースホルダ枠を表示する */
  src?: string;
  /** サムネイルクリック時のハンドラ（Lightbox を開く等） */
  onClick?: () => void;
}

/**
 * 画像エントリのサムネイル枠（画像 or プレースホルダ）。
 *
 * imageEntry（編集モード）と imageEntryView（閲覧モード）で二重定義されていた JSX と
 * `THUMB_HEIGHT` を集約。useImageBlob / Lightbox 制御は呼び出し側に残す。
 */
export function ImageThumbnailView({ src, onClick }: ImageThumbnailViewProps) {
  if (src) {
    return (
      <img
        src={src}
        alt=""
        onClick={onClick}
        className="border-border-subtle block shrink-0 cursor-pointer rounded-sm border object-cover"
        style={{ height: THUMB_HEIGHT, width: THUMB_HEIGHT }}
      />
    );
  }
  return (
    <div
      className="border-border-subtle text-text-faint flex shrink-0 items-center justify-center rounded-sm border text-[10px]"
      style={{ height: THUMB_HEIGHT, width: THUMB_HEIGHT }}
    >
      …
    </div>
  );
}
