import { forwardRef, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react';

// ─── 型定義 ─────────────────────────────────────────────────────────────────

export interface ContextMenuItem {
  label: string;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}

export interface ContextMenuSubmenuItem {
  label: string;
  disabled?: boolean;
  submenu: ContextMenuEntry[];
}

export interface ContextMenuSeparator {
  separator: true;
}

export interface ContextMenuHeader {
  header: true;
  label: string;
}

export type ContextMenuEntry =
  | ContextMenuItem
  | ContextMenuSubmenuItem
  | ContextMenuSeparator
  | ContextMenuHeader;

function isSubmenu(item: ContextMenuEntry): item is ContextMenuSubmenuItem {
  return 'submenu' in item;
}
function isSeparator(item: ContextMenuEntry): item is ContextMenuSeparator {
  return 'separator' in item && (item as ContextMenuSeparator).separator === true;
}
function isHeader(item: ContextMenuEntry): item is ContextMenuHeader {
  return 'header' in item && (item as ContextMenuHeader).header === true;
}

// ─── 安全三角形（サブメニューへのポインタ移動判定） ──────────────────────────

const TOLERANCE_RAD = (15 * Math.PI) / 180;
const THROTTLE_MS = 16;
const IDLE_TIMEOUT_MS = 600;
const MAX_INVALID_COUNT = 2;
const SUBMENU_MIN_WIDTH = 150;

interface SafeTriangleState {
  rect: DOMRect | null;
  direction: 'right' | 'left';
  prev: { x: number; y: number } | null;
  invalidCount: number;
  idleTimer: ReturnType<typeof setTimeout> | null;
  lastTime: number;
  /** サブメニューを開いた親メニュー項目の矩形 */
  triggerRect: DOMRect | null;
}

function isMovingToward(st: SafeTriangleState, cx: number, cy: number): boolean {
  if (!st.rect || !st.prev) return true;

  const dx = cx - st.prev.x;
  const dy = cy - st.prev.y;
  if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return true;

  if (st.direction === 'right' && dx < -2) return false;
  if (st.direction === 'left' && dx > 2) return false;

  // 外積ベースの判定（atan2 ラップアラウンド回避）
  const nearX = st.direction === 'right' ? st.rect.left : st.rect.right;
  const toTopX = nearX - st.prev.x;
  const toTopY = st.rect.top - st.prev.y;
  const toBotX = nearX - st.prev.x;
  const toBotY = st.rect.bottom - st.prev.y;

  const crossA = toTopX * dy - toTopY * dx;
  const crossB = dx * toBotY - dy * toBotX;
  if (crossA * crossB >= 0) return true;

  // 許容範囲
  const thetaPointer = Math.atan2(dy, dx);
  const thetaTop = Math.atan2(toTopY, toTopX);
  const thetaBot = Math.atan2(toBotY, toBotX);
  const diffTop = Math.abs(((thetaPointer - thetaTop + 3 * Math.PI) % (2 * Math.PI)) - Math.PI);
  const diffBot = Math.abs(((thetaPointer - thetaBot + 3 * Math.PI) % (2 * Math.PI)) - Math.PI);
  return Math.min(diffTop, diffBot) <= TOLERANCE_RAD;
}

function isInsideRect(x: number, y: number, r: DOMRect): boolean {
  return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
}

// ─── 共通スタイル ───────────────────────────────────────────────────────────

const ITEM_STYLE: React.CSSProperties = {
  display: 'block',
  width: '100%',
  padding: '3px 10px 3px 12px',
  background: 'none',
  border: 'none',
  textAlign: 'left',
  fontSize: 14,
  color: 'var(--text-primary)',
  cursor: 'pointer',
  transition: 'background 0.1s',
};

// ─── コンテキストメニュー ────────────────────────────────────────────────────

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuEntry[];
  onClose: () => void;
}

