import type { PanelId, PanelLayout } from '@/types/memo';
import {
  applySequence,
  applyStructure,
  arrangementEqual,
  classifyStructure,
  DEFAULT_PANEL_LAYOUT,
  fromLegacyPanelOrder,
  fullPanelOrder,
  layoutsEqual,
  MIN_PANE_PERCENT,
  normalizeLayout,
  resizeColumns,
  resizeRows,
  sanitizeImportedLayout,
  setPanelHidden,
  structuresForCount,
  visiblePanels,
} from '../panelLayout';

// ─── テスト用ヘルパー ──────────────────────────────────────────────────────────

/** カラムサイズ配列の合計を返す（正規化結果の検証用） */
function columnSizeSum(layout: PanelLayout): number {
  return layout.columns.reduce((acc, c) => acc + c.size, 0);
}

/** カラム形状（各カラムの枚数）を文字列化する（形状アサート用） */
function shapeOf(layout: PanelLayout): string {
  return layout.columns.map((c) => c.panels.length).join(',');
}

/** すべてのカラムサイズが最小比率以上か */
function allColumnsAtLeastMin(layout: PanelLayout): boolean {
  return layout.columns.every((c) => c.size >= MIN_PANE_PERCENT - 1e-9);
}

// ─── normalizeLayout ──────────────────────────────────────────────────────────

describe('normalizeLayout', () => {
  it('null は既定レイアウト（3列 free/timeline/personal 等分）になる', () => {
    const result = normalizeLayout(null);
    expect(result.columns.map((c) => c.panels)).toEqual([['free'], ['timeline'], ['personal']]);
    expect(result.hidden).toEqual([]);
    expect(columnSizeSum(result)).toBeCloseTo(100, 9);
    result.columns.forEach((c) => expect(c.size).toBeCloseTo(100 / 3, 9));
  });

  it('数値（オブジェクトでない値）は既定レイアウトになる', () => {
    expect(layoutsEqual(normalizeLayout(42), DEFAULT_PANEL_LAYOUT)).toBe(true);
  });

  it('columns が配列でないオブジェクトは既定レイアウトになる', () => {
    const result = normalizeLayout({ columns: 'oops', hidden: [] });
    expect(layoutsEqual(result, DEFAULT_PANEL_LAYOUT)).toBe(true);
  });

  it('未知の PanelId は除去される', () => {
    const input = {
      columns: [{ panels: ['free', 'bogus'], size: 100 }],
      hidden: ['timeline', 'personal'],
    };
    const result = normalizeLayout(input);
    expect(visiblePanels(result)).not.toContain('bogus' as PanelId);
    expect(fullPanelOrder(result).sort()).toEqual(['free', 'personal', 'timeline']);
  });

  it('重複パネルは最初の出現のみ残る', () => {
    const input = {
      columns: [
        { panels: ['free'], size: 50 },
        { panels: ['free'], size: 50 }, // 重複
      ],
      hidden: [],
    };
    const result = normalizeLayout(input);
    // free は1回のみ。timeline / personal は欠落なので可視追加される
    expect(visiblePanels(result).filter((p) => p === 'free')).toHaveLength(1);
    expect(fullPanelOrder(result).sort()).toEqual(['free', 'personal', 'timeline']);
  });

  it('1カラムに3枚詰められた場合、超過分が右隣の新カラムへ分割される（[3枚]→[2枚,1枚]）', () => {
    const input = {
      columns: [{ panels: ['free', 'timeline', 'personal'], size: 100 }],
      hidden: [],
    };
    const result = normalizeLayout(input);
    expect(result.columns).toHaveLength(2);
    expect(result.columns[0].panels).toEqual(['free', 'timeline']);
    expect(result.columns[1].panels).toEqual(['personal']);
  });

  it('どこにも現れないパネルは右端に可視カラムとして追加される（fail-open）', () => {
    const input = {
      columns: [{ panels: ['free'], size: 100 }],
      hidden: [], // timeline / personal がどこにも無い
    };
    const result = normalizeLayout(input);
    // hidden ではなく可視へ
    expect(result.hidden).toEqual([]);
    expect(visiblePanels(result)).toEqual(['free', 'timeline', 'personal']);
  });

  it('全パネルが hidden の場合は hidden 先頭が可視へ昇格する', () => {
    const input = { columns: [], hidden: ['free', 'timeline', 'personal'] };
    const result = normalizeLayout(input);
    expect(visiblePanels(result)).toEqual(['free']);
    expect(result.hidden).toEqual(['timeline', 'personal']);
    expect(columnSizeSum(result)).toBeCloseTo(100, 9);
  });

  it('size が 0 以下・非数なら等分に復旧し合計100になる', () => {
    const input = {
      columns: [
        { panels: ['free'], size: 0 },
        { panels: ['timeline'], size: -5 },
        { panels: ['personal'], size: Number.NaN },
      ],
      hidden: [],
    };
    const result = normalizeLayout(input);
    expect(columnSizeSum(result)).toBeCloseTo(100, 9);
    result.columns.forEach((c) => expect(c.size).toBeCloseTo(100 / 3, 9));
  });

  it('2段カラムに rowSizes が無ければ [50,50] が補完される', () => {
    const input = {
      columns: [
        { panels: ['free', 'timeline'], size: 50 }, // rowSizes なし
        { panels: ['personal'], size: 50 },
      ],
      hidden: [],
    };
    const result = normalizeLayout(input);
    expect(result.columns[0].rowSizes).toEqual([50, 50]);
  });

  it('1段カラムの rowSizes は削除される', () => {
    const input = {
      columns: [
        { panels: ['free'], size: 100 / 3, rowSizes: [70, 30] }, // 1段なのに rowSizes
        { panels: ['timeline'], size: 100 / 3 },
        { panels: ['personal'], size: 100 / 3 },
      ],
      hidden: [],
    };
    const result = normalizeLayout(input);
    expect(result.columns[0].rowSizes).toBeUndefined();
  });

  it('入力オブジェクトを変更しない（非破壊）', () => {
    const input = {
      columns: [
        { panels: ['free', 'timeline', 'personal'], size: 100 }, // 分割が走るケース
      ],
      hidden: [] as PanelId[],
    };
    const snapshot = JSON.parse(JSON.stringify(input));
    normalizeLayout(input);
    expect(input).toEqual(snapshot);
  });
});

