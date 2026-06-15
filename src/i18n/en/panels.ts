import type { Messages } from '@/lib/i18n';

export const panels: Messages['panels'] = {
  free: 'Free Memo',
  personal: 'Personal Memo',
  timeline: 'Timeline',
  hiddenSuffix: ' (hidden)',
  unknownTime: 'Unknown',
  groupRenamed: 'Group renamed',
  groupDeleted: 'Group deleted',
  groupAdded: 'Group added',
  imageAdded: 'Image added',
  deleteGroupTitle: 'Delete {label}',
  deleteGroupConfirmTimeline: {
    one: 'I understand that {n} memo will be deleted with this group',
    other: 'I understand that {n} memos will be deleted with this group',
  },
  deleteGroupConfirmMemo: {
    one: 'I understand that {n} memo will be moved to Uncategorized',
    other: 'I understand that {n} memos will be moved to Uncategorized',
  },
  emptyFree: 'Jot down whatever comes to mind',
  emptyPersonal: 'Notes for handouts and private info',
  emptyTimelineAddGroup: 'Add a memo group to organize your timeline',
  dropToClearTime: 'Drop here for no time',
  addMemoPrompt: 'Add a memo',
  noFilterMatch: 'No memos match the filter',
  unassignedTimelineHint:
    'These memos do not belong to any group. Drag or right-click to move them into a group.',
};
