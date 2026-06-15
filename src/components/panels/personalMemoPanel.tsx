import { MemoPanel } from '@/components/panels/memoPanel';
import { useT } from '@/i18n';

export function PersonalMemoPanel() {
  const t = useT();
  return (
    <MemoPanel
      panel="personal"
      accentColor="var(--panel-personal-accent)"
      emptyMessage={t('panels.emptyPersonal')}
    />
  );
}