export function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const submenuRef = useRef<HTMLDivElement>(null);

  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [subPos, setSubPos] = useState({ x: 0, y: 0 });

  // Safe Triangle 状態（レンダリング不要なので ref）
  const stRef = useRef<SafeTriangleState>({
    rect: null,
    direction: 'right',
    prev: null,
    invalidCount: 0,
    idleTimer: null,
    lastTime: 0,
    triggerRect: null,
  });

  // ── 親メニュー画面外補正 ──
  useEffect(() => {
    const el = menuRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const pad = 4; // 画面端からの最小マージン
    if (r.right > window.innerWidth) el.style.left = `${Math.max(pad, x - r.width)}px`;
    if (r.bottom > window.innerHeight) {
      const newTop = Math.max(pad, window.innerHeight - r.height - pad);
      el.style.top = `${newTop}px`;
    }
  }, [x, y]);

  // ── 外側クリックで閉じる ──
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (menuRef.current?.contains(target)) return;
      if (submenuRef.current?.contains(target)) return;
      onClose();
    };
    // 次フレームで登録（右クリックイベント自身で閉じないように）
    // cleanup 時に cancelAnimationFrame で登録を防止（StrictMode 対策）
    const rafId = requestAnimationFrame(() => document.addEventListener('mousedown', handler));
    return () => {
      cancelAnimationFrame(rafId);
      document.removeEventListener('mousedown', handler);
    };
  }, [onClose]);

  // ── Escape ──
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (openIndex !== null) setOpenIndex(null);
        else onClose();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose, openIndex]);

  // ── Safe Triangle: pointermove ──
  useEffect(() => {
    const st = stRef.current;
    if (openIndex === null) {
      if (st.idleTimer) clearTimeout(st.idleTimer);
      st.rect = null;
      st.prev = null;
      st.invalidCount = 0;
      return;
    }

    const handler = (e: PointerEvent) => {
      if (e.pointerType === 'touch' || e.pointerType === 'pen') return;
      if (!st.rect) return;

      const now = Date.now();
      if (now - st.lastTime < THROTTLE_MS) return;
      st.lastTime = now;

      const px = e.clientX, py = e.clientY;

      // 安全ゾーン: サブメニュー内 or トリガー項目内 → 常に有効
      const inSubmenu = isInsideRect(px, py, st.rect);
      const inTrigger = st.triggerRect != null && isInsideRect(px, py, st.triggerRect);

      if (inSubmenu || inTrigger) {
        st.invalidCount = 0;
        st.prev = { x: px, y: py };
        if (st.idleTimer) clearTimeout(st.idleTimer);
        return;
      }

      // 安全ゾーン外: 三角形内なら有効、外なら invalid カウント
      if (st.prev) {
        if (isMovingToward(st, px, py)) {
          st.invalidCount = 0;
        } else {
          st.invalidCount++;
          if (st.invalidCount >= MAX_INVALID_COUNT) {
            setOpenIndex(null);
          }
        }
      }
      st.prev = { x: px, y: py };

      // 完全に外 → アイドルタイムアウト開始
      if (st.idleTimer) clearTimeout(st.idleTimer);
      st.idleTimer = setTimeout(() => setOpenIndex(null), IDLE_TIMEOUT_MS);
    };

    document.addEventListener('pointermove', handler);
    return () => {
      document.removeEventListener('pointermove', handler);
      if (st.idleTimer) clearTimeout(st.idleTimer);
    };
  }, [openIndex]);

  // ── サブメニュークリック開閉 ──
  // 位置と方向を事前計算し、React state として渡す（DOM 直接操作しない）
  const toggleSubmenu = useCallback((index: number, el: HTMLElement) => {
    setOpenIndex((prev) => {
      if (prev === index) return null;
      return index;
    });

    const parentRect = menuRef.current?.getBoundingClientRect();
    const itemRect = el.getBoundingClientRect();
    if (!parentRect) return;

    // 方向判定: 右に出した場合にはみ出すか？
    const rightX = parentRect.right - 2;
    const wouldOverflowRight = rightX + SUBMENU_MIN_WIDTH > window.innerWidth;

    let posX: number;
    let dir: 'right' | 'left';
    if (wouldOverflowRight) {
      posX = parentRect.left - SUBMENU_MIN_WIDTH + 2;
      dir = 'left';
    } else {
      posX = rightX;
      dir = 'right';
    }

    setSubPos({ x: posX, y: itemRect.top - 4 });

    const st = stRef.current;
    st.direction = dir;
    st.rect = null;
    st.prev = null;
    st.invalidCount = 0;
    st.triggerRect = el.getBoundingClientRect();
  }, []);

  // ── レンダリング ──
  const openSubmenuItem = openIndex !== null ? items[openIndex] : null;

  return (
    <>
      <div
        ref={menuRef}
        role="menu"
        aria-label="コンテキストメニュー"
        style={{
          position: 'fixed', top: y, left: x, zIndex: 200, minWidth: 160,
          background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-md)', padding: '3px 0',
          boxShadow: '0 8px 32px var(--shadow-menu)',
          maxHeight: 'calc(100vh - 8px)', overflowY: 'auto',
        }}
      >
        {items.map((item, i) => {
          if (isSeparator(item)) {
            return <div key={`sep-${i}`} style={{ height: 1, background: 'var(--border-subtle)', margin: '2px 0' }} />;
          }
          if (isHeader(item)) {
            return (
              <div key={`hdr-${i}`} style={{ padding: '4px 10px 1px 12px', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
                {item.label}
              </div>
            );
          }
          if (isSubmenu(item)) {
            const isOpen = openIndex === i;
            return (
              <button
                key={i}
                role="menuitem"
                aria-haspopup="true"
                aria-expanded={isOpen}
                disabled={item.disabled}
                onClick={(e) => { if (!item.disabled) toggleSubmenu(i, e.currentTarget); }}
                onMouseEnter={(e) => { if (!item.disabled) e.currentTarget.style.background = 'var(--bg-hover)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = isOpen ? 'var(--bg-active)' : 'none'; }}
                style={{
                  ...ITEM_STYLE, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: isOpen ? 'var(--bg-active)' : 'none',
                  color: item.disabled ? 'var(--text-faint)' : 'var(--text-primary)',
                  cursor: item.disabled ? 'default' : 'pointer',
                }}
              >
                {item.label}
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none" style={{ flexShrink: 0, opacity: 0.5 }}>
                  <path d="M2 1l3 3-3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            );
          }
          return (
            <button
              key={i}
              role="menuitem"
              disabled={item.disabled}
              onClick={() => { item.onClick(); onClose(); }}
              onMouseEnter={(e) => {
                if (!item.disabled) e.currentTarget.style.background = 'var(--bg-hover)';
              }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
              style={{
                ...ITEM_STYLE,
                color: item.disabled ? 'var(--text-faint)' : item.danger ? 'var(--danger)' : 'var(--text-primary)',
                cursor: item.disabled ? 'default' : 'pointer',
              }}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {openSubmenuItem && isSubmenu(openSubmenuItem) && (
        <SubMenu
          ref={(el) => { submenuRef.current = el; }}
          x={subPos.x}
          y={subPos.y}
          items={openSubmenuItem.submenu}
          onClose={onClose}
          safeTriangleRef={stRef}
        />
      )}
    </>
  );
}

// ─── サブメニュー ───────────────────────────────────────────────────────────

interface SubMenuProps {
  x: number;
  y: number;
  items: ContextMenuEntry[];
  onClose: () => void;
  safeTriangleRef: React.RefObject<SafeTriangleState>;
}

const SubMenu = forwardRef<HTMLDivElement, SubMenuProps>(
  function SubMenu({ x, y, items, onClose, safeTriangleRef }, ref) {
    const localRef = useRef<HTMLDivElement>(null);

    // ref を外部にも公開
    useImperativeHandle(ref, () => localRef.current!, []);

    // useLayoutEffect で位置補正 + Safe Triangle rect セット
    // React StrictMode で何度呼ばれても正しく動く（DOM 操作は最小限、props の位置から毎回計算）
    useLayoutEffect(() => {
      const el = localRef.current;
      if (!el) return;

      // props の位置にリセット（StrictMode 対策）
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;

      const sub = el.getBoundingClientRect();

      // 下はみ出し補正
      if (sub.bottom > window.innerHeight) {
        el.style.top = `${Math.max(4, window.innerHeight - sub.height - 4)}px`;
      }

      // 確定位置で Safe Triangle をセット
      const st = safeTriangleRef.current;
      st.rect = el.getBoundingClientRect();
      // direction は toggleSubmenu で事前セット済み（ここでは変更しない）
      st.prev = null;
      st.invalidCount = 0;
    }, [x, y, safeTriangleRef]);

    return (
      <div
        ref={localRef}
        role="menu"
        style={{
          position: 'fixed', top: y, left: x, zIndex: 201, minWidth: SUBMENU_MIN_WIDTH,
          background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-md)', padding: '3px 0',
          boxShadow: '0 8px 32px var(--shadow-menu)',
          maxHeight: 'calc(100vh - 8px)', overflowY: 'auto',
        }}
      >
        {items.map((item, i) => {
          if (isSeparator(item)) return <div key={`sep-${i}`} style={{ height: 1, background: 'var(--border-subtle)', margin: '2px 0' }} />;
          if (isHeader(item)) return (
            <div key={`hdr-${i}`} style={{ padding: '4px 10px 1px 12px', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
              {item.label}
            </div>
          );
          if (isSubmenu(item)) return null;
          return (
            <button
              key={i}
              role="menuitem"
              disabled={item.disabled}
              onClick={() => { item.onClick(); onClose(); }}
              onMouseEnter={(e) => { if (!item.disabled) e.currentTarget.style.background = 'var(--bg-hover)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
              style={{
                ...ITEM_STYLE,
                color: item.disabled ? 'var(--text-faint)' : item.danger ? 'var(--danger)' : 'var(--text-primary)',
                cursor: item.disabled ? 'default' : 'pointer',
              }}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    );
  },
);
