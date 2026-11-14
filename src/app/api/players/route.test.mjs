import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

function createRoute(activeSessionId, authMode = 'account') {
  const queries = [];
  const sql = async (strings, ...values) => {
    const query = strings.join('?');
    queries.push({ query, values });
    if (query.includes('SELECT authMode')) {
      return { rows: [{ authmode: authMode, creatoruserid: 99 }] };
    }
    if (query.includes('SELECT id FROM players')) return { rows: [] };
    if (query.includes('INSERT INTO players')) {
      return { rows: [{ id: 1, name: values[0], userid: values[2] }] };
    }
    throw new Error(`Unexpected query: ${query}`);
  };
  const modules = {
    '@/lib/db': { sql },
    '@/lib/auth': { getCurrentUser: async () => ({ id: 7, displayName: 'Player' }) },
    '@/lib/sessionHelpers': { getActiveSessionId: async () => activeSessionId },
    'next/server': { NextResponse: { json: (body, options) => Response.json(body, options) } },
  };
  const source = readFileSync(new URL('./route.ts', import.meta.url), 'utf8');
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

function request(body) {
  return new Request('http://localhost/api/players', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

test('rejects a changed active session without creating a membership', async () => {
  const { post, queries } = createRoute(2);
  const response = await post(request({ expectedSessionId: 1 }));
  assert.equal(response.status, 409);
  assert.match((await response.json()).error, /active session changed/i);
  assert.equal(queries.length, 0);
});

test('validates the expected session ID', async () => {
  for (const expectedSessionId of [null, '1', 0, -1, 1.5]) {
    const { post, queries } = createRoute(1);
    const response = await post(request({ expectedSessionId }));
    assert.equal(response.status, 400);
    assert.equal(queries.length, 0);
  }
});

test('joins the intended account session and preserves open-session requests', async () => {
  const account = createRoute(1);
  assert.equal((await account.post(request({ expectedSessionId: 1 }))).status, 201);
  assert.equal(account.queries.at(-1).values[1], 1);

  const open = createRoute(2, 'open');
  assert.equal((await open.post(request({ name: 'Guest' }))).status, 201);
  assert.equal(open.queries.at(-1).values[1], 2);
});
