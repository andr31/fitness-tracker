export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.rep-rally.com'
).replace(/\/$/, '');

export const SITE_NAME = 'Rep Rally';

export const SITE_TITLE = 'Rep Rally – Fitness Challenge Tracker for Friends';

export const SITE_DESCRIPTION =
  'Start a fitness challenge with friends. Track pushups, planks, or a custom exercise with a leaderboard, milestones, daily goals, and progress history.';

export const SITE_FEATURES = [
  'Leaderboard with milestone progress',
  'Pushup, plank, and custom exercise challenges',
  'Daily goals and day-by-day history',
  'Password-protected sessions with shareable invite links',
  'Optional player accounts',
];
