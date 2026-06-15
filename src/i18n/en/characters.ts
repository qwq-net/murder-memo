import type { Messages } from '@/lib/i18n';

/** characters namespace: character setup panel and character badge labels */
export const characters: Messages['characters'] = {
  /** Modal title */
  heading: 'Characters',
  /** Header subtext */
  reorderHint: 'Drag to change action order',
  /** Tab labels */
  tabs: {
    pl: 'Players ({n})',
    npc: 'NPCs ({n})',
    typeList: 'Character type',
  },
  /** Empty state messages */
  empty: {
    pl: 'Add a player',
    npc: 'Add an NPC',
  },
  /** Add form */
  add: {
    placeholderPl: 'Enter player name',
    placeholderNpc: 'Enter NPC name',
    nameLabel: 'Character name',
  },
  /** Toasts */
  toasts: {
    added: 'Character added',
    removed: 'Character removed',
  },
  /** Row actions */
  row: {
    dragHandle: 'Drag to reorder',
    changeColor: 'Change theme color',
    nameLabel: 'Character name',
    showLabel: 'Show',
    hideLabel: 'Hide',
    removeLabel: 'Remove {name}',
  },
  /** Color palette */
  palette: {
    custom: 'Custom color',
  },
  /** Badge aria-labels */
  badge: {
    tag: 'Tag {name}',
    untag: 'Untag {name}',
    filterOn: 'Filter by {name}',
    filterOff: 'Remove filter for {name}',
  },
  /** Filter bar */
  filter: {
    clearLabel: 'Clear character filter',
    clearTitle: 'Clear filter',
  },
} as const;
