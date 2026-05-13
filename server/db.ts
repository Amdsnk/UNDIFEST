import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";
import { config } from 'dotenv';

// Load .env file in development
if (process.env.NODE_ENV !== 'production') {
  config();
}

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Parse the connection string to extract components
const connectionString = process.env.DATABASE_URL;

console.log("🔌 Connecting to database...");
console.log("Connection string format:", connectionString.replace(/:[^:@]+@/, ':****@'));

const url = new URL(connectionString);

const sslDisabled = connectionString.includes('sslmode=disable');
const isLocalDb = url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname === 'helium';

export const pool = new Pool({
  user: url.username,
  password: url.password,
  host: url.hostname,
  port: parseInt(url.port || '5432'),
  database: url.pathname.slice(1).split('?')[0],
  ssl: (sslDisabled || isLocalDb) ? false : { rejectUnauthorized: false },
  // Force IPv4
  family: 4,
});

// Test connection
pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
});

export const db = drizzle(pool, { schema });
