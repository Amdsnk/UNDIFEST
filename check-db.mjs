import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({
  connectionString: 'postgresql://postgres:nDrmxWsciBftDCteADBJtqCwlGeuNeMS@trolley.proxy.rlwy.net:56436/railway',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  // Get all events with their IDs
  const allEvents = await pool.query('SELECT id, name, price, prize FROM events ORDER BY name');
  console.log('\n=== ALL Events ===');
  allEvents.rows.forEach(e => console.log(`ID: ${e.id} | Name: ${e.name} | Price: ${e.price}`));

  // Check ALL terms with their event_ids
  const allTerms = await pool.query(
    `SELECT t.id, t.event_id, e.name as event_name, t.title, t.description, t."order", t.is_active
     FROM terms_conditions t
     LEFT JOIN events e ON t.event_id = e.id
     ORDER BY t.event_id, t."order"`
  );
  console.log('\n=== ALL Terms in DB ===');
  allTerms.rows.forEach(r => {
    console.log(`EventID: ${r.event_id}`);
    console.log(`  Event: ${r.event_name || '(no match)'}`);
    console.log(`  Term: [${r.order}] ${r.title}: ${r.description?.substring(0,60)}`);
  });
  console.log('\nTotal terms:', allTerms.rows.length);

  await pool.end();
}

main().catch(e => { console.error(e.message); pool.end(); });
