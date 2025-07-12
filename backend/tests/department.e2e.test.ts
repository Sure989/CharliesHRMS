import request from 'supertest';
import app from '../src/index';
import { PrismaClient } from '@prisma/client';
import { generateToken } from '../src/utils/jwt';

const prisma = new PrismaClient();

describe('Department API Endpoints', () => {
  let tenantId: string;
  let departmentId: string;
  let userId: string;
  let token: string;

  beforeAll(async () => {
    // Create a tenant for testing
    const tenant = await prisma.tenant.create({
      data: {
        name: 'Dept Test Tenant',
        domain: 'dept-test-tenant.local',
      },
    });
    tenantId = tenant.id;

    // Create a user for authentication
    const user = await prisma.user.create({
      data: {
        email: 'deptuser@example.com',
        passwordHash: 'testpassword',
        firstName: 'Dept',
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
    await prisma.department.deleteMany({ where: { tenantId } });
    await prisma.user.deleteMany({ where: { tenantId } });
    await prisma.tenant.delete({ where: { id: tenantId } });
    await prisma.$disconnect();
  });

  it('should create a new department', async () => {
    const res = await request(app)
      .post('/api/departments')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Engineering', description: 'Engineering Dept' });
    expect(res.statusCode).toEqual(201);
    expect(res.body.data.department).toHaveProperty('id');
    departmentId = res.body.data.department.id;
  });

  it('should get all departments', async () => {
    const res = await request(app)
      .get('/api/departments')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body.data.departments)).toBe(true);
  });

  it('should get a department by id', async () => {
    const res = await request(app)
      .get(`/api/departments/${departmentId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.data.department).toHaveProperty('id', departmentId);
  });

  it('should update a department', async () => {
    const res = await request(app)
      .put(`/api/departments/${departmentId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Engineering Updated' });
    expect(res.statusCode).toEqual(200);
    expect(res.body.data.department.name).toBe('Engineering Updated');
  });

  it('should get employees in a department (should be empty)', async () => {
    const res = await request(app)
      .get(`/api/departments/${departmentId}/employees`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body.data.employees)).toBe(true);
    expect(res.body.data.employees.length).toBe(0);
  });

  it('should delete a department', async () => {
    const res = await request(app)
      .delete(`/api/departments/${departmentId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toBe('Department deleted successfully');
  });
});
