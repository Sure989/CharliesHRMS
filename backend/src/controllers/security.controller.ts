import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { handleDemoMode } from '../utils/demoModeHelper';
import { getMockDataByTenant } from '../utils/comprehensiveMockData';

export const getSecuritySettings = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    console.log('TenantId:', tenantId);

    if (!tenantId) {
      console.warn('Missing tenantId in request');
      return res.status(400).json({ status: 'error', message: 'Missing tenantId.' });
    }

    const result = await handleDemoMode(
      req,
      {
        id: 'demo-security-settings',
        tenantId,
        twoFactorAuth: false,
        passwordExpiry: false,
        sessionTimeout: true,
        ipWhitelist: false,
        auditLogging: true,
        encryptionAtRest: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      async () => {
        // Try to find existing settings or create default ones
        let settings = await prisma.securitySettings.findUnique({ where: { tenantId } });
        
        if (!settings) {
          console.log('Creating default security settings for tenant:', tenantId);
          
          // Create default security settings
          settings = await prisma.securitySettings.create({
            data: {
              tenantId,
              twoFactorAuth: false,
              passwordExpiry: false,
              sessionTimeout: true,
              ipWhitelist: false,
              auditLogging: true,
              encryptionAtRest: false
            }
          });
          
          console.log('Created default security settings:', settings);
        } else {
          console.log('Found existing security settings:', settings);
        }

        return settings;
      }
    );

    return res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    console.error('Error handling security settings:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch security settings.' });
  }
};

export const updateSecuritySettings = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    console.log('TenantId:', tenantId);
    console.log('Request body:', req.body);

    if (!tenantId) {
      console.warn('Missing tenantId in request');
      return res.status(400).json({ status: 'error', message: 'Missing tenantId.' });
    }

    const settings = await prisma.securitySettings.upsert({
      where: { tenantId },
      update: req.body,
      create: { tenantId, ...req.body },
    });

    console.log('Updated security settings:', settings);
    return res.status(200).json({ status: 'success', data: settings });
  } catch (error) {
    console.error('Error updating security settings:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to update security settings.' });
  }
};
