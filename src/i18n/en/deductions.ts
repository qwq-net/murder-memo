import type { Messages } from '@/lib/i18n';

export const deductions: Messages['deductions'] = {
  /** Modal aria-label */
  ariaLabel: 'Character Deductions',
  /** Modal header title */
  title: 'Deductions',
  /** Empty state when no characters are set up */
  noCharacters: 'No characters have been added yet',
  /** Heading for the Player Characters section */
  sectionPlayer: 'Players',
  /** Suspicion star rating */
  star: {
    /** Title when clicking the same star to clear the rating */
    clear: 'Clear',
    /** Title when setting suspicion level ({level} = 1–3) */
    set: 'Suspicion {level}',
  },
};
