import type { Character, MemoEntry, MemoGroup, PanelId, TimelineGroup } from '@/types/memo';

const PANEL_LABELS: Record<PanelId, string> = {
  free: 'フリーメモ',
  timeline: 'タイムライン',
  personal: '自分用メモ',
};

/** キャラクター ID → 名前のマップを構築 */
function buildCharMap(characters: Character[]): Map<string, string> {
  return new Map(characters.map((c) => [c.id, c.name]));
}

/** エントリ1件をテキスト行に変換 */
function formatEntry(entry: MemoEntry, charMap: Map<string, string>): string {
  const parts: string[] = [];

  // タイムラインの時刻
  if (entry.panel === 'timeline') {
    parts.push(entry.eventTime ?? '??:??');
  }

  // 本文（画像エントリはキャプションのみ）
  if (entry.type === 'image') {
    const caption = entry.content?.trim();
    parts.push(caption ? `[画像] ${caption}` : '[画像]');
  } else {
    const content = entry.content?.trim();
    // 改行は " / " に置換（Markdown リストアイテム内で崩れないように）
    parts.push(content ? content.replace(/\n+/g, ' / ') : '（空）');
  }

  const text = parts.join(' ');

  // キャラクタータグ
  const tags = entry.characterTags
    .map((id) => charMap.get(id))
    .filter(Boolean);

  if (tags.length > 0) {
    return `- ${text} [${tags.join(', ')}]`;
  }
  return `- ${text}`;
}

/** 指定パネルのエントリをテキストに変換 */
function formatPanel(
  panel: PanelId,
  entries: MemoEntry[],
  characters: Character[],
  timelineGroups: TimelineGroup[],
  memoGroups: MemoGroup[],
): string {
  const charMap = buildCharMap(characters);
  const panelEntries = entries
    .filter((e) => e.panel === panel)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  if (panelEntries.length === 0) return '';

  const lines: string[] = [`## ${PANEL_LABELS[panel]}`];

  if (panel === 'timeline') {
    // タイムライングループ順
    const sorted = [...timelineGroups].sort((a, b) => a.sortOrder - b.sortOrder);
    for (const group of sorted) {
      const groupEntries = panelEntries.filter((e) => e.timelineGroupId === group.id);
      if (groupEntries.length === 0) continue;
      lines.push(`### ${group.label}`);
      // 時刻順ソート
      const timeSorted = [...groupEntries].sort(
        (a, b) => (a.eventTimeSortKey ?? Infinity) - (b.eventTimeSortKey ?? Infinity),
      );
      for (const entry of timeSorted) {
        lines.push(formatEntry(entry, charMap));
      }
    }
  } else {
    // メモグループ順
    const panelGroups = memoGroups
      .filter((g) => g.panel === panel)
      .sort((a, b) => a.sortOrder - b.sortOrder);

    // グループありエントリ
    for (const group of panelGroups) {
      const groupEntries = panelEntries.filter((e) => e.groupId === group.id);
      if (groupEntries.length === 0) continue;
      lines.push(`### ${group.label}`);
      for (const entry of groupEntries) {
        lines.push(formatEntry(entry, charMap));
      }
    }

    // 未分類エントリ
    const ungrouped = panelEntries.filter((e) => !e.groupId);
    if (ungrouped.length > 0) {
      if (panelGroups.length > 0) lines.push('### 未分類');
      for (const entry of ungrouped) {
        lines.push(formatEntry(entry, charMap));
      }
    }
  }

  return lines.join('\n');
}

/** セッション全体をテキストに変換 */
export function formatSessionAsText(
  sessionName: string,
  entries: MemoEntry[],
  characters: Character[],
  timelineGroups: TimelineGroup[],
  memoGroups: MemoGroup[],
  panelOrder: PanelId[],
  panelFilter?: PanelId,
): string {
  const panels = panelFilter ? [panelFilter] : panelOrder;

  const sections = panels
    .map((p) => formatPanel(p, entries, characters, timelineGroups, memoGroups))
    .filter(Boolean);

  if (sections.length === 0) return '';

  const header = panelFilter
    ? `# ${sessionName} — ${PANEL_LABELS[panelFilter]}`
    : `# ${sessionName}`;

  return [header, '', ...sections].join('\n');
}

/** クリップボードにコピー */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // フォールバック
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  }
}
