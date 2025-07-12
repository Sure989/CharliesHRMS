import { KenyanTaxBand, KenyanNHIFBand, KenyanPayrollSettings } from '../types/payroll';

// Regulatory update types
export interface RegulatoryUpdate {
  id: string;
  type: 'paye_bands' | 'nssf_rates' | 'nhif_bands' | 'personal_relief' | 'minimum_wage';
  title: string;
  description: string;
  effectiveDate: string;
  source: 'KRA' | 'NSSF' | 'NHIF' | 'MINISTRY_OF_LABOUR';
  status: 'pending' | 'approved' | 'applied' | 'rejected';
  data: Record<string, any>;
  createdDate: string;
  appliedDate?: string;
  appliedBy?: string;
  version: string;
}

export interface RegulatorySource {
  name: string;
  url: string;
  lastChecked: string;
  status: 'active' | 'inactive' | 'error';
  checkInterval: number; // in hours
}

export class RegulatoryUpdatesService {
  private static readonly REGULATORY_SOURCES: RegulatorySource[] = [
    {
      name: 'KRA Tax Rates',
      url: 'https://www.kra.go.ke/individual/calculate-tax/calculating-tax/paye',
      lastChecked: '',
      status: 'active',
      checkInterval: 24
    },
    {
      name: 'NSSF Contribution Rates',
      url: 'https://www.nssf.or.ke/contribution-rates',
      lastChecked: '',
      status: 'active',
      checkInterval: 168 // Weekly
    },
    {
      name: 'NHIF Contribution Rates',
      url: 'https://www.nhif.or.ke/healthinsurance/contributionRates',
      lastChecked: '',
      status: 'active',
      checkInterval: 168 // Weekly
    }
  ];

  /**
   * Check for regulatory updates from official sources
   */
  static async checkForUpdates(): Promise<RegulatoryUpdate[]> {
    const updates: RegulatoryUpdate[] = [];
    
    try {
      // In a real implementation, this would scrape or call APIs from regulatory bodies
      // For now, we'll simulate checking for updates
      
      const currentYear = new Date().getFullYear();
      const currentDate = new Date().toISOString();
      
      // Simulate checking KRA for PAYE updates
      const payeUpdate = await this.checkKRAUpdates(currentYear);
      if (payeUpdate) {
        updates.push(payeUpdate);
      }
      
      // Simulate checking NSSF for rate updates
      const nssfUpdate = await this.checkNSSFUpdates(currentYear);
      if (nssfUpdate) {
        updates.push(nssfUpdate);
      }
      
      // Simulate checking NHIF for band updates
      const nhifUpdate = await this.checkNHIFUpdates(currentYear);
      if (nhifUpdate) {
        updates.push(nhifUpdate);
      }
      
      // Update last checked timestamps
      this.REGULATORY_SOURCES.forEach(source => {
        source.lastChecked = currentDate;
      });
      
    } catch (error) {
      console.error('Error checking for regulatory updates:', error);
    }
    
    return updates;
  }

  /**
   * Simulate checking KRA for PAYE tax band updates
   */
  private static async checkKRAUpdates(year: number): Promise<RegulatoryUpdate | null> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // In a real implementation, this would parse KRA website or API
    // For simulation, we'll occasionally return an update
    const shouldUpdate = Math.random() < 0.1; // 10% chance of update
    
    if (shouldUpdate) {
      return {
        id: `kra_update_${Date.now()}`,
        type: 'paye_bands',
        title: `PAYE Tax Bands Update for ${year}`,
        description: 'Updated PAYE tax bands and personal relief amounts as per KRA Notice',
        effectiveDate: `${year}-01-01`,
        source: 'KRA',
        status: 'pending',
        data: {
          payeBands: [
            { min: 0, max: 24000, rate: 0.10, baseAmount: 0 },
            { min: 24001, max: 32333, rate: 0.25, baseAmount: 2400 },
            { min: 32334, max: 500000, rate: 0.30, baseAmount: 4483 },
            { min: 500001, max: 800000, rate: 0.325, baseAmount: 144783 },
            { min: 800001, max: Infinity, rate: 0.35, baseAmount: 242283 }
          ],
          personalRelief: 2400
        },
        createdDate: new Date().toISOString(),
        version: `${year}.1`
      };
    }
    
