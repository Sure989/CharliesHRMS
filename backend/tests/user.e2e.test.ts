import request from 'supertest';
import app from '../src/index';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('User API Endpoints', () => {
  let userId: string;
  let tenantId: string;

  beforeAll(async () => {
    // Create a tenant for testing
    const tenant = await prisma.tenant.create({
      data: {
        name: 'Test Tenant',
        domain: 'test-tenant.local',
      },
    });
    tenantId = tenant.id;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.user.deleteMany({ where: { tenantId } });
    await prisma.tenant.delete({ where: { id: tenantId } });
    await prisma.$disconnect();
  });

  it('should create a new user', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({
        email: 'testuser@example.com',
        passwordHash: 'testpassword',
        firstName: 'Test',
        lastName: 'User',
        role: 'EMPLOYEE',
        status: 'ACTIVE',
        tenantId
      });
    expect(res.statusCode).toEqual(201);
    expect(res.body.data).toHaveProperty('id');
    userId = res.body.data.id;
  });

  it('should get all users', async () => {
    const res = await request(app).get('/api/users');
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('should get a user by id', async () => {
    const res = await request(app).get(`/api/users/${userId}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.data).toHaveProperty('id', userId);
  });

  it('should update a user', async () => {
    const res = await request(app)
      .put(`/api/users/${userId}`)
      .send({ firstName: 'Updated' });
    expect(res.statusCode).toEqual(200);
    expect(res.body.data.firstName).toBe('Updated');
  });

  it('should update user status', async () => {
    const res = await request(app)
      .patch(`/api/users/${userId}/status`)
      .send({ status: 'INACTIVE' });
    expect(res.statusCode).toEqual(200);
    expect(res.body.data.status).toBe('INACTIVE');
  });

  it('should change user password', async () => {
    const res = await request(app)
      .post(`/api/users/${userId}/change-password`)
      .send({ password: 'newpassword' });
    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toBe('Password updated');
  });

  it('should get user stats', async () => {
    const res = await request(app).get('/api/users/stats');
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('should get user roles', async () => {
    const res = await request(app).get('/api/users/roles');
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('should delete a user', async () => {
    const res = await request(app).delete(`/api/users/${userId}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toBe('User deleted');
  });
});
