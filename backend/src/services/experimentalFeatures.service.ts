import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface ExperimentalFeature {
  id: string;
  key: string;
  name: string;
  description: string | null;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
}

export interface CreateExperimentalFeatureDto {
  key: string;
  name: string;
  description?: string | null;
  enabled?: boolean;
  createdBy?: string | null;
}

export interface UpdateExperimentalFeatureDto {
  name?: string;
  description?: string | null;
  enabled?: boolean;
}

export class ExperimentalFeaturesService {
  /**
   * Get all experimental features for a tenant
   */
  async getAllFeatures(tenantId: string): Promise<ExperimentalFeature[]> {
    try {
      const features = await prisma.experimentalFeature.findMany({
        where: { tenantId },
        orderBy: { name: 'asc' }
      });

      return features;
    } catch (error) {
      console.error('Error fetching experimental features:', error);
      throw new Error('Failed to fetch experimental features');
    }
  }

  /**
   * Get a specific experimental feature by key
   */
  async getFeatureByKey(tenantId: string, key: string): Promise<ExperimentalFeature | null> {
    try {
      const feature = await prisma.experimentalFeature.findFirst({
        where: { 
          tenantId,
          key 
        }
      });

      return feature;
    } catch (error) {
      console.error('Error fetching experimental feature:', error);
      throw new Error('Failed to fetch experimental feature');
    }
  }

  /**
   * Create a new experimental feature
   */
  async createFeature(tenantId: string, data: CreateExperimentalFeatureDto): Promise<ExperimentalFeature> {
    try {
      // Check if feature with this key already exists
      const existing = await this.getFeatureByKey(tenantId, data.key);
      if (existing) {
        throw new Error('Feature with this key already exists');
      }

      const feature = await prisma.experimentalFeature.create({
        data: {
          ...data,
          tenantId,
          enabled: data.enabled ?? false
        }
      });

      return feature;
    } catch (error) {
      console.error('Error creating experimental feature:', error);
      throw error;
    }
  }

  /**
   * Update an experimental feature
   */
  async updateFeature(tenantId: string, featureId: string, data: UpdateExperimentalFeatureDto): Promise<ExperimentalFeature> {
    try {
      // Verify the feature exists and belongs to the tenant
      const existing = await prisma.experimentalFeature.findFirst({
        where: { 
          id: featureId,
          tenantId 
        }
      });

      if (!existing) {
        throw new Error('Experimental feature not found');
      }

      const updatedFeature = await prisma.experimentalFeature.update({
        where: { id: featureId },
        data: {
          ...data,
          updatedAt: new Date()
        }
      });

      return updatedFeature;
    } catch (error) {
      console.error('Error updating experimental feature:', error);
      throw error;
    }
  }

  /**
   * Toggle an experimental feature's enabled status
   */
  async toggleFeature(tenantId: string, featureId: string): Promise<ExperimentalFeature> {
    try {
      // Get current status
      const existing = await prisma.experimentalFeature.findFirst({
        where: { 
          id: featureId,
          tenantId 
        }
      });

      if (!existing) {
        throw new Error('Experimental feature not found');
      }

      const updatedFeature = await prisma.experimentalFeature.update({
        where: { id: featureId },
        data: {
          enabled: !existing.enabled,
          updatedAt: new Date()
        }
      });

      return updatedFeature;
    } catch (error) {
      console.error('Error toggling experimental feature:', error);
      throw error;
    }
  }

  /**
   * Delete an experimental feature
   */
  async deleteFeature(tenantId: string, featureId: string): Promise<void> {
    try {
      // Verify the feature exists and belongs to the tenant
      const existing = await prisma.experimentalFeature.findFirst({
        where: { 
          id: featureId,
          tenantId 
        }
      });

      if (!existing) {
        throw new Error('Experimental feature not found');
      }

      await prisma.experimentalFeature.delete({
        where: { id: featureId }
      });
    } catch (error) {
      console.error('Error deleting experimental feature:', error);
      throw error;
    }
  }

  /**
   * Check if a specific feature is enabled
   */
  async isFeatureEnabled(tenantId: string, key: string): Promise<boolean> {
    try {
      const feature = await this.getFeatureByKey(tenantId, key);
      return feature?.enabled ?? false;
    } catch (error) {
      console.error('Error checking feature status:', error);
      return false;
    }
  }

  /**
   * Seed default experimental features
   */
  async seedDefaultFeatures(tenantId: string): Promise<void> {
    try {
      const defaultFeatures = [
        {
          key: 'advanced_analytics',
          name: 'Advanced Analytics',
          description: 'Enhanced reporting and analytics capabilities',
          enabled: false
        },
        {
          key: 'ai_assisted_reviews',
          name: 'AI-Assisted Performance Reviews',
          description: 'AI-powered insights for performance evaluations',
          enabled: false
        },
        {
          key: 'predictive_payroll',
          name: 'Predictive Payroll Analytics',
          description: 'Forecast payroll costs and trends',
          enabled: false
        },
        {
          key: 'automated_compliance',
          name: 'Automated Compliance Monitoring',
          description: 'Real-time compliance checking and alerts',
          enabled: false
        },
        {
          key: 'biometric_integration',
          name: 'Biometric Authentication',
          description: 'Fingerprint and facial recognition for attendance',
          enabled: false
        },
        {
          key: 'mobile_app_v2',
          name: 'Mobile App v2 Beta',
          description: 'Next generation mobile application features',
          enabled: false
        }
      ];

      for (const featureData of defaultFeatures) {
        const existing = await this.getFeatureByKey(tenantId, featureData.key);
        if (!existing) {
          await this.createFeature(tenantId, featureData);
        }
      }
    } catch (error) {
      console.error('Error seeding default features:', error);
      throw error;
    }
  }
}

export const experimentalFeaturesService = new ExperimentalFeaturesService();
