export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.rep-rally.com'
).replace(/\/$/, '');

export const SITE_NAME = 'RepRally';

export const SITE_TITLE = 'RepRally – Fitness Challenge Tracker for Friends';

export const SITE_DESCRIPTION =
  'Start a private fitness challenge with friends. Track pushups, planks, or any custom exercise with a live leaderboard, milestones, daily goals, and progress history.';

export const SITE_KEYWORDS = [
  'fitness challenge tracker',
  'pushup challenge',
  'plank challenge',
  'workout challenge with friends',
  'fitness leaderboard',
  'exercise tracker',
  'group fitness challenge',
  'pushup counter',
  'daily fitness goals',
];

export const SITE_FEATURES = [
  'Live leaderboard with milestone progress',
  'Pushup, plank, and custom exercise challenges',
  'Daily goals and day-by-day history',
  'Private sessions with shareable invite links',
  'Optional player accounts',
];
