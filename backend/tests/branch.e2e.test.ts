import request from 'supertest';
import app from '../src/index';
import { PrismaClient } from '@prisma/client';
import { generateToken } from '../src/utils/jwt';

const prisma = new PrismaClient();

describe('Branch API Endpoints', () => {
  let tenantId: string;
  let departmentId: string;
  let branchId: string;
  let userId: string;
  let token: string;

  beforeAll(async () => {
    // Create a tenant for testing
    const tenant = await prisma.tenant.create({
      data: {
        name: 'Branch Test Tenant',
        domain: 'branch-test-tenant.local',
      },
    });
    tenantId = tenant.id;

    // Create a department for the branch
    const department = await prisma.department.create({
      data: {
        name: 'Branch Test Department',
        tenantId,
      },
    });
    departmentId = department.id;

    // Create a user for authentication
    const user = await prisma.user.create({
      data: {
        email: 'branchuser@example.com',
        passwordHash: 'testpassword',
        firstName: 'Branch',
        lastName: 'User',
        role: 'ADMIN',
        status: 'ACTIVE',
        tenantId,
      },
    });
    userId = user.id;
    token = generateToken({ userId, role: user.role, tenantId });
  });

  afterAll(async () => {
    await prisma.branch.deleteMany({ where: { tenantId } });
    await prisma.department.deleteMany({ where: { tenantId } });
    await prisma.user.deleteMany({ where: { tenantId } });
    await prisma.tenant.delete({ where: { id: tenantId } });
    await prisma.$disconnect();
  });

  it('should create a new branch', async () => {
    const res = await request(app)
      .post('/api/branches')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Main Branch', departmentId });
    expect(res.statusCode).toEqual(201);
    expect(res.body.data.branch).toHaveProperty('id');
    branchId = res.body.data.branch.id;
  });

  it('should get all branches', async () => {
    const res = await request(app)
      .get('/api/branches')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body.data.branches)).toBe(true);
  });

  it('should get a branch by id', async () => {
    const res = await request(app)
      .get(`/api/branches/${branchId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.data.branch).toHaveProperty('id', branchId);
  });

  it('should update a branch', async () => {
    const res = await request(app)
      .put(`/api/branches/${branchId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Main Branch Updated' });
    expect(res.statusCode).toEqual(200);
    expect(res.body.data.branch.name).toBe('Main Branch Updated');
  });

  it('should get employees in a branch (should be empty)', async () => {
    const res = await request(app)
      .get(`/api/branches/${branchId}/employees`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body.data.employees)).toBe(true);
    expect(res.body.data.employees.length).toBe(0);
  });

  it('should delete a branch', async () => {
    const res = await request(app)
      .delete(`/api/branches/${branchId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toBe('Branch deleted successfully');
  });
});
