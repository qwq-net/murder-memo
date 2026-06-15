import type { Messages } from '@/lib/i18n';

/** layout/ component labels (AppShell, LayoutPopover, MobileTabNav, etc.). */
export const layout: Messages['layout'] = {
  /** Loading indicator message */
  loading: 'Preparing data…',
  /** Footer copyright text */
  footer: '© 2026 Murder Memo',
  /** Session name auto-generation prefix (concatenated with a date string) */
  sessionNamePrefix: 'Session ',
  /** Session name auto-generation duplicate suffix prefix (used in regex) */
  sessionNameDupPrefix: 'Session ',
  /** Session switcher select aria-label */
  sessionSwitch: 'Switch session',
  /** Rename session button title */
  renameSession: 'Rename session',
  /** New session button title */
  newSession: 'New session',
  /** Demo session banner message */
  demoBanner: 'Create a new session here!',
  /** Header button: guide */
  guide: 'Guide',
  guideTitle: 'Open the guide in a new tab',
  /** Header button: search */
  search: 'Search',
  /** Header button: link list */
  linkList: 'Links',
  /** Header button: deductions */
  deductions: 'Deductions',
  deductionsAria: 'Open Deductions',
  /** Header button: relationship chart */
  relations: 'Relationship Chart',
  relationsAria: 'Open Relationship Chart',
  /** Header button: characters */
  characters: 'Characters',
  charactersAria: 'Open Characters setup',
  /** Header button: layout */
  layoutBtn: 'Layout',
  layoutBtnTitle: 'Edit layout',
  /** Header button: settings (reuses settings.title concept) */
  settingsBtn: 'Settings',
  /** Expand all groups button */
  expandAll: 'Expand all',
  expandAllAria: 'Expand all groups',
  /** Collapse all groups button */
  collapseAll: 'Collapse all',
  collapseAllAria: 'Collapse all groups',
  /** Session creation toasts */
  sessionCreated: 'Session created',
  sessionCreateFailed: 'Failed to create session',
  /** Mobile tab nav aria-label */
  mobileTabNav: 'Switch panel',
  /** Mobile tab short labels */
  tab: {
    free: 'Free',
    personal: 'Personal',
    timeline: 'Timeline',
  },
  /** Layout popover */
  popover: {
    /** Popover dialog aria-label */
    dialogLabel: 'Layout for this session',
    /** Popover heading */
    heading: 'Layout for this session',
    /** Heading sub-note */
    note: 'This setting applies to the current session only',
    /** Reset to global settings button label */
    resetToGlobal: 'Reset to global settings',
  },
} as const;
