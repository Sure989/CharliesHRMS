const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const user = await prisma.user.create({
      data: {
        email: 'admin@charlieshrms.com',
        passwordHash: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
        status: 'ACTIVE',
        tenantId: '00000000-0000-0000-0000-000000000000'
      }
    });
    
    console.log('Admin user created:', { id: user.id, email: user.email });
  } catch (error) {
    console.error('Error creating admin:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();