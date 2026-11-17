import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

function createRoute(path, { ended = false, playerExists = true } = {}) {
  const queries = [];
  const sql = async (strings, ...values) => {
    const query = strings.join('?');
    queries.push({ query, values });
    if (query.includes('SELECT sessionType')) return { rows: [{ sessiontype: 'pushups' }] };
    if (query.includes('SELECT id FROM players')) return { rows: playerExists ? [{ id: 1 }] : [] };
    if (query.includes('INSERT INTO dailyGoalHistory') || query.includes('WITH deadline')) {
      return { rows: ended || !playerExists ? [] : [{ id: 1, name: 'Player', totalpushups: '10' }] };
    }
    throw new Error(`Unexpected query: ${query}`);
  };
  const modules = {
    '@/lib/db': { sql },
    '@/lib/sessionHelpers': { getActiveSessionId: async () => 3 },
    '@/lib/authz': { requireOwnPlayer: async () => ({ ok: true }) },
    'next/server': { NextResponse: { json: (body, options) => Response.json(body, options) } },
  };
  const source = readFileSync(new URL(path, import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  const exports = {};
  runInNewContext(compiled, {
    exports,
    require: (name) => {
      if (!(name in modules)) throw new Error(`Unexpected import: ${name}`);
      return modules[name];
    },
    console,
  });
  return { post: exports.POST, queries };
}

function request(amount) {
  return new Request('http://localhost/api/players/1/pushups', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount, date: '2026-01-01', dailyGoalTarget: 100 }),
  });
}

for (const path of ['./route.ts', '../daily-goal/route.ts']) {
  test(`${path} rejects additions and removals after the deadline`, async () => {
    for (const amount of [10, -10]) {
      const { post, queries } = createRoute(path, { ended: true });
      const response = await post(request(amount), { params: Promise.resolve({ id: '1' }) });
      assert.equal(response.status, 409);
      assert.match((await response.json()).error, /competition ended/i);
      const mutation = queries.find(({ query }) => query.includes('clock_timestamp()'));
      assert.ok(mutation);
      assert.match(mutation.query, /competition_settings/);
      assert.match(mutation.query, /ORDER BY id DESC LIMIT 1/);
      assert.match(mutation.query, /AT TIME ZONE 'UTC'/);
    }
  });

  test(`${path} accepts entries when the deadline permits them`, async () => {
    const { post } = createRoute(path);
    const response = await post(request(10), { params: Promise.resolve({ id: '1' }) });
    assert.equal(response.status, 200);
  });
}

test('pushup updates keep player totals and history in one guarded statement', async () => {
  const { post, queries } = createRoute('./route.ts');
  await post(request(-10), { params: Promise.resolve({ id: '1' }) });
  const mutation = queries.find(({ query }) => query.includes('WITH deadline')).query;
  assert.match(mutation, /UPDATE players/);
  assert.match(mutation, /INSERT INTO pushupHistory/);
  assert.match(mutation, /INSERT INTO dailyGoalHistory/);
  assert.match(mutation, /FOR UPDATE/);
});

test('a missing player still returns 404', async () => {
  const { post } = createRoute('./route.ts', { playerExists: false });
  const response = await post(request(10), { params: Promise.resolve({ id: '1' }) });
  assert.equal(response.status, 404);
});