// ─── fromLegacyPanelOrder ─────────────────────────────────────────────────────

describe('fromLegacyPanelOrder', () => {
  it('正当な3要素から3列レイアウトを生成する', () => {
    const result = fromLegacyPanelOrder(['personal', 'free', 'timeline']);
    expect(result).toBeDefined();
    expect(result!.columns.map((c) => c.panels)).toEqual([['personal'], ['free'], ['timeline']]);
    expect(result!.hidden).toEqual([]);
    expect(columnSizeSum(result!)).toBeCloseTo(100, 9);
  });

  it('長さ不足は undefined', () => {
    expect(fromLegacyPanelOrder(['free', 'timeline'])).toBeUndefined();
  });

  it('重複を含むと undefined', () => {
    expect(fromLegacyPanelOrder(['free', 'free', 'timeline'])).toBeUndefined();
  });

  it('未知 ID を含むと undefined', () => {
    expect(fromLegacyPanelOrder(['free', 'timeline', 'bogus'])).toBeUndefined();
  });

  it('配列でない値は undefined', () => {
    expect(fromLegacyPanelOrder('free,timeline,personal')).toBeUndefined();
  });
});

// ─── sanitizeImportedLayout ───────────────────────────────────────────────────

describe('sanitizeImportedLayout', () => {
  it('正当な値は正規化されて返る', () => {
    const input: PanelLayout = {
      columns: [
        { panels: ['free', 'timeline'], size: 60, rowSizes: [40, 60] },
        { panels: ['personal'], size: 40 },
      ],
      hidden: [],
    };
    const result = sanitizeImportedLayout(input);
    expect(result).toBeDefined();
    expect(shapeOf(result!)).toBe('2,1');
    expect(columnSizeSum(result!)).toBeCloseTo(100, 9);
  });

  it('null は undefined', () => {
    expect(sanitizeImportedLayout(null)).toBeUndefined();
  });

  it('columns が配列でないと undefined', () => {
    expect(sanitizeImportedLayout({ columns: {}, hidden: [] })).toBeUndefined();
  });

  it('hidden が配列でないと undefined', () => {
    expect(
      sanitizeImportedLayout({ columns: [{ panels: ['free'], size: 100 }], hidden: 'x' }),
    ).toBeUndefined();
  });

  it('カラム0個は undefined', () => {
    const input = { columns: [], hidden: ['free', 'timeline', 'personal'] };
    expect(sanitizeImportedLayout(input)).toBeUndefined();
  });

  it('カラム4個は undefined', () => {
    const input = {
      columns: [
        { panels: ['free'], size: 25 },
        { panels: ['timeline'], size: 25 },
        { panels: ['personal'], size: 25 },
        { panels: ['free'], size: 25 },
      ],
      hidden: [],
    };
    expect(sanitizeImportedLayout(input)).toBeUndefined();
  });

  it('カラム内3枚は undefined', () => {
    const input = {
      columns: [{ panels: ['free', 'timeline', 'personal'], size: 100 }],
      hidden: [],
    };
    expect(sanitizeImportedLayout(input)).toBeUndefined();
  });

  it('パネル重複は undefined', () => {
    const input = {
      columns: [
        { panels: ['free'], size: 50 },
        { panels: ['free'], size: 50 },
      ],
      hidden: ['timeline'],
    };
    expect(sanitizeImportedLayout(input)).toBeUndefined();
  });

  it('パネル欠落は undefined', () => {
    const input = {
      columns: [{ panels: ['free'], size: 100 }],
      hidden: ['timeline'], // personal が欠落
    };
    expect(sanitizeImportedLayout(input)).toBeUndefined();
  });
});

