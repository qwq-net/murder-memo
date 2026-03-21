import { MemoPanel } from './MemoPanel';

export function PersonalMemoPanel() {
  return (
    <MemoPanel
      panel="personal"
      accentColor="var(--panel-personal-accent)"
      emptyMessage="ハンドアウトや個人情報をメモ"
    />
  );
}
