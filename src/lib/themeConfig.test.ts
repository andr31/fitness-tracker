import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getSeasonalTheme } from './themeConfig';

describe('getSeasonalTheme', () => {
  it('switches to Halloween on the last day of September and keeps it through October', () => {
    assert.equal(getSeasonalTheme(new Date('2026-09-30T12:00:00Z')), 'halloween');
    assert.equal(getSeasonalTheme(new Date('2026-10-31T12:00:00Z')), 'halloween');
  });

  it('uses Game of Thrones in November until the final day, then switches to Christmas', () => {
    assert.equal(getSeasonalTheme(new Date('2026-11-01T12:00:00Z')), 'gameofthrones');
    assert.equal(getSeasonalTheme(new Date('2026-11-30T12:00:00Z')), 'christmas');
  });

  it('keeps Christmas through December and resets to Game of Thrones on January 1', () => {
    assert.equal(getSeasonalTheme(new Date('2026-12-15T12:00:00Z')), 'christmas');
    assert.equal(getSeasonalTheme(new Date('2027-01-01T12:00:00Z')), 'gameofthrones');
  });
});
