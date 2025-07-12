// Script to update all orphaned records (missing or invalid tenantId) to a valid tenantId
// Usage: npx ts-node scripts/fixOrphanedTenantRecords.ts
import { prisma } from '../src/index';

const TARGET_TENANT_ID = '00000000-0000-0000-0000-000000000000'; // Charlie's HRMS

async function main() {
  // Update Users with empty or invalid tenantId
  const users = await prisma.user.updateMany({
    where: { OR: [{ tenantId: '' }, { tenantId: { not: TARGET_TENANT_ID } }] },
    data: { tenantId: TARGET_TENANT_ID },
  });
  console.log(`Updated ${users.count} orphaned users.`);

  // Update Employees with empty or invalid tenantId
  const employees = await prisma.employee.updateMany({
    where: { OR: [{ tenantId: '' }, { tenantId: { not: TARGET_TENANT_ID } }] },
    data: { tenantId: TARGET_TENANT_ID },
  });
  console.log(`Updated ${employees.count} orphaned employees.`);

  // You can add more models here if needed (Department, Branch, etc.)
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
