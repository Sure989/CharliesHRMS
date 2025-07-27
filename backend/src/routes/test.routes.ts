import { Router } from 'express';
import { prisma } from '../index';
import bcrypt from 'bcrypt';

const router = Router();

router.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'success', message: 'Database connected' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Database connection failed', error: error.message });
  }
});

router.post('/create-test-user', async (req, res) => {
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
    
    res.json({ status: 'success', message: 'Test user created', user: { id: user.id, email: user.email } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to create user', error: error.message });
  }
});

export default router;