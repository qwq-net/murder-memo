import { useRef, useState } from 'react';

import { EntryInputView } from '@/components/entries/entryInputView';
import { GroupSelectorView } from '@/components/entries/groupSelectorView';
import { GUIDE_SAMPLE_MEMO_GROUPS } from '@/components/guide/previews/sampleData';

const GROUPS = GUIDE_SAMPLE_MEMO_GROUPS.filter((g) => g.panel === 'free').map((g) => ({
  id: g.id,
  label: g.label,
}));

/**
 * フリーメモパネルの入力欄プレビュー。
 *
 * 本物の `EntryInputView` + `GroupSelectorView` をそのまま使い、グループセレクタ・本文 textarea
 * ・画像追加ボタンの組合せをアプリ本体と同じレイアウトで表示する。
 *
 * 局所 state で本文と選択グループを保持するため、入力できるが送信はされない（プレビュー専用）。
 */
export function EntryInputPreview() {
  const [value, setValue] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  return (
    <EntryInputView
      isTimeline={false}
      isTop={false}
      groupSelector={
        <GroupSelectorView
          isTimeline={false}
          groups={GROUPS}
          selectedGroupId={selectedGroupId}
          onGroupIdChange={setSelectedGroupId}
        />
      }
      value={value}
      onValueChange={setValue}
      placeholder="メモを入力… (Shift+Enter で改行)"
      textareaRef={textareaRef}
      onImagePickerOpen={() => undefined}
    />
  );
}
