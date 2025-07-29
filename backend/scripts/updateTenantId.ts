// updateTenantId.ts
// Usage: npx ts-node updateTenantId.ts <oldTenantId> <newTenantId>

import { prisma } from '../src/lib/prisma';

async function updateTenantId(oldTenantId: string, newTenantId: string) {
  // List all tables/fields that reference tenantId
  const updateTables = [
    { model: 'user', field: 'tenantId' },
    { model: 'employee', field: 'tenantId' },
    { model: 'department', field: 'tenantId' },
    { model: 'branch', field: 'tenantId' },
    { model: 'leaveBalance', field: 'tenantId' },
    { model: 'leavePolicy', field: 'tenantId' },
    { model: 'leaveRequest', field: 'tenantId' },
    { model: 'leaveType', field: 'tenantId' },
    { model: 'holiday', field: 'tenantId' },
    { model: 'payrollSettings', field: 'tenantId' },
    { model: 'payrollPeriod', field: 'tenantId' },
    { model: 'payroll', field: 'tenantId' },
    { model: 'salaryAdvancePolicy', field: 'tenantId' },
    { model: 'salaryAdvanceRequest', field: 'tenantId' },
    // Add more as needed
  ];

  for (const { model, field } of updateTables) {
    // @ts-ignore
    await prisma[model].updateMany({
      where: { [field]: oldTenantId },
      data: { [field]: newTenantId },
    });
    console.log(`Updated ${model} table.`);
  }

  // Finally, update the tenant table itself if needed
  await prisma.tenant.update({
    where: { id: oldTenantId },
    data: { id: newTenantId },
  });
  console.log('Updated tenant table.');
}

// Get old and new tenant IDs from command line
const [oldTenantId, newTenantId] = process.argv.slice(2);

if (!oldTenantId || !newTenantId) {
  console.error('Usage: npx ts-node updateTenantId.ts <oldTenantId> <newTenantId>');
  process.exit(1);
}

updateTenantId(oldTenantId, newTenantId)
  .then(() => {
    console.log('All related records updated successfully.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Error updating records:', err);
    process.exit(1);
  });
