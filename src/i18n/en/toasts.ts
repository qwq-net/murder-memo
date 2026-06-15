import type { Messages } from '@/lib/i18n';

export const toasts: Messages['toasts'] = {
  movedTo: {
    one: 'Moved to {label}',
    other: 'Moved {n} memos to {label}',
  },
  importanceSet: {
    one: 'Importance set to {label}',
    other: 'Importance of {n} memos set to {label}',
  },
  importanceCleared: {
    one: 'Importance cleared',
    other: 'Importance of {n} memos cleared',
  },
  duplicated: {
    one: 'Memo duplicated',
    other: '{n} memos duplicated',
  },
  deleted: {
    one: 'Memo deleted',
    other: '{n} memos deleted',
  },
};
