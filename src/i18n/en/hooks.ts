import type { Messages } from '@/lib/i18n';

export const hooks: Messages['hooks'] = {
  undo: {
    done: 'Undone: {desc}',
    redone: 'Redone: {desc}',
    syncFailed:
      'Failed to save changes. Consider exporting a backup of your important data.',
  },
  change: {
    entryAdded: { one: '1 memo added', other: '{n} memos added' },
    entryRemoved: { one: '1 memo removed', other: '{n} memos removed' },
    entryEdited: 'Memo edited',
    charAdded: { one: '1 character added', other: '{n} characters added' },
    charRemoved: { one: '1 character removed', other: '{n} characters removed' },
    charChanged: 'Characters changed',
    timelineGroups: 'Timeline groups changed',
    memoGroups: 'Memo groups changed',
    deductions: 'Deductions changed',
    relations: 'Relationship chart changed',
    generic: 'Changed',
    separator: ', ',
  },
  image: {
    needGroupFirst: 'Please add a memo group first',
    loadFailed: 'Failed to load image',
    saveFailed: 'Failed to save image',
    added: { one: 'Image added', other: '{n} images added' },
  },
  session: {
    renamed: 'Session renamed',
    renameFailed: 'Failed to rename session',
  },
};
