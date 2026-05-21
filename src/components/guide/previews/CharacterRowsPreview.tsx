import { CharacterRowView } from '@/components/characters/characterRowView';
import { GUIDE_SAMPLE_CHARACTERS } from '@/components/guide/previews/sampleData';

const PL = GUIDE_SAMPLE_CHARACTERS.filter((c) => c.role === 'pl');
const NPC = GUIDE_SAMPLE_CHARACTERS.filter((c) => c.role === 'npc');

/**
 * 登場人物管理画面の PL / NPC リストを本物の `CharacterRowView` で見せるプレビュー。
 *
 * - 色丸をクリックすると色パレットが開く（本体と同じ挙動、内部 state で動作）
 * - 名前 input は表示のみ（onUpdate に noop を渡しているので確定しても保存はされない）
 * - 表示/非表示トグル・削除も同様に noop
 * - ドラッグハンドル（⠿）は見た目だけ。実際の並び替えは `/app` 側でのみ機能
 */
export function CharacterRowsPreview() {
  return (
    <div
      style={{
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        background: 'var(--bg-base)',
      }}
    >
      {/* タブ風の見出し（PL/NPC） */}
      <div
        style={{
          display: 'flex',
          padding: '0',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <span
          style={{
            flex: 1,
            padding: '8px 12px',
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--text-primary)',
            borderBottom: '2px solid var(--color-settings-accent)',
            letterSpacing: '0.06em',
          }}
        >
          プレイヤー（{PL.length}）
        </span>
        <span
          style={{
            flex: 1,
            padding: '8px 12px',
            fontSize: 13,
            color: 'var(--text-muted)',
            letterSpacing: '0.06em',
          }}
        >
          NPC（{NPC.length}）
        </span>
      </div>

      {/* PL リスト（実際にプレビューする） */}
      {PL.map((char, i) => (
        <CharacterRowView key={char.id} char={char} isLast={i === PL.length - 1} />
      ))}
    </div>
  );
}