// ─── visiblePanels / fullPanelOrder ───────────────────────────────────────────

describe('visiblePanels / fullPanelOrder', () => {
  it('visiblePanels は左→右・カラム内上→下の順で返す', () => {
    const layout: PanelLayout = {
      columns: [
        { panels: ['free', 'timeline'], size: 50, rowSizes: [50, 50] },
        { panels: ['personal'], size: 50 },
      ],
      hidden: [],
    };
    expect(visiblePanels(layout)).toEqual(['free', 'timeline', 'personal']);
  });

  it('fullPanelOrder は表示順のあとに hidden を連結する', () => {
    const layout: PanelLayout = {
      columns: [{ panels: ['timeline'], size: 100 }],
      hidden: ['free', 'personal'],
    };
    expect(fullPanelOrder(layout)).toEqual(['timeline', 'free', 'personal']);
  });
});

// ─── classifyStructure ────────────────────────────────────────────────────────

describe('classifyStructure', () => {
  const col = (panels: PanelId[], size: number, rowSizes?: [number, number]): PanelLayout => ({
    columns: [{ panels, size, ...(rowSizes ? { rowSizes } : {}) }],
    hidden: [],
  });

  it('[1] は columns', () => {
    expect(classifyStructure(col(['free'], 100))).toBe('columns');
  });

  it('[2] は stacked', () => {
    expect(classifyStructure(col(['free', 'timeline'], 100, [50, 50]))).toBe('stacked');
  });

  it('[1,1] は columns', () => {
    const layout: PanelLayout = {
      columns: [
        { panels: ['free'], size: 50 },
        { panels: ['timeline'], size: 50 },
      ],
      hidden: [],
    };
    expect(classifyStructure(layout)).toBe('columns');
  });

  it('[2,1] は stack-left', () => {
    const layout: PanelLayout = {
      columns: [
        { panels: ['free', 'timeline'], size: 50, rowSizes: [50, 50] },
        { panels: ['personal'], size: 50 },
      ],
      hidden: [],
    };
    expect(classifyStructure(layout)).toBe('stack-left');
  });

  it('[1,2] は stack-right', () => {
    const layout: PanelLayout = {
      columns: [
        { panels: ['free'], size: 50 },
        { panels: ['timeline', 'personal'], size: 50, rowSizes: [50, 50] },
      ],
      hidden: [],
    };
    expect(classifyStructure(layout)).toBe('stack-right');
  });

  it('[1,1,1] は columns', () => {
    expect(classifyStructure(DEFAULT_PANEL_LAYOUT)).toBe('columns');
  });
});

