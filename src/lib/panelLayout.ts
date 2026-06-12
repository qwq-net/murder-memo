import type { LayoutColumn, LayoutStructure, PanelId, PanelLayout } from '@/types/memo';

/**
 * パネルレイアウト（カラムツリー）の純関数群。
 *
 * モデルの不変条件（types/memo.ts の PanelLayout を参照）をここで一元的に保証する:
 * - 全 PanelId が columns ∪ hidden にちょうど1回ずつ現れる
 * - columns は1〜3個、各 column.panels は1〜2個、表示パネルは必ず1枚以上
 * - size は合計100に正規化、rowSizes は2段カラムのみ保持
 *
 * すべての関数は入力を変更せず新しいオブジェクトを返す（store の参照比較と相性を保つ）。
 */

/** 全パネル ID（順序は既定レイアウトの並びと一致させる） */
const ALL_PANELS: readonly PanelId[] = ['free', 'timeline', 'personal'];

/** カラム幅・段高さの最小比率（%）。リサイズと正規化の両方で使う */
export const MIN_PANE_PERCENT = 10;

/** 既定レイアウト: 3列等分 [free, timeline, personal] */
export const DEFAULT_PANEL_LAYOUT: PanelLayout = {
  columns: [
    { panels: ['free'], size: 100 / 3 },
    { panels: ['timeline'], size: 100 / 3 },
    { panels: ['personal'], size: 100 / 3 },
  ],
  hidden: [],
};

/** 入力を変更しないためのディープコピー */
function cloneLayout(layout: PanelLayout): PanelLayout {
  return {
    columns: layout.columns.map((c) => ({
      panels: [...c.panels],
      size: c.size,
      ...(c.rowSizes ? { rowSizes: [...c.rowSizes] as [number, number] } : {}),
    })),
    hidden: [...layout.hidden],
  };
}

function isPanelId(value: unknown): value is PanelId {
  return ALL_PANELS.includes(value as PanelId);
}

/**
 * サイズ配列を「各要素 >= min、合計 100」に正規化する。
 * 非数・0以下は等分にフォールバック。min 未満の要素は min へ引き上げ、残りを比例配分する。
 */
function normalizeSizes(sizes: number[], min: number): number[] {
  const n = sizes.length;
  if (n === 0) return [];
  const valid = sizes.every((s) => Number.isFinite(s) && s > 0);
  let result = valid ? [...sizes] : Array(n).fill(100 / n);

  // 合計100へスケール
  const total = result.reduce((a, b) => a + b, 0);
  result = result.map((s) => (s / total) * 100);

  // min 未満を引き上げ、超過分を min 以上の要素から比例して削る
  // （要素数は最大3・min=10 のため常に実現可能: min*n <= 100）
  const deficit = result.reduce((acc, s) => acc + Math.max(0, min - s), 0);
  if (deficit > 0) {
    const surplusTotal = result.reduce((acc, s) => acc + Math.max(0, s - min), 0);
    result = result.map((s) =>
      s < min ? min : surplusTotal > 0 ? s - ((s - min) / surplusTotal) * deficit : s,
    );
  }
  return result;
}

/** カラム配列のサイズ（幅・段高さ）をまとめて正規化する */
function normalizeColumnSizes(columns: LayoutColumn[]): LayoutColumn[] {
  const widths = normalizeSizes(
    columns.map((c) => c.size),
    MIN_PANE_PERCENT,
  );
  return columns.map((c, i) => {
    const col: LayoutColumn = { panels: [...c.panels], size: widths[i] };
    if (c.panels.length === 2) {
      const rows = normalizeSizes(c.rowSizes ? [...c.rowSizes] : [50, 50], MIN_PANE_PERCENT);
      col.rowSizes = [rows[0], rows[1]];
    }
    return col;
  });
}

/** 表示中のパネルを表示順（左→右、カラム内は上→下）で返す */
export function visiblePanels(layout: PanelLayout): PanelId[] {
  return layout.columns.flatMap((c) => c.panels);
}

/** 全パネルを「表示順 → 非表示」の順で返す（検索のグルーピング・テキスト出力用） */
export function fullPanelOrder(layout: PanelLayout): PanelId[] {
  return [...visiblePanels(layout), ...layout.hidden];
}

