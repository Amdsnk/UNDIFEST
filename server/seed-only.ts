import { seedDatabase } from './db-seed';

console.log('🌱 Starting database seed...\n');

seedDatabase()
  .then(() => {
    console.log('\n✅ Seed completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Seed failed:', error);
    process.exit(1);
  });

