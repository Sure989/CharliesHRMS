import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl || !dbUrl.includes('supabase.com')) {
    console.error('❌ Not connected to Supabase');
    process.exit(1);
  }

  const prisma = new PrismaClient();
  
  try {
    console.log('🚀 Starting Supabase seeding...');
    
    // Create tenant
    const tenant = await prisma.tenant.create({
      data: {
        id: "5bba6f14-accf-4e64-b85c-db4d3fa9c848",
        name: "Charlie's HRMS",
        domain: 'charlieshrms.com',
      },
    });
    console.log('✅ Tenant created');

    // Create admin user
    const hashedPassword = await bcrypt.hash('password123', 10);
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@charlieshrms.com',
        passwordHash: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
        status: 'ACTIVE',
        tenantId: tenant.id,
      },
    });
    console.log('✅ Admin user created');

    // Create departments
    const operations = await prisma.department.create({
      data: {
        name: 'Operations',
        description: 'Operations Department',
        tenantId: tenant.id,
        status: 'ACTIVE',
      },
    });
    console.log('✅ Department created');

    // Create branch
    const branch = await prisma.branch.create({
      data: {
        name: 'SOHO',
        location: 'SOHO',
        address: 'SOHO St',
        departmentId: operations.id,
        tenantId: tenant.id,
        status: 'ACTIVE',
      },
    });
    console.log('✅ Branch created');

    // Create employee
    const employee = await prisma.employee.create({
      data: {
        employeeNumber: 'EMP001',
        firstName: 'STRIVE',
        lastName: 'MACHIIRA',
        email: 'smachiira@charliescorp.co.ke',
        position: 'MARKETING HEAD',
        departmentId: operations.id,
        branchId: branch.id,
        hireDate: new Date('2022-01-01'),
        status: 'ACTIVE',
        tenantId: tenant.id,
      },
    });
    console.log('✅ Employee created');

    console.log('🎉 Seeding completed successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();