/**
 * 任意の値を正当な PanelLayout に正規化する（localStorage / IDB 由来の壊れた値の救済込み）。
 *
 * 救済ルール:
 * - 構造が読めない値 → 既定レイアウト
 * - 未知の PanelId・2回目以降の重複は除去。1カラム3枚以上は超過分を右隣の新カラムへ分割
 * - どこにも現れないパネルは右端に新カラムとして**可視**追加（fail-open。
 *   データが見えなくなる方向には倒さない）
 * - 全パネルが非表示なら hidden の先頭を可視へ昇格
 * - サイズは normalizeSizes で救済（非数・0以下は等分、min clamp、合計100）
 */
export function normalizeLayout(value: unknown): PanelLayout {
  if (value == null || typeof value !== 'object') return cloneLayout(DEFAULT_PANEL_LAYOUT);
  const raw = value as { columns?: unknown; hidden?: unknown };
  if (!Array.isArray(raw.columns)) return cloneLayout(DEFAULT_PANEL_LAYOUT);

  const seen = new Set<PanelId>();
  const columns: LayoutColumn[] = [];

  for (const rawCol of raw.columns) {
    if (rawCol == null || typeof rawCol !== 'object') continue;
    const colPanels = (rawCol as { panels?: unknown }).panels;
    if (!Array.isArray(colPanels)) continue;
    const panels = colPanels.filter((p): p is PanelId => isPanelId(p) && !seen.has(p));
    panels.forEach((p) => seen.add(p));
    if (panels.length === 0) continue;

    const size = (rawCol as { size?: unknown }).size;
    const rowSizes = (rawCol as { rowSizes?: unknown }).rowSizes;
    // 1カラムは最大2枚。超過分は右隣の新カラムへ分割する
    for (let i = 0; i < panels.length; i += 2) {
      const chunk = panels.slice(i, i + 2);
      columns.push({
        panels: chunk,
        size: typeof size === 'number' && i === 0 ? size : 0,
        ...(chunk.length === 2 && Array.isArray(rowSizes) && i === 0
          ? { rowSizes: [Number(rowSizes[0]), Number(rowSizes[1])] as [number, number] }
          : {}),
      });
    }
  }

  const hidden = (Array.isArray(raw.hidden) ? raw.hidden : []).filter(
    (p): p is PanelId => isPanelId(p) && !seen.has(p) && (seen.add(p), true),
  );

  // 欠落パネルは右端に可視追加（fail-open）
  for (const p of ALL_PANELS) {
    if (!seen.has(p)) columns.push({ panels: [p], size: 0 });
  }

  // 全パネル非表示なら先頭を可視へ昇格
  if (columns.length === 0 && hidden.length > 0) {
    const first = hidden.shift()!;
    columns.push({ panels: [first], size: 100 });
  }

  return { columns: normalizeColumnSizes(columns), hidden };
}

/**
 * 旧形式 settings.panelOrder（[PanelId, PanelId, PanelId]）を新レイアウトへ変換する。
 * 全パネルがちょうど1回ずつ現れる配列のみ受理し、それ以外は undefined（既定値に委ねる）。
 */
export function fromLegacyPanelOrder(order: unknown): PanelLayout | undefined {
  if (!Array.isArray(order) || order.length !== ALL_PANELS.length) return undefined;
  if (!order.every(isPanelId) || new Set(order).size !== ALL_PANELS.length) return undefined;
  return {
    columns: order.map((p) => ({ panels: [p], size: 100 / order.length })),
    hidden: [],
  };
}

/**
 * インポートファイル由来のレイアウトを検証する。エクスポート JSON は手編集されうるため
 * ファイルの値は信用せず、構造が完全に正当な場合のみ正規化して返す。
 * 怪しい値は undefined（= セッションはグローバル設定に準拠）に倒す。
 */
