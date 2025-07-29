import { prisma } from '../src/lib/prisma';

// Map branch names to manager user IDs (replace with your actual data)
const branchManagerMap: Record<string, string> = {
  // 'BranchName': 'ManagerUserId',
  'SOHO': 'userId1',
  'WEST': 'userId2',
  // Add more branches and user IDs as needed
};

async function updateManagerUserIds() {
  for (const [branchName, managerUserId] of Object.entries(branchManagerMap)) {
    const branch = await prisma.branch.findFirst({ where: { name: branchName } });
    if (branch) {
      await prisma.branch.update({
        where: { id: branch.id },
        data: { managerUserId },
      });
      console.log(`Updated ${branchName} with managerUserId ${managerUserId}`);
    } else {
      console.warn(`Branch not found: ${branchName}`);
    }
  }
  await prisma.$disconnect();
}

updateManagerUserIds().catch(console.error);
