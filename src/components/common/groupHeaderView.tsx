import { useState } from 'react';

import { ArrowDown, ArrowUp, ChevronDown, SquarePen, X } from '@/components/icons';

interface GroupHeaderViewProps {
  /** グループラベル */
  label: string;
  /** 折りたたみ状態 */
  collapsed: boolean;
  /** アクセント色（CSS 変数 or 色値） */
  accentColor: string;
  /** ヘッダークリックで折りたたみトグル */
  onToggle: () => void;
  /** ラベルを編集中か */
  isEditing: boolean;
  /** 編集中の下書きラベル */
  draftLabel: string;
  /** 下書きラベルの変更 */
  onDraftChange: (value: string) => void;
  /** ラベル編集を確定（blur 時など） */
  onSave: () => void;
  /** ラベル編集モード開始 */
  onStartEditing: () => void;
  /** ラベル input の keyDown（Enter で確定 / Esc で取消） */
  onLabelKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  /** 上に移動。undefined なら先頭でボタン無効化 */
  onMoveUp?: () => void;
  /** 下に移動。undefined なら末尾でボタン無効化 */
  onMoveDown?: () => void;
  /** 削除ボタンクリック（呼び出し側で確認モーダル等を出す） */
  onRequestDelete: () => void;
  /**
   * ホバー時の表示（並び替え / 編集 / 削除ボタン）を強制的に出す。
   * Guide のプレビューで「ホバー状態の見た目」を見せるために使う。本体の通常利用では渡さない。
   */
  forceHover?: boolean;
  /**
   * 編集中 input への自動フォーカスを抑制する。Guide のプレビューで isEditing=true を見せると
   * ページ読み込み時にフォーカスを奪ってスクロールが飛ぶため、その用途で false を渡す。
   * 本体の通常利用では指定しない（デフォルトの true で挙動が変わらない）。
   */
  autoFocusInput?: boolean;
}

/**
 * グループヘッダーの純粋表示版。
 *
 * - `useStore` / カスタム hook には依存せず、必要な値・ハンドラを props で受け取る
 * - 編集中の input / 並び替え矢印 / 編集 / 削除ボタンの表示・hover 挙動は内部で持つ
 * - 削除確認モーダルは含まない（呼び出し側の `GroupHeader` が `ConfirmModal` で提供する）
 * - Guide ページなど store を持たない場面でも、ハンドラに noop を渡せばそのまま使える
 */
export function GroupHeaderView({
  label,
  collapsed,
  accentColor,
  onToggle,
  isEditing,
  draftLabel,
  onDraftChange,
  onSave,
  onStartEditing,
  onLabelKeyDown,
  onMoveUp,
  onMoveDown,
  onRequestDelete,
  forceHover = false,
  autoFocusInput = true,
}: GroupHeaderViewProps) {
  const [headerHovered, setHeaderHovered] = useState(false);
  // 呼び出し側で hover を強制している場合は state を無視する（Guide のプレビュー用）
  const effectiveHovered = forceHover || headerHovered;

  return (
    <div
      onMouseEnter={() => setHeaderHovered(true)}
      onMouseLeave={() => setHeaderHovered(false)}
      onClick={isEditing ? undefined : onToggle}
      className="flex cursor-pointer items-center gap-2 px-2.5 py-[7px] select-none"
      style={{
        background: `color-mix(in srgb, ${accentColor} 5%, transparent)`,
        borderBottom: `1px solid color-mix(in srgb, ${accentColor} 12%, transparent)`,
      }}
    >
      {/* 折りたたみ矢印 */}
      <span
        className="flex shrink-0 items-center transition-transform duration-150"
        style={{
          color: accentColor,
          transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
        }}
      >
        <ChevronDown size={12} />
      </span>

      {/* ラベル */}
      {isEditing ? (
        <input
          autoFocus={autoFocusInput}
          value={draftLabel}
          onChange={(e) => onDraftChange(e.target.value)}
          onBlur={onSave}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={onLabelKeyDown}
          aria-label="グループ名を編集"
          className="bg-bg-base flex-1 rounded-sm px-1.5 py-px text-sm font-semibold outline-none"
          style={{
            border: `1px solid ${accentColor}`,
            color: accentColor,
          }}
        />
      ) : (
        <span
          className="flex-1 text-sm font-semibold tracking-[0.06em]"
          style={{ color: accentColor }}
        >
          {label}
        </span>
      )}

      {/* 並び替え矢印 — ホバー時表示 */}
      {!isEditing && (onMoveUp || onMoveDown) && (
        <span
          className="flex items-center gap-px"
          style={{ opacity: effectiveHovered ? 0.8 : 0, transition: 'opacity 0.15s' }}
        >
          <button
            disabled={!onMoveUp}
            onClick={(e) => {
              e.stopPropagation();
              onMoveUp?.();
            }}
            aria-label={`${label}を上に移動`}
            className="flex cursor-pointer items-center border-none bg-transparent p-0 transition-colors duration-150"
            style={{ color: 'var(--text-faint)', opacity: onMoveUp ? 1 : 0.3 }}
            onMouseEnter={(e) => {
              if (onMoveUp) e.currentTarget.style.color = accentColor;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-faint)';
            }}
          >
            <ArrowUp size={14} />
          </button>
          <button
            disabled={!onMoveDown}
            onClick={(e) => {
              e.stopPropagation();
              onMoveDown?.();
            }}
            aria-label={`${label}を下に移動`}
            className="flex cursor-pointer items-center border-none bg-transparent p-0 transition-colors duration-150"
            style={{ color: 'var(--text-faint)', opacity: onMoveDown ? 1 : 0.3 }}
            onMouseEnter={(e) => {
              if (onMoveDown) e.currentTarget.style.color = accentColor;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-faint)';
            }}
          >
            <ArrowDown size={14} />
          </button>
        </span>
      )}

      {/* 編集ボタン — ホバー時表示 */}
      {!isEditing && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onStartEditing();
          }}
          title="グループ名を変更"
          aria-label={`${label}の名前を変更`}
          className="text-text-faint flex cursor-pointer items-center border-none bg-transparent px-0.5 transition-[color,opacity] duration-150"
          style={{
            opacity: effectiveHovered ? 0.8 : 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = accentColor;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--text-faint)';
          }}
        >
          <SquarePen size={14} />
        </button>
      )}

      {/* 削除ボタン — ホバー時表示 */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRequestDelete();
        }}
        title="グループを削除"
        aria-label={`${label}を削除`}
        className="text-text-faint flex cursor-pointer items-center border-none bg-transparent px-0.5 transition-[color,opacity] duration-150"
        style={{
          opacity: effectiveHovered ? 1 : 0,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = 'var(--danger)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = 'var(--text-faint)';
        }}
      >
        <X size={14} />
      </button>
    </div>
  );
}