export function sanitizeImportedLayout(value: unknown): PanelLayout | undefined {
  if (value == null || typeof value !== 'object') return undefined;
  const raw = value as { columns?: unknown; hidden?: unknown };
  if (!Array.isArray(raw.columns) || !Array.isArray(raw.hidden)) return undefined;

  // 構造の厳密検証: カラム1〜3・各1〜2枚・全パネルがちょうど1回・表示1枚以上
  if (raw.columns.length < 1 || raw.columns.length > 3) return undefined;
  const ids: unknown[] = [];
  for (const col of raw.columns) {
    const panels = (col as { panels?: unknown })?.panels;
    if (!Array.isArray(panels) || panels.length < 1 || panels.length > 2) return undefined;
    ids.push(...panels);
  }
  ids.push(...raw.hidden);
  if (ids.length !== ALL_PANELS.length) return undefined;
  if (!ids.every(isPanelId) || new Set(ids).size !== ALL_PANELS.length) return undefined;

  // サイズの救済は normalizeLayout に委ねる
  return normalizeLayout(value);
}

/** カラム形状から構造プリセットを判定する（保存しない派生情報） */
export function classifyStructure(layout: PanelLayout): LayoutStructure {
  const shape = layout.columns.map((c) => c.panels.length).join(',');
  if (shape === '2') return 'stacked';
  if (shape === '2,1') return 'stack-left';
  if (shape === '1,2') return 'stack-right';
  return 'columns';
}

/** 表示パネル枚数ごとに選択可能な構造プリセット */
export function structuresForCount(count: number): LayoutStructure[] {
  if (count >= 3) return ['columns', 'stack-left', 'stack-right'];
  if (count === 2) return ['columns', 'stacked'];
  return ['columns'];
}

/**
 * 構造プリセットを適用する。表示順を維持したまま新形状のスロットへ前から詰め、
 * サイズは等分にリセットする（hidden は不変）。
 * 表示枚数に対して不正な構造が渡された場合は 'columns' として扱う。
 */
export function applyStructure(layout: PanelLayout, structure: LayoutStructure): PanelLayout {
  const seq = visiblePanels(layout);
  const effective = structuresForCount(seq.length).includes(structure) ? structure : 'columns';

  let columns: LayoutColumn[];
  if (effective === 'stacked') {
    columns = [{ panels: [seq[0], seq[1]], size: 100, rowSizes: [50, 50] }];
  } else if (effective === 'stack-left') {
    columns = [
      { panels: [seq[0], seq[1]], size: 50, rowSizes: [50, 50] },
      { panels: [seq[2]], size: 50 },
    ];
  } else if (effective === 'stack-right') {
    columns = [
      { panels: [seq[0]], size: 50 },
      { panels: [seq[1], seq[2]], size: 50, rowSizes: [50, 50] },
    ];
  } else {
    columns = seq.map((p) => ({ panels: [p], size: 100 / seq.length }));
  }
  return { columns, hidden: [...layout.hidden] };
}

/**
 * 表示パネルの並び順を変更する。形状・サイズは維持し、既存スロット
 * （左カラムから順、カラム内は上→下）へ seq を前から流し込む。
 * seq が現在の表示パネル集合と一致しない場合は何もしない（クローンを返す）。
 */
export function applySequence(layout: PanelLayout, seq: PanelId[]): PanelLayout {
  const current = visiblePanels(layout);
  const valid =
    seq.length === current.length &&
    new Set(seq).size === seq.length &&
    seq.every((p) => current.includes(p));
  if (!valid) return cloneLayout(layout);

  const next = cloneLayout(layout);
  let i = 0;
  for (const col of next.columns) {
    col.panels = col.panels.map(() => seq[i++]);
  }
  return next;
}

/**
 * パネルの表示/非表示を切り替える。
 *
 * - 非表示化はツリーの剪定: 所属カラムから除去 → 空カラムは削除（残カラムの比率を保って
 *   再正規化）→ 1段になったカラムの rowSizes を削除 → hidden 末尾へ。
 *   最後の表示1枚を隠す操作は不正なので何もしない（UI 側でも disabled にする）
 * - 再表示は右端に新カラムとして追加（位置記憶は持たない。並び順エディタで調整できる
 *   予測可能性を優先）。既存カラムの比率は保ったまま等分相当を新カラムへ割く
 */
