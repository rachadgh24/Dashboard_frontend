import { filterByQuery } from '@/lib/searchUtils';

describe('filterByQuery', () => {
  const data = ['Apple', 'Banana', 'Apricot', 'Mango', 'Pineapple'];

  it('returns all items when query is empty', () => {
    expect(filterByQuery(data, '')).toEqual(data);
  });

  it('returns all items when query is only whitespace', () => {
    expect(filterByQuery(data, '   ')).toEqual(data);
  });

  it('filters case-insensitively', () => {
    expect(filterByQuery(data, 'apple')).toEqual(['Apple', 'Pineapple']);
    expect(filterByQuery(data, 'APPLE')).toEqual(['Apple', 'Pineapple']);
    expect(filterByQuery(data, 'banana')).toEqual(['Banana']);
  });

  it('matches substring anywhere in item', () => {
    expect(filterByQuery(data, 'pine')).toEqual(['Pineapple']);
    expect(filterByQuery(data, 'an')).toEqual(['Banana', 'Mango']);
  });

  it('trims query before filtering', () => {
    expect(filterByQuery(data, '  apple  ')).toEqual(['Apple', 'Pineapple']);
  });

  it('returns empty array when no matches', () => {
    expect(filterByQuery(data, 'xyz')).toEqual([]);
  });

  it('handles empty data', () => {
    expect(filterByQuery([], 'apple')).toEqual([]);
  });

  it('handles single-item data', () => {
    expect(filterByQuery(['Apple'], 'apple')).toEqual(['Apple']);
    expect(filterByQuery(['Apple'], 'banana')).toEqual([]);
  });
});
