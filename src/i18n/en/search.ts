import type { Messages } from '@/lib/i18n';

/** search namespace: strings for the search overlay */
export const search: Messages['search'] = {
  /** placeholder for the search input */
  placeholder: 'Search entries…',
  /** aria-label for the clear button */
  clearLabel: 'Clear',
  /** shown when the query returns no results */
  noResults: 'No entries found',
  /** per-panel result count (N items) */
  groupCount: '{n}',
  /** footer result count */
  resultCount: { one: '{n} result', other: '{n} results' },
  /** suffix appended when the result cap is reached */
  maxReachedSuffix: ' (limit reached)',
  /** error toast when an entry cannot be revealed */
  errorReveal: 'Couldn\'t open that memo',
};
