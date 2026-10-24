import { sql } from './src/lib/db';
import * as fs from 'fs';
import * as path from 'path';

try {
  const envContent = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf-8');
  envContent.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const eq = trimmed.indexOf('=');
      if (eq > 0) {
        let value = trimmed.substring(eq + 1);
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }
        process.env[trimmed.substring(0, eq)] = value;
      }
    }
  });
} catch {
  console.log('Could not load .env.local, using existing environment');
}

async function addArchivedAtColumn() {
  try {
    await sql`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS archivedAt TIMESTAMP`;
    console.log('✅ Added archivedAt column to sessions');
  } finally {
    await sql.end();
  }
}

addArchivedAtColumn();
