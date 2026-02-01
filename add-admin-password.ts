import { sql } from '@vercel/postgres';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function addAdminPassword() {
  try {
    // Hash the admin password
    const adminPassword = 'adm2026'; // Default admin password
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // Check if admin password already exists
    const existing = await sql`
      SELECT id FROM settings WHERE key = 'adminPassword'
    `;

    if (existing.rows.length > 0) {
      // Update existing admin password
      await sql`
        UPDATE settings 
        SET value = ${hashedPassword}, updatedAt = CURRENT_TIMESTAMP
        WHERE key = 'adminPassword'
      `;
      console.log('✓ Admin password updated in settings table');
    } else {
      // Insert new admin password with NULL sessionId (global setting)
      await sql`
        INSERT INTO settings (key, value, sessionId)
        VALUES ('adminPassword', ${hashedPassword}, NULL)
      `;
      console.log('✓ Admin password added to settings table');
    }

    console.log('  Default password: adm2026');
    console.log('  Note: Admin password is global (sessionId = NULL)');
  } catch (error) {
    console.error('Error adding admin password:', error);
    throw error;
  } finally {
    process.exit(0);
  }
}

addAdminPassword();
