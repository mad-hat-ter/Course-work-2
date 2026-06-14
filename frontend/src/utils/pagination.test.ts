import { describe, expect, it } from 'vitest';

import { getPaginationItems } from './pagination';

describe('getPaginationItems', () => {
  it('возвращает пустой список для одной страницы', () => {
    expect(getPaginationItems(1, 1)).toEqual([]);
  });

  it('возвращает все страницы, если их не больше семи', () => {
    expect(getPaginationItems(2, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it('добавляет многоточия для длинной пагинации', () => {
    expect(getPaginationItems(5, 10)).toEqual([
      1,
      'ellipsis',
      4,
      5,
      6,
      'ellipsis',
      10,
    ]);
  });

  it('не добавляет левое многоточие рядом с началом', () => {
    expect(getPaginationItems(2, 10)).toEqual([1, 2, 3, 'ellipsis', 10]);
  });
});