// ─── structuresForCount ───────────────────────────────────────────────────────

describe('structuresForCount', () => {
  it('3枚は columns / stack-left / stack-right', () => {
    expect(structuresForCount(3)).toEqual(['columns', 'stack-left', 'stack-right']);
  });

  it('2枚は columns / stacked', () => {
    expect(structuresForCount(2)).toEqual(['columns', 'stacked']);
  });

  it('1枚は columns のみ', () => {
    expect(structuresForCount(1)).toEqual(['columns']);
  });
});

// ─── applyStructure ───────────────────────────────────────────────────────────

describe('applyStructure', () => {
  // 表示順 free/timeline/personal の3列レイアウト
  const threeCols: PanelLayout = {
    columns: [
      { panels: ['free'], size: 20 },
      { panels: ['timeline'], size: 30 },
      { panels: ['personal'], size: 50 },
    ],
    hidden: [],
  };

  it('stack-left を適用すると表示順を保って [2,1] スロットへ前から詰める', () => {
    const result = applyStructure(threeCols, 'stack-left');
    expect(result.columns[0].panels).toEqual(['free', 'timeline']);
    expect(result.columns[1].panels).toEqual(['personal']);
  });

  it('stack-right を適用すると [1,2] スロットへ前から詰める', () => {
    const result = applyStructure(threeCols, 'stack-right');
    expect(result.columns[0].panels).toEqual(['free']);
    expect(result.columns[1].panels).toEqual(['timeline', 'personal']);
  });

  it('サイズは等分にリセットされる', () => {
    const result = applyStructure(threeCols, 'columns');
    result.columns.forEach((c) => expect(c.size).toBeCloseTo(100 / 3, 9));
  });

  it('hidden は不変', () => {
    const layout: PanelLayout = {
      columns: [
        { panels: ['free'], size: 50 },
        { panels: ['timeline'], size: 50 },
      ],
      hidden: ['personal'],
    };
    const result = applyStructure(layout, 'stacked');
    expect(result.hidden).toEqual(['personal']);
  });

  it('表示2枚で stack-left（不正構造）を渡すと columns として扱われる', () => {
    const layout: PanelLayout = {
      columns: [
        { panels: ['free'], size: 50 },
        { panels: ['timeline'], size: 50 },
      ],
      hidden: ['personal'],
    };
    const result = applyStructure(layout, 'stack-left');
    expect(shapeOf(result)).toBe('1,1');
    expect(classifyStructure(result)).toBe('columns');
  });
});

// ─── applySequence ────────────────────────────────────────────────────────────

