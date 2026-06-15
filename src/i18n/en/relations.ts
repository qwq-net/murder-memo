import type { Messages } from '@/lib/i18n';

export const relations: Messages['relations'] = {
  title: 'Relationship Chart',
  tabList: 'List',
  tabDiagram: 'Diagram',
  needMoreChars: 'Add at least 2 characters to get started',
  addHeading: 'Add relationship',
  person1Placeholder: 'Person 1',
  person2Placeholder: 'Person 2',
  labelPlaceholder: 'Relationship (e.g. Friend)',
  colorPickerTitle: 'Pick line color',
  removeRelationTitle: 'Remove relationship',
  toastAdded: 'Relationship added',
  toastRemoved: 'Relationship removed',
  resetZoom: 'Reset',
  presets: {
    friend: 'Friend',
    lover: 'Lover',
    family: 'Family',
    boss: 'Boss/Subordinate',
    enemy: 'Enemy',
    ally: 'Ally',
    acquaintance: 'Acquaintance',
    unknown: 'Unknown',
  },
};
