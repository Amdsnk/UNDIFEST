import { db, pool } from './db';
import { sql } from 'drizzle-orm';
import {
  adminUsers,
  users,
  events,
  banners,
  transactions,
  winners,
  videos,
} from "@shared/schema";

/**
 * Create database tables if they don't exist
 * This is a simple schema sync for production deployment
 */
export async function runMigrations() {
  try {
    console.log('🔄 Checking database schema...');

    // Check if admin_users table exists
    const tableCheck = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'admin_users'
      );
    `);

    const tablesExist = tableCheck.rows[0]?.exists;

    if (!tablesExist) {
      console.log('📋 Tables not found, creating schema...');

      // Create tables using raw SQL based on schema
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS admin_users (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
          username TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS events (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL,
          image_url TEXT NOT NULL,
          description TEXT NOT NULL,
          price INTEGER NOT NULL,
          ticket_count INTEGER NOT NULL,
          tickets_received INTEGER NOT NULL DEFAULT 0,
          prize TEXT NOT NULL,
          hadiah INTEGER NOT NULL,
          start_date TIMESTAMP NOT NULL,
          end_date TIMESTAMP NOT NULL,
          announcement_date TIMESTAMP NOT NULL,
          status VARCHAR(20) NOT NULL DEFAULT 'aktif',
          category VARCHAR(50) DEFAULT 'other',
          card_template VARCHAR(20),
          banner_homepage TEXT,
          banner_undian TEXT,
          is_refundable BOOLEAN NOT NULL DEFAULT false,
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS banners (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
          image_url TEXT NOT NULL,
          "order" INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT,
          phone_number VARCHAR(20) NOT NULL UNIQUE,
          city TEXT,
          email TEXT,
          bank_name TEXT,
          account_number TEXT,
          ip VARCHAR(45),
          is_active BOOLEAN NOT NULL DEFAULT true,
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS transactions (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id VARCHAR NOT NULL REFERENCES users(id),
          event_id VARCHAR NOT NULL REFERENCES events(id),
          amount INTEGER NOT NULL,
          ticket_count INTEGER NOT NULL DEFAULT 1,
          phone_number VARCHAR(20) NOT NULL,
          event_name TEXT NOT NULL,
          payment_status VARCHAR(20) NOT NULL DEFAULT 'pending',
          payment_id VARCHAR(100),
          payment_method VARCHAR(50),
          payment_url TEXT,
          paid_at TIMESTAMP,
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS winners (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
          transaction_id VARCHAR NOT NULL REFERENCES transactions(id),
          event_id VARCHAR NOT NULL REFERENCES events(id),
          user_id VARCHAR NOT NULL REFERENCES users(id),
          announced_at TIMESTAMP NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS videos (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
          title TEXT NOT NULL,
          thumbnail_url TEXT NOT NULL,
          video_url TEXT,
          type VARCHAR(20) NOT NULL DEFAULT 'video',
          is_live BOOLEAN NOT NULL DEFAULT false,
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
      `);

      console.log('✅ Database schema created successfully');
    } else {
      console.log('✅ Database schema already exists');

      // Add missing columns to users table if they don't exist
      console.log('🔄 Checking for missing columns...');

      try {
        await db.execute(sql`
          ALTER TABLE users ADD COLUMN IF NOT EXISTS bank_name TEXT;
        `);
        await db.execute(sql`
          ALTER TABLE users ADD COLUMN IF NOT EXISTS account_number TEXT;
        `);

        // Add payment columns to transactions table
        await db.execute(sql`
          ALTER TABLE transactions ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) NOT NULL DEFAULT 'pending';
        `);
        await db.execute(sql`
          ALTER TABLE transactions ADD COLUMN IF NOT EXISTS payment_id VARCHAR(100);
        `);
        await db.execute(sql`
          ALTER TABLE transactions ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);
        `);
        await db.execute(sql`
          ALTER TABLE transactions ADD COLUMN IF NOT EXISTS payment_url TEXT;
        `);
        await db.execute(sql`
          ALTER TABLE transactions ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP;
        `);

        console.log('✅ Missing columns added successfully');
      } catch (alterError) {
        console.log('ℹ️ Columns may already exist or error:', alterError);
      }
    }
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