export function setPanelHidden(layout: PanelLayout, panel: PanelId, hidden: boolean): PanelLayout {
  const isHidden = layout.hidden.includes(panel);

  if (hidden) {
    if (isHidden) return cloneLayout(layout);
    if (visiblePanels(layout).length <= 1) return cloneLayout(layout); // 全非表示は禁止
    const columns = layout.columns
      .map((c) => ({ ...c, panels: c.panels.filter((p) => p !== panel) }))
      .filter((c) => c.panels.length > 0)
      .map((c) => {
        const col: LayoutColumn = { panels: [...c.panels], size: c.size };
        if (c.panels.length === 2 && c.rowSizes) col.rowSizes = [...c.rowSizes];
        return col;
      });
    return { columns: normalizeColumnSizes(columns), hidden: [...layout.hidden, panel] };
  }

  if (!isHidden) return cloneLayout(layout);
  const next = cloneLayout(layout);
  next.hidden = next.hidden.filter((p) => p !== panel);
  // 新カラムへ等分相当（100 / 新カラム数）を割き、既存カラムは比率を保って縮める
  const newSize = 100 / (next.columns.length + 1);
  next.columns = next.columns.map((c) => ({ ...c, size: c.size * ((100 - newSize) / 100) }));
  next.columns.push({ panels: [panel], size: newSize });
  next.columns = normalizeColumnSizes(next.columns);
  return next;
}

/**
 * 隣接カラム（gapIndex と gapIndex+1）の幅を deltaRatio（%ポイント）だけ付け替える。
 * 両カラムとも MIN_PANE_PERCENT を下回らない範囲で clamp し、2カラムの合計は維持する。
 */
export function resizeColumns(
  layout: PanelLayout,
  gapIndex: number,
  deltaRatio: number,
): PanelLayout {
  if (gapIndex < 0 || gapIndex + 1 >= layout.columns.length) return cloneLayout(layout);
  const next = cloneLayout(layout);
  const left = next.columns[gapIndex];
  const right = next.columns[gapIndex + 1];
  const pairTotal = left.size + right.size;
  const newLeft = Math.min(
    Math.max(left.size + deltaRatio, MIN_PANE_PERCENT),
    pairTotal - MIN_PANE_PERCENT,
  );
  left.size = newLeft;
  right.size = pairTotal - newLeft;
  return next;
}

/**
 * 2段カラム（columnIndex）の上下高さを deltaRatio（%ポイント）だけ付け替える。
 * rowSizes を持たないカラムを指した場合は何もしない（クローンを返す）。
 */
export function resizeRows(
  layout: PanelLayout,
  columnIndex: number,
  deltaRatio: number,
): PanelLayout {
  const next = cloneLayout(layout);
  const col = next.columns[columnIndex];
  if (!col?.rowSizes) return next;
  const top = Math.min(
    Math.max(col.rowSizes[0] + deltaRatio, MIN_PANE_PERCENT),
    100 - MIN_PANE_PERCENT,
  );
  col.rowSizes = [top, 100 - top];
  return next;
}

/**
 * 「配置」（カラム形状とパネルの並び）が同じかを判定する。サイズ（size / rowSizes）と
 * hidden の順序は無視する。構造・並び順・表示切替で配置が実際に変わったときだけ
 * 順番ヒントのオーバーレイを出す、といった「見た目の変化検知」に使う。
 */
export function arrangementEqual(a: PanelLayout, b: PanelLayout): boolean {
  if (a.columns.length !== b.columns.length) return false;
  return a.columns.every((ca, i) => {
    const cb = b.columns[i];
    return ca.panels.length === cb.panels.length && ca.panels.every((p, j) => p === cb.panels[j]);
  });
}

/** レイアウトの実質同値比較（サイズは浮動小数の誤差を許容）。リセットボタンの活性判定用 */
export function layoutsEqual(a: PanelLayout, b: PanelLayout): boolean {
  if (a.columns.length !== b.columns.length || a.hidden.length !== b.hidden.length) return false;
  if (!a.hidden.every((p, i) => p === b.hidden[i])) return false;
  return a.columns.every((ca, i) => {
    const cb = b.columns[i];
    if (ca.panels.length !== cb.panels.length) return false;
    if (!ca.panels.every((p, j) => p === cb.panels[j])) return false;
    if (Math.abs(ca.size - cb.size) > 0.01) return false;
    const ra = ca.rowSizes ?? null;
    const rb = cb.rowSizes ?? null;
    if ((ra === null) !== (rb === null)) return false;
    if (ra && rb && (Math.abs(ra[0] - rb[0]) > 0.01 || Math.abs(ra[1] - rb[1]) > 0.01))
      return false;
    return true;
  });
}
