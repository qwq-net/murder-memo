import { describe, expect, it } from 'vitest';

import { en } from '@/i18n/en';
import { ja } from '@/i18n/ja';

type Shape = 'string' | 'plural';

/** カタログをドットキー → 葉の種類（string / plural）に平坦化する。 */
function flatten(obj: unknown, prefix = '', out: Record<string, Shape> = {}): Record<string, Shape> {
  if (obj == null || typeof obj !== 'object') return out;
  const rec = obj as Record<string, unknown>;
  // 複数形ノードは葉として扱う
  if (typeof rec.one === 'string' && typeof rec.other === 'string') {
    out[prefix] = 'plural';
    return out;
  }
  for (const [key, value] of Object.entries(rec)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') {
      out[path] = 'string';
    } else {
      flatten(value, path, out);
    }
  }
  return out;
}

describe('i18n catalog parity', () => {
  const jaFlat = flatten(ja);
  const enFlat = flatten(en);

  it('ja と en のキー集合が一致する', () => {
    expect(Object.keys(enFlat).sort()).toEqual(Object.keys(jaFlat).sort());
  });

  it('各キーの形（string / plural）が ja と en で一致する', () => {
    for (const [key, shape] of Object.entries(jaFlat)) {
      expect(enFlat[key], `key: ${key}`).toBe(shape);
    }
  });
});
