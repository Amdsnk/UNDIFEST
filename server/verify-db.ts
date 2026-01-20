import { db } from './db';
import { sql } from 'drizzle-orm';

async function verifyDatabase() {
  try {
    console.log('🔍 Checking database tables...\n');

    // Check all tables
    const tables = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    console.log('📋 Tables found:');
    if (tables.rows.length === 0) {
      console.log('   ❌ No tables found!');
    } else {
      tables.rows.forEach((row: any) => {
        console.log(`   ✓ ${row.table_name}`);
      });
    }

    // Check admin users
    const adminCount = await db.execute(sql`
      SELECT COUNT(*) as count FROM admin_users;
    `);
    
    console.log(`\n👤 Admin users: ${adminCount.rows[0]?.count || 0}`);

    if (adminCount.rows[0]?.count === 0) {
      console.log('   ⚠️  No admin users found. Run seed script!');
    }

    // Check events
    const eventCount = await db.execute(sql`
      SELECT COUNT(*) as count FROM events;
    `);
    
    console.log(`🎫 Events: ${eventCount.rows[0]?.count || 0}`);

    // Check users
    const userCount = await db.execute(sql`
      SELECT COUNT(*) as count FROM users;
    `);
    
    console.log(`👥 Users: ${userCount.rows[0]?.count || 0}`);

    console.log('\n✅ Database verification complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error verifying database:', error);
    process.exit(1);
  }
}

verifyDatabase();