describe('applySequence', () => {
  const stackLeft: PanelLayout = {
    columns: [
      { panels: ['free', 'timeline'], size: 60, rowSizes: [40, 60] },
      { panels: ['personal'], size: 40 },
    ],
    hidden: [],
  };

  it('形状・サイズ・rowSizes を維持して並びだけ変える', () => {
    const result = applySequence(stackLeft, ['personal', 'free', 'timeline']);
    // 形状は [2,1] のまま
    expect(shapeOf(result)).toBe('2,1');
    // スロットへ前から流し込む: 1カラム目上下=personal,free / 2カラム目=timeline
    expect(result.columns[0].panels).toEqual(['personal', 'free']);
    expect(result.columns[1].panels).toEqual(['timeline']);
    // サイズ・rowSizes は不変
    expect(result.columns[0].size).toBe(60);
    expect(result.columns[1].size).toBe(40);
    expect(result.columns[0].rowSizes).toEqual([40, 60]);
  });

  it('seq に欠けがあれば無変更のクローンを返す', () => {
    const result = applySequence(stackLeft, ['free', 'timeline']);
    expect(layoutsEqual(result, stackLeft)).toBe(true);
    expect(result).not.toBe(stackLeft); // 参照は別
  });

  it('seq に重複があれば無変更のクローンを返す', () => {
    const result = applySequence(stackLeft, ['free', 'free', 'timeline']);
    expect(layoutsEqual(result, stackLeft)).toBe(true);
  });

  it('seq に非表示パネルが混入していれば無変更のクローンを返す', () => {
    const layout: PanelLayout = {
      columns: [
        { panels: ['free'], size: 50 },
        { panels: ['timeline'], size: 50 },
      ],
      hidden: ['personal'],
    };
    // personal は表示集合に居ないので不一致
    const result = applySequence(layout, ['free', 'personal']);
    expect(layoutsEqual(result, layout)).toBe(true);
  });
});

// ─── setPanelHidden ───────────────────────────────────────────────────────────

describe('setPanelHidden', () => {
  it('非表示化するとカラムから除去され hidden 末尾へ追加される', () => {
    const result = setPanelHidden(DEFAULT_PANEL_LAYOUT, 'timeline', true);
    expect(visiblePanels(result)).toEqual(['free', 'personal']);
    expect(result.hidden).toEqual(['timeline']);
  });

  it('空になったカラムは消え、残りが合計100へ再正規化される', () => {
    const result = setPanelHidden(DEFAULT_PANEL_LAYOUT, 'timeline', true);
    expect(result.columns).toHaveLength(2);
    expect(columnSizeSum(result)).toBeCloseTo(100, 9);
    expect(allColumnsAtLeastMin(result)).toBe(true);
  });

  it('2段カラムの片方を隠すと rowSizes が消える', () => {
    const layout: PanelLayout = {
      columns: [{ panels: ['free', 'timeline'], size: 100, rowSizes: [40, 60] }],
      hidden: ['personal'],
    };
    const result = setPanelHidden(layout, 'timeline', true);
    expect(result.columns).toHaveLength(1);
    expect(result.columns[0].panels).toEqual(['free']);
    expect(result.columns[0].rowSizes).toBeUndefined();
    expect(result.columns[0].size).toBeCloseTo(100, 9);
  });

  it('最後の表示1枚を隠そうとしても無変更（クローン）', () => {
    const layout: PanelLayout = {
      columns: [{ panels: ['free'], size: 100 }],
      hidden: ['timeline', 'personal'],
    };
    const result = setPanelHidden(layout, 'free', true);
    expect(layoutsEqual(result, layout)).toBe(true);
    expect(result).not.toBe(layout);
  });

  it('再表示すると右端に新カラムが追加され合計100を維持する', () => {
    const layout: PanelLayout = {
      columns: [
        { panels: ['free'], size: 50 },
        { panels: ['timeline'], size: 50 },
      ],
      hidden: ['personal'],
    };
    const result = setPanelHidden(layout, 'personal', false);
    expect(result.hidden).toEqual([]);
    expect(visiblePanels(result)).toEqual(['free', 'timeline', 'personal']);
    expect(result.columns).toHaveLength(3);
    expect(columnSizeSum(result)).toBeCloseTo(100, 9);
    expect(allColumnsAtLeastMin(result)).toBe(true);
  });

  it('すでに非表示のものを隠そうとすると無変更のクローンを返す', () => {
    const layout: PanelLayout = {
      columns: [
        { panels: ['free'], size: 50 },
        { panels: ['timeline'], size: 50 },
      ],
      hidden: ['personal'],
    };
    const result = setPanelHidden(layout, 'personal', true);
    expect(layoutsEqual(result, layout)).toBe(true);
    expect(result).not.toBe(layout);
  });

  it('すでに表示中のものを表示しようとすると無変更のクローンを返す', () => {
    const result = setPanelHidden(DEFAULT_PANEL_LAYOUT, 'free', false);
    expect(layoutsEqual(result, DEFAULT_PANEL_LAYOUT)).toBe(true);
    expect(result).not.toBe(DEFAULT_PANEL_LAYOUT);
  });
});

