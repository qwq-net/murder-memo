import type { ReactNode, Ref } from 'react';

interface EntryInputViewProps {
  /** タイムライン用（時刻欄を出す）か */
  isTimeline: boolean;
  /** 入力欄をパネル上部に置くか（下部の場合は false）。罫線の位置に反映 */
  isTop: boolean;
  /** 入力欄全体を無効化する */
  disabled?: boolean;

  /** グループセレクタ部品（呼び出し側で `GroupSelectorView` 等を組み立てて渡す） */
  groupSelector: ReactNode;

  /** 本文 textarea の値 */
  value: string;
  /** 本文 textarea の値変更 */
  onValueChange: (next: string) => void;
  /** 本文 textarea のキー入力（Enter 送信などは呼び出し側で実装） */
  onTextKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  /** 本文 textarea の placeholder */
  placeholder: string;
  /** textarea の ref（フォーカス管理 / リサイズ管理用） */
  textareaRef?: Ref<HTMLTextAreaElement>;
  /** バリデーションエラー（赤い下線が出る） */
  textError?: boolean;

  /** タイムライン時のみ: 時刻欄の値 */
  timeValue?: string;
  onTimeChange?: (next: string) => void;
  onTimeKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onTimeBlur?: () => void;
  timeRef?: Ref<HTMLInputElement>;
  /** 時刻欄のエラー（赤い下線が出る） */
  timeError?: boolean;

  /** 画像追加ボタンのクリックハンドラ。undefined なら画像ボタンを表示しない */
  onImagePickerOpen?: () => void;
}

/**
 * エントリ入力欄の純粋表示版。
 *
 * - グループセレクタ + 時刻欄（タイムライン時のみ）+ 本文 textarea + 画像追加ボタン のレイアウト
 * - `useStore` / hook に触れず、値・ハンドラ・ref を全て props で受け取る
 * - state 管理（value / time / バリデーション / 送信）は呼び出し側（`EntryInput`）の責務
 * - Guide ページからもそのまま呼び出して本物の見た目を表示できる
 */
export function EntryInputView({
  isTimeline,
  isTop,
  disabled,
  groupSelector,
  value,
  onValueChange,
  onTextKeyDown,
  placeholder,
  textareaRef,
  textError,
  timeValue,
  onTimeChange,
  onTimeKeyDown,
  onTimeBlur,
  timeRef,
  timeError,
  onImagePickerOpen,
}: EntryInputViewProps) {
  return (
    <div
      className={`bg-bg-surface flex shrink-0 flex-col gap-1 px-2.5 pt-1.5 pb-2 ${
        isTop ? 'border-border-subtle border-b' : 'border-border-subtle border-t'
      }`}
    >
      {/* グループセレクタ */}
      {groupSelector}

      {/* 入力行 */}
      <div className="flex min-h-6 items-center gap-1">
        {isTimeline && (
          <input
            ref={timeRef}
            value={timeValue ?? ''}
            onChange={(e) => onTimeChange?.(e.target.value)}
            onKeyDown={onTimeKeyDown}
            onBlur={onTimeBlur}
            placeholder="--:--"
            disabled={disabled}
            aria-label="時刻"
            aria-invalid={timeError || undefined}
            aria-describedby={timeError ? 'entry-time-error' : undefined}
            className="text-panel-timeline-accent focus:border-b-panel-timeline-accent w-11 shrink-0 border-0 border-b bg-transparent px-0.5 py-px text-center font-mono text-sm tracking-wide transition-[border-color] duration-150 outline-none"
            style={{
              borderBottomColor: timeError ? 'var(--importance-high)' : undefined,
              opacity: disabled ? 0.4 : undefined,
            }}
          />
        )}

        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          onKeyDown={onTextKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          aria-invalid={textError || undefined}
          aria-describedby={textError ? 'entry-text-error' : undefined}
          rows={1}
          className="text-text-primary min-w-0 flex-1 resize-none overflow-hidden border-0 bg-transparent py-px font-sans text-sm leading-[1.2] outline-none"
          style={{
            borderBottom: textError ? '1px solid var(--importance-high)' : undefined,
            opacity: disabled ? 0.4 : undefined,
          }}
        />

        {/* 画像追加ボタン */}
        {onImagePickerOpen && (
          <button
            onClick={onImagePickerOpen}
            title="画像を追加"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: 2,
              display: 'flex',
              alignItems: 'center',
              flexShrink: 0,
              transition: 'color 0.12s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-muted)';
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect
                x="1.5"
                y="1.5"
                width="13"
                height="13"
                rx="2"
                stroke="currentColor"
                strokeWidth="1.2"
              />
              <circle cx="5.5" cy="5.5" r="1.5" stroke="currentColor" strokeWidth="1" />
              <path
                d="M1.5 11l3.5-3.5 2.5 2.5 2-2 5 5"
                stroke="currentColor"
                strokeWidth="1"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
      </div>

      {/* スクリーンリーダー用エラーメッセージ */}
      {timeError && (
        <span id="entry-time-error" className="sr-only">
          時刻の形式が正しくありません
        </span>
      )}
      {textError && (
        <span id="entry-text-error" className="sr-only">
          テキストを入力してください
        </span>
      )}
    </div>
  );
}
