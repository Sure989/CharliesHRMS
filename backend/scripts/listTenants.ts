// Script to list all tenant IDs and names in the database
// Usage: npx ts-node scripts/listTenants.ts
import { prisma } from '../src/index';

async function main() {
  const tenants = await prisma.tenant.findMany({ select: { id: true, name: true } });
  if (tenants.length === 0) {
    console.log('No tenants found.');
    return;
  }
  console.log('Tenant IDs and Names:');
  tenants.forEach(t => console.log(`ID: ${t.id} | Name: ${t.name}`));
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
