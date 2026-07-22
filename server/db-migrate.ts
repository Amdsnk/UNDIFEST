import { db } from './db';
import { sql } from 'drizzle-orm';

/**
 * Idempotent schema migration — safe to run on every startup.
 * Uses CREATE TABLE IF NOT EXISTS and ADD COLUMN IF NOT EXISTS throughout,
 * so it never wipes existing data and always converges to the current schema.
 */
export async function runMigrations() {
  console.log('🔄 Running schema migrations...');

  // ── Core tables ──────────────────────────────────────────────────────────

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS admin_users (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      name TEXT,
      role VARCHAR(50) NOT NULL DEFAULT 'viewer',
      allowed_ips TEXT,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  await db.execute(sql`
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
      ebook_file TEXT,
      ebook_title TEXT,
      has_multiple_undian BOOLEAN NOT NULL DEFAULT false,
      undian_a_label TEXT DEFAULT 'Undian A',
      undian_b_label TEXT DEFAULT 'Undian B',
      undian_a_image TEXT,
      undian_b_image TEXT,
      allow_custom_amount BOOLEAN NOT NULL DEFAULT false,
      schedule_type VARCHAR(20) DEFAULT 'none',
      schedule_time VARCHAR(5),
      schedule_day INTEGER,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS banners (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
      image_url TEXT NOT NULL,
      "order" INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  await db.execute(sql`
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
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS transactions (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id VARCHAR REFERENCES users(id),
      event_id VARCHAR NOT NULL REFERENCES events(id),
      amount INTEGER NOT NULL,
      ticket_count INTEGER NOT NULL DEFAULT 1,
      phone_number VARCHAR(20) NOT NULL,
      event_name TEXT NOT NULL,
      buyer_name VARCHAR(255),
      buyer_email VARCHAR(255),
      buyer_bank_name VARCHAR(100),
      buyer_account_number VARCHAR(50),
      buyer_ip VARCHAR(45),
      payment_status VARCHAR(20) NOT NULL DEFAULT 'pending',
      payment_id VARCHAR(100),
      payment_method VARCHAR(50),
      payment_channel VARCHAR(50),
      payment_number VARCHAR(100),
      payment_url TEXT,
      paid_at TIMESTAMP,
      wa_sent_at TIMESTAMP,
      undian_type VARCHAR(10),
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS winners (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
      transaction_id VARCHAR NOT NULL REFERENCES transactions(id),
      event_id VARCHAR NOT NULL REFERENCES events(id),
      user_id VARCHAR REFERENCES users(id),
      announced_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS videos (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
      title TEXT NOT NULL,
      thumbnail_url TEXT,
      video_url TEXT,
      video_file TEXT,
      type VARCHAR(20) NOT NULL DEFAULT 'video',
      is_live BOOLEAN NOT NULL DEFAULT false,
      show_on_homepage BOOLEAN NOT NULL DEFAULT false,
      display_order INTEGER DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS partners (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      logo_url TEXT NOT NULL,
      website_url TEXT,
      "order" INTEGER NOT NULL DEFAULT 0,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS how_it_works (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
      step INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      icon_url TEXT,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS footer_settings (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
      key TEXT NOT NULL UNIQUE,
      value TEXT NOT NULL,
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS app_settings (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
      key TEXT NOT NULL UNIQUE,
      value TEXT NOT NULL,
      description TEXT,
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS ip_whitelist (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
      ip_address TEXT NOT NULL UNIQUE,
      description TEXT,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS banks (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
      bank_name TEXT NOT NULL,
      account_number TEXT NOT NULL,
      account_name TEXT NOT NULL,
      logo_url TEXT,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS payment_methods (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      type VARCHAR(50) NOT NULL,
      logo_url TEXT,
      instructions TEXT,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS pages (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      is_published BOOLEAN NOT NULL DEFAULT true,
      updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS terms_conditions (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
      event_id VARCHAR NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      "order" INTEGER NOT NULL DEFAULT 0,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS manual_winner_history (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
      win_date TIMESTAMP NOT NULL,
      phone_number VARCHAR(20) NOT NULL,
      display_name VARCHAR(255),
      amount VARCHAR(500) NOT NULL,
      event_name TEXT NOT NULL,
      display_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  // ── ADD COLUMN IF NOT EXISTS — picks up new columns on existing DBs ───────
  // Each statement is wrapped individually so one failure doesn't block others.

  const alterStatements = [
    // admin_users — new columns
    `ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS name TEXT`,
    `ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS role VARCHAR(50) NOT NULL DEFAULT 'viewer'`,
    `ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS allowed_ips TEXT`,
    `ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true`,

    // events — new columns
    `ALTER TABLE events ADD COLUMN IF NOT EXISTS ebook_file TEXT`,
    `ALTER TABLE events ADD COLUMN IF NOT EXISTS ebook_title TEXT`,
    `ALTER TABLE events ADD COLUMN IF NOT EXISTS has_multiple_undian BOOLEAN NOT NULL DEFAULT false`,
    `ALTER TABLE events ADD COLUMN IF NOT EXISTS undian_a_label TEXT DEFAULT 'Undian A'`,
    `ALTER TABLE events ADD COLUMN IF NOT EXISTS undian_b_label TEXT DEFAULT 'Undian B'`,
    `ALTER TABLE events ADD COLUMN IF NOT EXISTS undian_a_image TEXT`,
    `ALTER TABLE events ADD COLUMN IF NOT EXISTS undian_b_image TEXT`,
    `ALTER TABLE events ADD COLUMN IF NOT EXISTS allow_custom_amount BOOLEAN NOT NULL DEFAULT false`,
    `ALTER TABLE events ADD COLUMN IF NOT EXISTS schedule_type VARCHAR(20) DEFAULT 'none'`,
    `ALTER TABLE events ADD COLUMN IF NOT EXISTS schedule_time VARCHAR(5)`,
    `ALTER TABLE events ADD COLUMN IF NOT EXISTS schedule_day INTEGER`,

    // transactions — new columns
    `ALTER TABLE transactions ADD COLUMN IF NOT EXISTS buyer_name VARCHAR(255)`,
    `ALTER TABLE transactions ADD COLUMN IF NOT EXISTS buyer_email VARCHAR(255)`,
    `ALTER TABLE transactions ADD COLUMN IF NOT EXISTS buyer_bank_name VARCHAR(100)`,
    `ALTER TABLE transactions ADD COLUMN IF NOT EXISTS buyer_account_number VARCHAR(50)`,
    `ALTER TABLE transactions ADD COLUMN IF NOT EXISTS buyer_ip VARCHAR(45)`,
    `ALTER TABLE transactions ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) NOT NULL DEFAULT 'pending'`,
    `ALTER TABLE transactions ADD COLUMN IF NOT EXISTS payment_id VARCHAR(100)`,
    `ALTER TABLE transactions ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50)`,
    `ALTER TABLE transactions ADD COLUMN IF NOT EXISTS payment_channel VARCHAR(50)`,
    `ALTER TABLE transactions ADD COLUMN IF NOT EXISTS payment_number VARCHAR(100)`,
    `ALTER TABLE transactions ADD COLUMN IF NOT EXISTS payment_url TEXT`,
    `ALTER TABLE transactions ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP`,
    `ALTER TABLE transactions ADD COLUMN IF NOT EXISTS wa_sent_at TIMESTAMP`,
    `ALTER TABLE transactions ADD COLUMN IF NOT EXISTS undian_type VARCHAR(10)`,
    `ALTER TABLE transactions ALTER COLUMN user_id DROP NOT NULL`,

    // videos — new columns
    `ALTER TABLE videos ADD COLUMN IF NOT EXISTS video_file TEXT`,
    `ALTER TABLE videos ADD COLUMN IF NOT EXISTS show_on_homepage BOOLEAN NOT NULL DEFAULT false`,
    `ALTER TABLE videos ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0`,
    `ALTER TABLE videos ALTER COLUMN thumbnail_url DROP NOT NULL`,

    // users — new columns
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS bank_name TEXT`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS account_number TEXT`,

    // winners — allow nullable user_id
    `ALTER TABLE winners ALTER COLUMN user_id DROP NOT NULL`,

    // manual_winner_history — migrate amount to VARCHAR if still INTEGER
    `ALTER TABLE manual_winner_history ALTER COLUMN amount TYPE VARCHAR(500) USING amount::VARCHAR`,
  ];

  for (const stmt of alterStatements) {
    try {
      await db.execute(sql.raw(stmt));
    } catch {
      // Column/constraint already correct — not an error
    }
  }

  console.log('✅ Schema migrations complete');
}
