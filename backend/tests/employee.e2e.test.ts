import request from 'supertest';
import app from '../src/index';
import { PrismaClient } from '@prisma/client';
import { generateToken } from '../src/utils/jwt';

const prisma = new PrismaClient();

describe('Employee API Endpoints', () => {
  let tenantId: string;
  let departmentId: string;
  let branchId: string;
  let employeeId: string;
  let userId: string;
  let token: string;

  beforeAll(async () => {
    // Create a tenant for testing
    const tenant = await prisma.tenant.create({
      data: {
        name: 'Employee Test Tenant',
        domain: 'employee-test-tenant.local',
      },
    });
    tenantId = tenant.id;

    // Create a department and branch for the employee
    const department = await prisma.department.create({
      data: {
        name: 'Employee Test Department',
        tenantId,
      },
    });
    departmentId = department.id;

    const branch = await prisma.branch.create({
      data: {
        name: 'Employee Test Branch',
        departmentId,
        tenantId,
      },
    });
    branchId = branch.id;

    // Create a user for authentication
    const user = await prisma.user.create({
      data: {
        email: 'employeeuser@example.com',
        passwordHash: 'testpassword',
        firstName: 'Employee',
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
    await prisma.employee.deleteMany({ where: { tenantId } });
    await prisma.branch.deleteMany({ where: { tenantId } });
    await prisma.department.deleteMany({ where: { tenantId } });
    await prisma.user.deleteMany({ where: { tenantId } });
    await prisma.tenant.delete({ where: { id: tenantId } });
    await prisma.$disconnect();
  });

  it('should create a new employee', async () => {
    const res = await request(app)
      .post('/api/employees')
      .set('Authorization', `Bearer ${token}`)
      .send({
        employeeNumber: 'EMP001',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '1234567890',
        address: '123 Main St',
        position: 'Developer',
        departmentId,
        branchId,
        salary: 50000,
        hireDate: '2023-01-01',
      });
    expect(res.statusCode).toEqual(201);
    expect(res.body.data.employee).toHaveProperty('id');
    employeeId = res.body.data.employee.id;
  });

  it('should get all employees', async () => {
    const res = await request(app)
      .get('/api/employees')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body.data.employees)).toBe(true);
  });

  it('should get an employee by id', async () => {
    const res = await request(app)
      .get(`/api/employees/${employeeId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.data.employee).toHaveProperty('id', employeeId);
  });

  it('should update an employee', async () => {
    const res = await request(app)
      .put(`/api/employees/${employeeId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ firstName: 'Jane' });
    expect(res.statusCode).toEqual(200);
    expect(res.body.data.employee.firstName).toBe('Jane');
  });

  it('should get employee performance (should be empty)', async () => {
    const res = await request(app)
      .get(`/api/employees/${employeeId}/performance`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body.data.reviews)).toBe(true);
  });

  it('should get employee leave (should be empty)', async () => {
    const res = await request(app)
      .get(`/api/employees/${employeeId}/leave`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body.data.leaveRequests)).toBe(true);
  });

  it('should get employee payroll (should be empty)', async () => {
    const res = await request(app)
      .get(`/api/employees/${employeeId}/payroll`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body.data.payrolls)).toBe(true);
  });

  it('should delete an employee', async () => {
    const res = await request(app)
      .delete(`/api/employees/${employeeId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toBe('Employee deleted successfully');
  });
});
