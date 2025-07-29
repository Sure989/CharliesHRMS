import { prisma } from '../src/lib/prisma';

async function removeOrphanedUsers() {
  try {
    // Find all users whose employeeId does not match any employee
    const orphanedUsers = await prisma.user.findMany({
      where: {
        employeeId: {
          notIn: (await prisma.employee.findMany({ select: { id: true } })).map(e => e.id),
        },
      },
    });

    if (orphanedUsers.length === 0) {
      console.log('No orphaned users found.');
      return;
    }

    // Delete all orphaned users
    const deleted = await prisma.user.deleteMany({
      where: {
        id: { in: orphanedUsers.map(u => u.id) },
      },
    });
    console.log(`Deleted ${deleted.count} orphaned user(s).`);
  } catch (error) {
    console.error('Error removing orphaned users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

removeOrphanedUsers();
