import { NextResponse } from 'next/server';
import { clearAuthCookie } from '@/lib/auth';
import { syncPushSession } from '@/lib/pushDevice';

export async function POST() {
  try {
    await syncPushSession(null, null);
    await clearAuthCookie();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to pause reminders during logout:', error);
    return NextResponse.json({ error: 'Failed to log out' }, { status: 500 });
  }
}
