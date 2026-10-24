import { sql } from '@/lib/db';
import * as bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';

// Returns an error response if the admin password is missing/invalid, otherwise null.
export async function checkAdminPassword(
  adminPassword: unknown,
): Promise<NextResponse | null> {
  if (!adminPassword || typeof adminPassword !== 'string') {
    return NextResponse.json(
      { error: 'Admin password required' },
      { status: 401 },
    );
  }

  const result = await sql`
    SELECT value FROM settings WHERE key = 'adminPassword' LIMIT 1
  `;
  if (result.rows.length === 0) {
    return NextResponse.json(
      { error: 'Admin password not configured' },
      { status: 500 },
    );
  }

  const valid = await bcrypt.compare(
    adminPassword,
    result.rows[0].value as string,
  );
  if (!valid) {
    return NextResponse.json(
      { error: 'Invalid admin password' },
      { status: 403 },
    );
  }
  return null;
}