// ─── resizeColumns ────────────────────────────────────────────────────────────

describe('resizeColumns', () => {
  const twoCols: PanelLayout = {
    columns: [
      { panels: ['free'], size: 50 },
      { panels: ['timeline'], size: 50 },
    ],
    hidden: ['personal'],
  };

  it('隣接2カラムの合計を維持して幅を付け替える', () => {
    const result = resizeColumns(twoCols, 0, 10);
    expect(result.columns[0].size).toBeCloseTo(60, 9);
    expect(result.columns[1].size).toBeCloseTo(40, 9);
    expect(result.columns[0].size + result.columns[1].size).toBeCloseTo(100, 9);
  });

  it('過大な delta は MIN_PANE_PERCENT で clamp される', () => {
    const result = resizeColumns(twoCols, 0, 1000);
    expect(result.columns[0].size).toBeCloseTo(90, 9);
    expect(result.columns[1].size).toBeCloseTo(MIN_PANE_PERCENT, 9);
  });

  it('過小な delta（負方向）も MIN_PANE_PERCENT で clamp される', () => {
    const result = resizeColumns(twoCols, 0, -1000);
    expect(result.columns[0].size).toBeCloseTo(MIN_PANE_PERCENT, 9);
    expect(result.columns[1].size).toBeCloseTo(90, 9);
  });

  it('範囲外の gapIndex（負値）は無変更のクローン', () => {
    const result = resizeColumns(twoCols, -1, 10);
    expect(layoutsEqual(result, twoCols)).toBe(true);
    expect(result).not.toBe(twoCols);
  });

  it('範囲外の gapIndex（末尾カラム）は無変更のクローン', () => {
    // gapIndex+1 が範囲外
    const result = resizeColumns(twoCols, 1, 10);
    expect(layoutsEqual(result, twoCols)).toBe(true);
  });
});

// ─── resizeRows ───────────────────────────────────────────────────────────────

describe('resizeRows', () => {
  const stacked: PanelLayout = {
    columns: [{ panels: ['free', 'timeline'], size: 100, rowSizes: [50, 50] }],
    hidden: ['personal'],
  };

  it('rowSizes の合計100を維持して上下高さを付け替える', () => {
    const result = resizeRows(stacked, 0, 10);
    expect(result.columns[0].rowSizes![0]).toBeCloseTo(60, 9);
    expect(result.columns[0].rowSizes![1]).toBeCloseTo(40, 9);
    expect(result.columns[0].rowSizes![0] + result.columns[0].rowSizes![1]).toBeCloseTo(100, 9);
  });

  it('過大な delta は MIN_PANE_PERCENT で clamp される', () => {
    const result = resizeRows(stacked, 0, 1000);
    expect(result.columns[0].rowSizes![0]).toBeCloseTo(100 - MIN_PANE_PERCENT, 9);
    expect(result.columns[0].rowSizes![1]).toBeCloseTo(MIN_PANE_PERCENT, 9);
  });

  it('rowSizes を持たないカラムを指すと無変更のクローン', () => {
    const layout: PanelLayout = {
      columns: [
        { panels: ['free'], size: 50 },
        { panels: ['timeline'], size: 50 },
      ],
      hidden: ['personal'],
    };
    const result = resizeRows(layout, 0, 10); // 0番カラムは1段
    expect(layoutsEqual(result, layout)).toBe(true);
    expect(result).not.toBe(layout);
  });

  it('範囲外の columnIndex は無変更のクローン', () => {
    const result = resizeRows(stacked, 5, 10);
    expect(layoutsEqual(result, stacked)).toBe(true);
  });
});

// ─── layoutsEqual ─────────────────────────────────────────────────────────────

