import { sql } from './src/lib/db';
import * as fs from 'fs';
import * as path from 'path';

// Load .env.local file manually
try {
  const envPath = path.join(__dirname, '.env.local');
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach((line) => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const equalIndex = trimmedLine.indexOf('=');
      if (equalIndex > 0) {
        const key = trimmedLine.substring(0, equalIndex);
        let value = trimmedLine.substring(equalIndex + 1);
        // Remove quotes if present
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }
        process.env[key] = value;
      }
    }
  });
} catch (error) {
  console.log(
    'Could not load .env.local, proceeding with existing environment variables',
  );
}

async function changeTotalPushupsToDecimal() {
  try {
    console.log('Changing totalPushups column to support decimal values...');

    // Change the column type to DECIMAL/NUMERIC to support decimal values
    // NUMERIC(10, 2) allows up to 10 digits total with 2 decimal places
    await sql`
      ALTER TABLE players 
      ALTER COLUMN totalPushups TYPE NUMERIC(10, 2)
    `;
    console.log('✓ Changed totalPushups column to NUMERIC(10, 2)');

    // Also update pushupHistory table amount column
    await sql`
      ALTER TABLE pushupHistory 
      ALTER COLUMN amount TYPE NUMERIC(10, 2)
    `;
    console.log('✓ Changed pushupHistory amount column to NUMERIC(10, 2)');

    // Also update dailyGoalHistory table amount column
    await sql`
      ALTER TABLE dailyGoalHistory 
      ALTER COLUMN amount TYPE NUMERIC(10, 2)
    `;
    console.log('✓ Changed dailyGoalHistory amount column to NUMERIC(10, 2)');

    console.log('\n✅ Successfully changed columns to support decimal values!');
  } catch (error) {
    console.error('Error changing column types:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

changeTotalPushupsToDecimal();
