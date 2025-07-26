// check-branchid-column.ts
// TypeScript script to check if 'branchid' column exists in 'salary_advance_requests' table

import { Client } from 'pg';

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function checkBranchIdColumn() {
  await client.connect();
  const res = await client.query(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'salary_advance_requests'
      AND column_name = 'branchid';
  `);
  if (res.rows.length > 0) {
    console.log("branchId column exists in salary_advance_requests table.");
  } else {
    console.log("branchId column does NOT exist in salary_advance_requests table.");
  }
  await client.end();
}

checkBranchIdColumn().catch(err => {
  console.error('Error checking column:', err);
  process.exit(1);
});