describe('layoutsEqual', () => {
  const base: PanelLayout = {
    columns: [
      { panels: ['free', 'timeline'], size: 60, rowSizes: [40, 60] },
      { panels: ['personal'], size: 40 },
    ],
    hidden: [],
  };

  it('完全同値は true', () => {
    expect(layoutsEqual(base, JSON.parse(JSON.stringify(base)))).toBe(true);
  });

  it('サイズの微差（0.001）は許容して true', () => {
    const near: PanelLayout = {
      columns: [
        { panels: ['free', 'timeline'], size: 60.001, rowSizes: [40.001, 59.999] },
        { panels: ['personal'], size: 39.999 },
      ],
      hidden: [],
    };
    expect(layoutsEqual(base, near)).toBe(true);
  });

  it('パネル順が違うと false', () => {
    const swapped: PanelLayout = {
      columns: [
        { panels: ['timeline', 'free'], size: 60, rowSizes: [40, 60] },
        { panels: ['personal'], size: 40 },
      ],
      hidden: [],
    };
    expect(layoutsEqual(base, swapped)).toBe(false);
  });

  it('hidden が違うと false', () => {
    const layoutA: PanelLayout = {
      columns: [{ panels: ['free'], size: 100 }],
      hidden: ['timeline', 'personal'],
    };
    const layoutB: PanelLayout = {
      columns: [{ panels: ['free'], size: 100 }],
      hidden: ['personal', 'timeline'],
    };
    expect(layoutsEqual(layoutA, layoutB)).toBe(false);
  });

  it('サイズの大差は false', () => {
    const far: PanelLayout = {
      columns: [
        { panels: ['free', 'timeline'], size: 70, rowSizes: [40, 60] },
        { panels: ['personal'], size: 30 },
      ],
      hidden: [],
    };
    expect(layoutsEqual(base, far)).toBe(false);
  });

  it('rowSizes の有無が違うと false', () => {
    const noRows: PanelLayout = {
      columns: [
        { panels: ['free', 'timeline'], size: 60 },
        { panels: ['personal'], size: 40 },
      ],
      hidden: [],
    };
    expect(layoutsEqual(base, noRows)).toBe(false);
  });
});

// ─── arrangementEqual ─────────────────────────────────────────────────────────

describe('arrangementEqual（配置の変化検知。順番ヒントの発火判定用）', () => {
  const base: PanelLayout = {
    columns: [
      { panels: ['free', 'timeline'], size: 60, rowSizes: [50, 50] },
      { panels: ['personal'], size: 40 },
    ],
    hidden: [],
  };

  it('サイズ（size / rowSizes）だけの違いは同一配置とみなす', () => {
    const resized: PanelLayout = {
      columns: [
        { panels: ['free', 'timeline'], size: 80, rowSizes: [30, 70] },
        { panels: ['personal'], size: 20 },
      ],
      hidden: [],
    };
    expect(arrangementEqual(base, resized)).toBe(true);
  });

  it('並び順が違えば false', () => {
    const reordered: PanelLayout = {
      columns: [
        { panels: ['timeline', 'free'], size: 60, rowSizes: [50, 50] },
        { panels: ['personal'], size: 40 },
      ],
      hidden: [],
    };
    expect(arrangementEqual(base, reordered)).toBe(false);
  });

  it('構造（カラム形状）が違えば false', () => {
    expect(arrangementEqual(base, applyStructure(base, 'columns'))).toBe(false);
  });

  it('パネルの表示切替（剪定）で false', () => {
    expect(arrangementEqual(base, setPanelHidden(base, 'personal', true))).toBe(false);
  });
});

// ─── DEFAULT_PANEL_LAYOUT の不変性 ────────────────────────────────────────────

describe('DEFAULT_PANEL_LAYOUT', () => {
  it('normalizeLayout を通しても同値（既定値が正規化済みである）', () => {
    expect(layoutsEqual(normalizeLayout(DEFAULT_PANEL_LAYOUT), DEFAULT_PANEL_LAYOUT)).toBe(true);
  });
});
