# Multi-Session Feature - Deployment Guide

## Overview
This fitness tracker app now supports multiple sessions with password protection and historical data backup. Each session maintains its own isolated set of players, pushup history, daily goals, and settings.

## Database Migration Steps

### 1. Install Dependencies
```bash
npm install bcryptjs @types/bcryptjs
```

### 2. Run Migrations in Order

**IMPORTANT:** Run these scripts in the exact order below:

```bash
# Step 1: Create sessions tables
npx tsx create-sessions-tables.ts

# Step 2: Add sessionId columns to existing tables
npx tsx add-sessionid-to-tables.ts

# Step 3: Migrate existing data to a default session
npx tsx migrate-to-sessions.ts
```

### 3. Default Session
The migration creates a default session:
- **Name:** "Default Session"
- **Password:** `fitness2026` (⚠️ **IMPORTANT:** Change this immediately after migration!)
- All existing data will be associated with this session

## Features

### Session Management
- ✅ **Password Protection:** Each session requires a password to access
- ✅ **Session Isolation:** Complete data separation between sessions
- ✅ **Cookie-Based Auth:** Stay logged into a session automatically
- ✅ **Historical Backups:** Archive session data before switching
- ✅ **Session History:** View archived snapshots of past sessions

### Data Stored Per Session
- Players and their pushup counts
- Pushup history (with dates)
- Daily goal settings
- Daily goal history
- Competition settings (end date)
- General settings (milestone, etc.)

## Using Sessions

### Creating a New Session
1. Click the "Sessions" button in the header
2. Click "Create New Session"
3. Enter a session name and password (min. 4 characters)
4. Click "Create Session"

### Switching Sessions
1. Click the "Sessions" button
2. Select a session from the list
3. Enter the session password
4. Click "Activate Session"
5. All your data will reload for the new session

### Archiving Session Data
1. Open the Session Manager
2. For the active session, click "Archive"
3. This creates a backup snapshot in the session_history table
4. You can view archived data via the API: `/api/sessions/[id]/history`

## API Endpoints

### Session Management
- `GET /api/sessions` - List all sessions
- `POST /api/sessions` - Create new session
  ```json
  { "name": "Summer 2026", "password": "mypass123" }
  ```
- `POST /api/sessions/[id]/activate` - Activate a session
  ```json
  { "password": "mypass123" }
  ```
- `POST /api/sessions/[id]/archive` - Archive current session data
- `GET /api/sessions/[id]/history` - View archived snapshots

### Session Behavior
All existing API routes now:
- Check for an active session via cookie
- Return 401 if no session is active
- Filter all data by the active sessionId
- Maintain complete isolation between sessions

## Security Considerations

1. **Change Default Password:** After migration, immediately change the default session password
2. **Password Storage:** Passwords are hashed using bcryptjs (10 rounds)
3. **Cookie Security:** Session cookies are:
   - HttpOnly (prevents XSS)
   - Secure in production (HTTPS only)
   - SameSite: strict
   - 30-day expiration

## Database Schema Changes

### New Tables
- `sessions` - Stores session metadata and hashed passwords
- `session_history` - Stores JSONB snapshots of archived data

### Modified Tables
All tables now have a `sessionId` column:
- `players` - Unique constraint: (name, sessionId)
- `pushupHistory` - Filtered by sessionId
- `dailyGoalSettings` - Primary key: (playerId, sessionId)
- `dailyGoalHistory` - Filtered by sessionId
- `competition_settings` - Filtered by sessionId
- `settings` - Unique constraint: (key, sessionId)

## Rollback Plan (If Needed)

If you need to rollback:
1. Backup your database first!
2. Remove the sessionId constraint from tables:
```sql
ALTER TABLE players ALTER COLUMN sessionId DROP NOT NULL;
ALTER TABLE pushupHistory ALTER COLUMN sessionId DROP NOT NULL;
-- etc. for all tables
```
3. Optionally drop session tables:
```sql
DROP TABLE session_history;
DROP TABLE sessions;
```

## Testing

Before deploying to production:
1. Create a test session
2. Add test players to both sessions
3. Verify data isolation by switching sessions
4. Test password protection
5. Test archiving functionality
6. Verify cookie persistence

## Troubleshooting

### "No active session" error
- Click the "Sessions" button and select/create a session

### Can't access existing data
- Make sure you've activated the "Default Session"
- Default password is `fitness2026`

### Password incorrect
- Passwords are case-sensitive
- If you forget a password, you'll need to reset it via database access

## Support

For issues or questions, check:
- Migration script output for errors
- Browser console for client-side errors
- Server logs for API errors
- Database logs for query errors
