// Script to test if managerUserId is recognized by Prisma client
// Run with: npx ts-node scripts/testManagerUserId.ts

import { prisma } from '../src/lib/prisma';

async function main() {
  const branches = await prisma.branch.findMany();
  for (const branch of branches) {
    console.log(`Branch: ${branch.name}, managerUserId: ${branch.managerUserId}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
