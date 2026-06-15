import type { Messages } from '@/lib/i18n';

/** links namespace: Link Keyword dictionary list modal strings */
export const links: Messages['links'] = {
  /** Modal title */
  heading: 'Link Keywords',
  /** Empty state message */
  empty: 'No link keywords registered',
  /** Empty state sub-text before <code> */
  emptyHintPre: 'Write ',
  /** Text inside <code> in the empty state hint (format example) */
  emptyHintCode: '[text]',
  /** Empty state sub-text after <code> */
  emptyHintPost: ' in a memo to automatically add it as a link keyword',
  /** Delete confirmation dialog title ({name} = quoted keyword) */
  confirmDeleteTitle: 'Remove {name} from the dictionary?',
  /** Row delete button aria-label ({name} = quoted keyword) */
  removeAriaLabel: 'Remove {name}',
};
