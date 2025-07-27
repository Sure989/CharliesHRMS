import { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
    
    return res.status(200).json({ 
      status: 'success', 
      message: 'Test user created', 
      user: { id: user.id, email: user.email } 
    });
  } catch (error) {
    return res.status(500).json({ 
      status: 'error', 
      message: 'Failed to create user', 
      error: error.message 
    });
  } finally {
    await prisma.$disconnect();
  }
}