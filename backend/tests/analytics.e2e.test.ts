import request from 'supertest';
import app from '../src/index';
import { PrismaClient } from '@prisma/client';
import { generateToken } from '../src/utils/jwt';

const prisma = new PrismaClient();

describe('Analytics API Endpoints', () => {
  let tenantId: string;
  let userId: string;
  let token: string;

  beforeAll(async () => {
    // Create a tenant for testing
    const tenant = await prisma.tenant.create({
      data: {
        name: 'Analytics Test Tenant',
        domain: 'analytics-test-tenant.local',
      },
    });
    tenantId = tenant.id;

    // Create a user for authentication
    const user = await prisma.user.create({
      data: {
        email: 'analyticsuser@example.com',
        passwordHash: 'testpassword',
        firstName: 'Analytics',
        lastName: 'User',
        role: 'ADMIN',
        status: 'ACTIVE',
        tenantId,
      },
    });
    userId = user.id;
    token = generateToken({ userId, role: user.role, tenantId });

    // Seed minimal data for analytics
    await prisma.department.create({ data: { name: 'Dept', tenantId } });
    await prisma.branch.create({ data: { name: 'Branch', departmentId: (await prisma.department.findFirst({ where: { tenantId } }))!.id, tenantId } });
    await prisma.employee.create({ data: { employeeNumber: 'A1', firstName: 'A', lastName: 'B', email: 'a@b.com', position: 'Dev', departmentId: (await prisma.department.findFirst({ where: { tenantId } }))!.id, branchId: (await prisma.branch.findFirst({ where: { tenantId } }))!.id, hireDate: new Date(), tenantId } });
  });

  afterAll(async () => {
    await prisma.employee.deleteMany({ where: { tenantId } });
    await prisma.branch.deleteMany({ where: { tenantId } });
    await prisma.department.deleteMany({ where: { tenantId } });
    await prisma.user.deleteMany({ where: { tenantId } });
    await prisma.tenant.delete({ where: { id: tenantId } });
    await prisma.$disconnect();
  });

  it('should get dashboard analytics', async () => {
    const res = await request(app)
      .get('/api/analytics/dashboard')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.data.metrics).toHaveProperty('totalEmployees');
  });

  it('should get analytics summary', async () => {
    const res = await request(app)
      .get('/api/analytics/summary')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.data.summary).toHaveProperty('dashboard');
    expect(res.body.data.summary).toHaveProperty('employees');
  });

  it('should get employee analytics', async () => {
    const res = await request(app)
      .get('/api/analytics/employees')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.data.analytics).toHaveProperty('headcount');
  });

  it('should get overtime analytics', async () => {
    const res = await request(app)
      .get('/api/analytics/overtime')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.data).toHaveProperty('totalOvertime');
    expect(res.body.data).toHaveProperty('averageOvertime');
  });

  it('should get diversity analytics (not supported)', async () => {
    const res = await request(app)
      .get('/api/analytics/diversity')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.data).toHaveProperty('message');
    expect(res.body.data.message).toMatch(/not available/i);
  });

  it('should get attendance trends (not supported)', async () => {
    const res = await request(app)
      .get('/api/analytics/attendance')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.data).toHaveProperty('message');
    expect(res.body.data.message).toMatch(/not available/i);
  });
});