    return null;
  }

  /**
   * Simulate checking NSSF for contribution rate updates
   */
  private static async checkNSSFUpdates(year: number): Promise<RegulatoryUpdate | null> {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const shouldUpdate = Math.random() < 0.05; // 5% chance of update
    
    if (shouldUpdate) {
      return {
        id: `nssf_update_${Date.now()}`,
        type: 'nssf_rates',
        title: `NSSF Contribution Rates Update for ${year}`,
        description: 'Updated NSSF contribution rates and tier limits',
        effectiveDate: `${year}-01-01`,
        source: 'NSSF',
        status: 'pending',
        data: {
          tier1Limit: 7000,
          tier2Limit: 36000,
          employeeRate: 0.06,
          employerRate: 0.06
        },
        createdDate: new Date().toISOString(),
        version: `${year}.1`
      };
    }
    
    return null;
  }

  /**
   * Simulate checking NHIF for contribution band updates
   */
  private static async checkNHIFUpdates(year: number): Promise<RegulatoryUpdate | null> {
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const shouldUpdate = Math.random() < 0.03; // 3% chance of update
    
    if (shouldUpdate) {
      return {
        id: `nhif_update_${Date.now()}`,
        type: 'nhif_bands',
        title: `NHIF Contribution Bands Update for ${year}`,
        description: 'Updated NHIF contribution amounts by salary bands',
        effectiveDate: `${year}-01-01`,
        source: 'NHIF',
        status: 'pending',
        data: {
          nhifBands: [
            { min: 0, max: 5999, amount: 150 },
            { min: 6000, max: 7999, amount: 300 },
            { min: 8000, max: 11999, amount: 400 },
            { min: 12000, max: 14999, amount: 500 },
            { min: 15000, max: 19999, amount: 600 },
            { min: 20000, max: 24999, amount: 750 },
            { min: 25000, max: 29999, amount: 850 },
            { min: 30000, max: 34999, amount: 900 },
            { min: 35000, max: 39999, amount: 950 },
            { min: 40000, max: 44999, amount: 1000 },
            { min: 45000, max: 49999, amount: 1100 },
            { min: 50000, max: 59999, amount: 1200 },
            { min: 60000, max: 69999, amount: 1300 },
            { min: 70000, max: 79999, amount: 1400 },
            { min: 80000, max: 89999, amount: 1500 },
            { min: 90000, max: 99999, amount: 1600 },
            { min: 100000, max: Infinity, amount: 1700 }
          ]
        },
        createdDate: new Date().toISOString(),
        version: `${year}.1`
      };
    }
    
    return null;
  }

  /**
   * Apply a regulatory update to the system
   */
  static async applyUpdate(
    update: RegulatoryUpdate, 
    currentSettings: KenyanPayrollSettings,
    userId: string
  ): Promise<KenyanPayrollSettings> {
    const updatedSettings = { ...currentSettings };
    
    switch (update.type) {
      case 'paye_bands':
        if (update.data.payeBands) {
          updatedSettings.statutoryRates.payeTaxBands = update.data.payeBands;
        }
        if (update.data.personalRelief) {
          updatedSettings.payrollDefaults.personalRelief = update.data.personalRelief;
        }
        break;
        
      case 'nssf_rates':
        if (update.data.tier1Limit) {
          updatedSettings.statutoryRates.nssfTier1Limit = update.data.tier1Limit;
        }
        if (update.data.tier2Limit) {
          updatedSettings.statutoryRates.nssfTier2Limit = update.data.tier2Limit;
        }
        if (update.data.employeeRate) {
          updatedSettings.statutoryRates.nssfRate = update.data.employeeRate;
        }
        break;
        
      case 'nhif_bands':
        if (update.data.nhifBands) {
          updatedSettings.statutoryRates.nhifBands = update.data.nhifBands;
        }
        break;
    }
    
    // Mark update as applied
    update.status = 'applied';
    update.appliedDate = new Date().toISOString();
    update.appliedBy = userId;
    
    return updatedSettings;
  }

  /**
   * Validate a regulatory update before applying
   */
  static validateUpdate(update: RegulatoryUpdate): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Check effective date is not in the past (with some tolerance)
    const effectiveDate = new Date(update.effectiveDate);
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    
    if (effectiveDate < thirtyDaysAgo) {
      errors.push('Effective date is too far in the past');
    }
    
    // Validate data structure based on update type
    switch (update.type) {
      case 'paye_bands':
        if (!update.data.payeBands || !Array.isArray(update.data.payeBands)) {
          errors.push('Invalid PAYE bands data structure');
        } else {
          // Validate tax bands are properly ordered and have required fields
          const bands = update.data.payeBands as KenyanTaxBand[];
          for (let i = 0; i < bands.length; i++) {
            const band = bands[i];
            if (typeof band.min !== 'number' || typeof band.max !== 'number' || 
                typeof band.rate !== 'number' || typeof band.baseAmount !== 'number') {
              errors.push(`Invalid tax band structure at index ${i}`);
            }
            if (band.rate < 0 || band.rate > 1) {
              errors.push(`Invalid tax rate at index ${i}: must be between 0 and 1`);
            }
          }
        }
        break;
        
      case 'nssf_rates':
        if (update.data.employeeRate && (update.data.employeeRate < 0 || update.data.employeeRate > 0.2)) {
          errors.push('NSSF employee rate must be between 0% and 20%');
        }
        if (update.data.tier1Limit && update.data.tier1Limit < 0) {
          errors.push('NSSF Tier 1 limit must be positive');
        }
        if (update.data.tier2Limit && update.data.tier2Limit < 0) {
          errors.push('NSSF Tier 2 limit must be positive');
        }
        break;
        
      case 'nhif_bands':
        if (!update.data.nhifBands || !Array.isArray(update.data.nhifBands)) {
          errors.push('Invalid NHIF bands data structure');
        } else {
          const bands = update.data.nhifBands as KenyanNHIFBand[];
          for (let i = 0; i < bands.length; i++) {
            const band = bands[i];
            if (typeof band.min !== 'number' || typeof band.max !== 'number' || 
                typeof band.amount !== 'number') {
              errors.push(`Invalid NHIF band structure at index ${i}`);
            }
            if (band.amount < 0) {
              errors.push(`Invalid NHIF contribution amount at index ${i}: must be positive`);
            }
          }
        }
        break;
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get update history for audit purposes
   */
  static getUpdateHistory(): RegulatoryUpdate[] {
    // In a real implementation, this would fetch from database
    // For now, return empty array
    return [];
  }

  /**
   * Schedule automatic checks for regulatory updates
   */
  static scheduleAutomaticChecks(): void {
    // Check for updates every 24 hours
    setInterval(async () => {
      try {
        const updates = await this.checkForUpdates();
        if (updates.length > 0) {
          console.log(`Found ${updates.length} regulatory updates:`, updates);
          // In a real implementation, this would notify administrators
          // or automatically apply non-critical updates
        }
      } catch (error) {
        console.error('Error in scheduled regulatory check:', error);
      }
    }, 24 * 60 * 60 * 1000); // 24 hours
  }

  /**
   * Get regulatory compliance status
   */
  static getComplianceStatus(): {
    isCompliant: boolean;
    lastUpdateCheck: string;
    pendingUpdates: number;
    criticalUpdates: number;
  } {
    const pendingUpdates = this.getUpdateHistory().filter(u => u.status === 'pending').length;
    const criticalUpdates = this.getUpdateHistory().filter(u => 
      u.status === 'pending' && new Date(u.effectiveDate) <= new Date()
    ).length;
    
    return {
      isCompliant: criticalUpdates === 0,
      lastUpdateCheck: this.REGULATORY_SOURCES[0]?.lastChecked || '',
      pendingUpdates,
      criticalUpdates
    };
  }
}
