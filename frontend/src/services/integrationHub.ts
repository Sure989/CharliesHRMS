export interface IntegrationConfig {
  id: string;
  name: string;
  type: 'bank' | 'mobile_money' | 'accounting' | 'hr_system' | 'government' | 'api';
  status: 'active' | 'inactive' | 'error' | 'pending';
  endpoint: string;
  apiKey?: string;
  credentials?: Record<string, string>;
  lastSync: string;
  syncFrequency: 'real-time' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'manual';
  features: string[];
  errorCount: number;
  successRate: number;
}

export interface PaymentIntegration {
  id: string;
  provider: 'equity_bank' | 'kcb' | 'cooperative_bank' | 'mpesa' | 'airtel_money';
  name: string;
  type: 'bank_transfer' | 'mobile_money';
  status: 'active' | 'inactive';
  credentials: {
    apiKey: string;
    secretKey: string;
    endpoint: string;
    merchantCode?: string;
  };
  supportedCurrencies: string[];
  transactionLimits: {
    daily: number;
    monthly: number;
    perTransaction: number;
  };
  fees: {
    percentage: number;
    fixedAmount: number;
    currency: string;
  };
}

export interface GovernmentIntegration {
  id: string;
  agency: 'KRA' | 'NSSF' | 'NHIF' | 'MINISTRY_OF_LABOUR';
  name: string;
  endpoint: string;
  status: 'active' | 'inactive' | 'maintenance';
  lastSubmission: string;
  nextDeadline: string;
  submissionType: 'monthly' | 'quarterly' | 'annual';
  requiredFields: string[];
  validationRules: Record<string, any>;
}

export interface AccountingIntegration {
  id: string;
  system: 'quickbooks' | 'sage' | 'xero' | 'tally' | 'custom';
  name: string;
  version: string;
  status: 'active' | 'inactive';
  syncSettings: {
    chartOfAccounts: boolean;
    journalEntries: boolean;
    employeeData: boolean;
    payrollExpenses: boolean;
  };
  mappings: {
    salaryAccount: string;
    taxAccount: string;
    nssfAccount: string;
    nhifAccount: string;
    deductionsAccount: string;
  };
}

export interface IntegrationLog {
  id: string;
  integrationId: string;
  timestamp: string;
  action: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  data?: Record<string, any>;
  duration: number;
  retryCount: number;
}

export class IntegrationHubService {
  private static integrations: IntegrationConfig[] = [];
  private static paymentProviders: PaymentIntegration[] = [];
  private static governmentSystems: GovernmentIntegration[] = [];
  private static accountingSystems: AccountingIntegration[] = [];
  private static integrationLogs: IntegrationLog[] = [];

  /**
   * Initialize default integrations
   */
  static initializeIntegrations(): void {
    // Initialize payment providers
    this.paymentProviders = [
      {
        id: 'equity_bank_001',
        provider: 'equity_bank',
        name: 'Equity Bank Corporate Banking',
        type: 'bank_transfer',
        status: 'active',
        credentials: {
          apiKey: 'EQB_API_KEY_PLACEHOLDER',
          secretKey: 'EQB_SECRET_PLACEHOLDER',
          endpoint: 'https://api.equitybank.co.ke/v1',
          merchantCode: 'CORP001'
        },
        supportedCurrencies: ['KES', 'USD', 'EUR'],
        transactionLimits: {
          daily: 50000000, // 50M KES
          monthly: 1000000000, // 1B KES
          perTransaction: 10000000 // 10M KES
        },
        fees: {
          percentage: 0.1,
          fixedAmount: 50,
          currency: 'KES'
        }
      },
      {
        id: 'mpesa_001',
        provider: 'mpesa',
        name: 'M-Pesa Business API',
        type: 'mobile_money',
        status: 'active',
        credentials: {
          apiKey: 'MPESA_API_KEY_PLACEHOLDER',
          secretKey: 'MPESA_SECRET_PLACEHOLDER',
          endpoint: 'https://api.safaricom.co.ke/mpesa'
        },
        supportedCurrencies: ['KES'],
        transactionLimits: {
          daily: 1000000, // 1M KES
          monthly: 30000000, // 30M KES
          perTransaction: 150000 // 150K KES
        },
        fees: {
          percentage: 1.5,
          fixedAmount: 0,
          currency: 'KES'
        }
      }
    ];

    // Initialize government systems
    this.governmentSystems = [
      {
        id: 'kra_itax',
        agency: 'KRA',
        name: 'iTax Portal Integration',
        endpoint: 'https://itax.kra.go.ke/api/v1',
        status: 'active',
        lastSubmission: '2024-11-30',
        nextDeadline: '2024-12-09',
        submissionType: 'monthly',
        requiredFields: ['employee_pin', 'gross_pay', 'paye', 'nssf', 'nhif'],
        validationRules: {
          employee_pin: { required: true, pattern: '^[A-Z][0-9]{9}[A-Z]$' },
          gross_pay: { required: true, min: 0 },
          paye: { required: true, min: 0 }
        }
      },
      {
        id: 'nssf_portal',
        agency: 'NSSF',
        name: 'NSSF Employer Portal',
        endpoint: 'https://employer.nssf.or.ke/api',
        status: 'active',
        lastSubmission: '2024-11-30',
        nextDeadline: '2024-12-15',
        submissionType: 'monthly',
        requiredFields: ['employee_number', 'nssf_number', 'gross_pay', 'contribution'],
        validationRules: {
          nssf_number: { required: true, pattern: '^[0-9]{9,12}$' },
          contribution: { required: true, min: 0, max: 2160 }
        }
      }
    ];

    // Initialize accounting systems
    this.accountingSystems = [
      {
        id: 'quickbooks_ke',
        system: 'quickbooks',
        name: 'QuickBooks Kenya',
        version: '2024.1',
        status: 'active',
        syncSettings: {
          chartOfAccounts: true,
          journalEntries: true,
          employeeData: false,
          payrollExpenses: true
        },
        mappings: {
          salaryAccount: '5000-Salaries',
          taxAccount: '2100-PAYE-Payable',
          nssfAccount: '2110-NSSF-Payable',
          nhifAccount: '2120-NHIF-Payable',
          deductionsAccount: '2130-Other-Deductions'
        }
      }
    ];

    // Create integration configs
    this.integrations = [
      ...this.paymentProviders.map(p => ({
        id: p.id,
        name: p.name,
        type: p.type as any,
        status: p.status as any,
        endpoint: p.credentials.endpoint,
        lastSync: new Date().toISOString(),
        syncFrequency: 'daily' as const,
        features: ['payments', 'balance_inquiry', 'transaction_status'],
        errorCount: 0,
        successRate: 98.5
      })),
      ...this.governmentSystems.map(g => ({
        id: g.id,
        name: g.name,
        type: 'government' as const,
        status: g.status as any,
        endpoint: g.endpoint,
        lastSync: g.lastSubmission,
        syncFrequency: g.submissionType === 'monthly' ? 'monthly' as const : 'quarterly' as const,
        features: ['filing', 'validation', 'status_check'],
        errorCount: 0,
        successRate: 99.2
      })),
      ...this.accountingSystems.map(a => ({
        id: a.id,
        name: a.name,
        type: 'accounting' as const,
        status: a.status as any,
        endpoint: 'https://api.accounting-system.com',
        lastSync: new Date().toISOString(),
        syncFrequency: 'daily' as const,
        features: ['journal_entries', 'chart_sync', 'reporting'],
        errorCount: 0,
        successRate: 97.8
      }))
    ];
  }

  /**
   * Get all integrations
   */
  static getIntegrations(): IntegrationConfig[] {
    if (this.integrations.length === 0) {
      this.initializeIntegrations();
    }
    return this.integrations;
  }

  /**
   * Get integration by ID
   */
  static getIntegration(id: string): IntegrationConfig | null {
    return this.getIntegrations().find(integration => integration.id === id) || null;
  }

  /**
   * Test integration connection
   */
  static async testIntegration(id: string): Promise<{ success: boolean; message: string; responseTime: number }> {
    const integration = this.getIntegration(id);
    if (!integration) {
      return { success: false, message: 'Integration not found', responseTime: 0 };
    }

    const startTime = Date.now();
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 500));
      
      const responseTime = Date.now() - startTime;
      const success = Math.random() > 0.1; // 90% success rate
      
      if (success) {
        this.logIntegrationEvent(id, 'test_connection', 'success', 'Connection test successful', responseTime);
        return { success: true, message: 'Connection successful', responseTime };
      } else {
        this.logIntegrationEvent(id, 'test_connection', 'error', 'Connection test failed', responseTime);
        return { success: false, message: 'Connection failed - timeout', responseTime };
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.logIntegrationEvent(id, 'test_connection', 'error', `Connection error: ${error}`, responseTime);
      return { success: false, message: `Connection error: ${error}`, responseTime };
    }
  }

  /**
   * Process bank payments
   */
  static async processBankPayments(
    payrollRecords: any[],
    bankId: string
  ): Promise<{ success: boolean; processedCount: number; failedCount: number; transactionId: string }> {
    const bank = this.paymentProviders.find(p => p.id === bankId);
    if (!bank) {
      throw new Error('Bank integration not found');
    }

    const startTime = Date.now();
    let processedCount = 0;
    let failedCount = 0;
    const transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      // Simulate batch payment processing
      for (const record of payrollRecords) {
        await new Promise(resolve => setTimeout(resolve, 100)); // Simulate processing time
        
        if (Math.random() > 0.05) { // 95% success rate
          processedCount++;
        } else {
          failedCount++;
        }
      }

      const duration = Date.now() - startTime;
      this.logIntegrationEvent(
        bankId,
        'batch_payment',
        failedCount === 0 ? 'success' : 'warning',
        `Processed ${processedCount} payments, ${failedCount} failed`,
        duration,
        { transactionId, totalAmount: payrollRecords.reduce((sum, r) => sum + r.netPay, 0) }
      );

      return { success: true, processedCount, failedCount, transactionId };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logIntegrationEvent(bankId, 'batch_payment', 'error', `Payment processing failed: ${error}`, duration);
      throw error;
    }
  }

  /**
   * Submit to government system
   */
  static async submitToGovernment(
    systemId: string,
    data: Record<string, any>
  ): Promise<{ success: boolean; submissionId: string; validationErrors: string[] }> {
    const system = this.governmentSystems.find(s => s.id === systemId);
    if (!system) {
      throw new Error('Government system not found');
    }

    const startTime = Date.now();
    const submissionId = `SUB_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const validationErrors: string[] = [];

    try {
      // Validate required fields
      for (const field of system.requiredFields) {
        if (!data[field]) {
          validationErrors.push(`Missing required field: ${field}`);
        }
      }

      // Validate field formats
      for (const [field, rules] of Object.entries(system.validationRules)) {
        if (data[field] && rules.pattern) {
          const regex = new RegExp(rules.pattern);
          if (!regex.test(data[field])) {
            validationErrors.push(`Invalid format for field: ${field}`);
          }
        }
      }

      if (validationErrors.length > 0) {
        const duration = Date.now() - startTime;
        this.logIntegrationEvent(
          systemId,
          'submit_data',
          'error',
          `Validation failed: ${validationErrors.join(', ')}`,
          duration
        );
        return { success: false, submissionId, validationErrors };
      }

      // Simulate submission
      await new Promise(resolve => setTimeout(resolve, Math.random() * 3000 + 1000));

      const duration = Date.now() - startTime;
      this.logIntegrationEvent(
        systemId,
        'submit_data',
        'success',
        `Data submitted successfully`,
        duration,
        { submissionId, recordCount: Array.isArray(data.records) ? data.records.length : 1 }
      );

      return { success: true, submissionId, validationErrors: [] };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logIntegrationEvent(systemId, 'submit_data', 'error', `Submission failed: ${error}`, duration);
      throw error;
    }
  }

  /**
   * Sync with accounting system
   */
  static async syncWithAccounting(
    systemId: string,
    journalEntries: any[]
  ): Promise<{ success: boolean; syncedEntries: number; errors: string[] }> {
    const system = this.accountingSystems.find(s => s.id === systemId);
    if (!system) {
      throw new Error('Accounting system not found');
    }

    const startTime = Date.now();
    let syncedEntries = 0;
    const errors: string[] = [];

    try {
      for (const entry of journalEntries) {
        await new Promise(resolve => setTimeout(resolve, 200)); // Simulate sync time
        
        if (Math.random() > 0.02) { // 98% success rate
          syncedEntries++;
        } else {
          errors.push(`Failed to sync entry: ${entry.id}`);
        }
      }

      const duration = Date.now() - startTime;
      this.logIntegrationEvent(
        systemId,
        'sync_journal_entries',
        errors.length === 0 ? 'success' : 'warning',
        `Synced ${syncedEntries} entries, ${errors.length} errors`,
        duration,
        { totalEntries: journalEntries.length, totalAmount: journalEntries.reduce((sum, e) => sum + (e.amount || 0), 0) }
      );

      return { success: true, syncedEntries, errors };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logIntegrationEvent(systemId, 'sync_journal_entries', 'error', `Sync failed: ${error}`, duration);
      throw error;
    }
  }

  /**
   * Get integration status summary
   */
  static getIntegrationSummary(): {
    totalIntegrations: number;
    activeIntegrations: number;
    errorIntegrations: number;
    averageSuccessRate: number;
    lastSyncTime: string;
  } {
    const integrations = this.getIntegrations();
    const totalIntegrations = integrations.length;
    const activeIntegrations = integrations.filter(i => i.status === 'active').length;
    const errorIntegrations = integrations.filter(i => i.status === 'error').length;
    const averageSuccessRate = integrations.reduce((sum, i) => sum + i.successRate, 0) / totalIntegrations;
    const lastSyncTime = Math.max(...integrations.map(i => new Date(i.lastSync).getTime()));

    return {
      totalIntegrations,
      activeIntegrations,
      errorIntegrations,
      averageSuccessRate,
      lastSyncTime: new Date(lastSyncTime).toISOString()
    };
  }

  /**
   * Get integration logs
   */
  static getIntegrationLogs(integrationId?: string, limit: number = 100): IntegrationLog[] {
    let logs = this.integrationLogs;
    
    if (integrationId) {
      logs = logs.filter(log => log.integrationId === integrationId);
    }
    
    return logs
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  /**
   * Update integration configuration
   */
  static updateIntegration(id: string, updates: Partial<IntegrationConfig>): boolean {
    const index = this.integrations.findIndex(i => i.id === id);
    if (index === -1) return false;

    this.integrations[index] = { ...this.integrations[index], ...updates };
    this.logIntegrationEvent(id, 'update_config', 'success', 'Integration configuration updated', 0);
    return true;
  }

  /**
   * Enable/disable integration
   */
  static toggleIntegration(id: string, enabled: boolean): boolean {
    const integration = this.getIntegration(id);
    if (!integration) return false;

    integration.status = enabled ? 'active' : 'inactive';
    this.logIntegrationEvent(
      id,
      enabled ? 'enable' : 'disable',
      'success',
      `Integration ${enabled ? 'enabled' : 'disabled'}`,
      0
    );
    return true;
  }

  /**
   * Log integration event
   */
  private static logIntegrationEvent(
    integrationId: string,
    action: string,
    status: 'success' | 'error' | 'warning',
    message: string,
    duration: number,
    data?: Record<string, any>
  ): void {
    const log: IntegrationLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      integrationId,
      timestamp: new Date().toISOString(),
      action,
      status,
      message,
      data,
      duration,
      retryCount: 0
    };

    this.integrationLogs.unshift(log);

    // Keep only last 10000 logs
    if (this.integrationLogs.length > 10000) {
      this.integrationLogs = this.integrationLogs.slice(0, 10000);
    }

    // Update integration success rate
    const integration = this.getIntegration(integrationId);
    if (integration) {
      if (status === 'error') {
        integration.errorCount++;
        integration.successRate = Math.max(0, integration.successRate - 0.1);
      } else if (status === 'success') {
        integration.successRate = Math.min(100, integration.successRate + 0.05);
      }
    }
  }

  /**
   * Schedule automatic syncs
   */
  static scheduleAutomaticSyncs(): void {
    // Sync every hour for real-time integrations
    setInterval(() => {
      const realTimeIntegrations = this.getIntegrations().filter(i => 
        i.syncFrequency === 'real-time' || i.syncFrequency === 'hourly'
      );
      
      realTimeIntegrations.forEach(async (integration) => {
        try {
          await this.testIntegration(integration.id);
        } catch (error) {
          console.error(`Scheduled sync failed for ${integration.name}:`, error);
        }
      });
    }, 60 * 60 * 1000); // 1 hour

    // Daily sync for daily integrations
    setInterval(() => {
      const dailyIntegrations = this.getIntegrations().filter(i => i.syncFrequency === 'daily');
      
      dailyIntegrations.forEach(async (integration) => {
        try {
          await this.testIntegration(integration.id);
        } catch (error) {
          console.error(`Daily sync failed for ${integration.name}:`, error);
        }
      });
    }, 24 * 60 * 60 * 1000); // 24 hours
  }

  /**
   * Get payment provider capabilities
   */
  static getPaymentProviders(): PaymentIntegration[] {
    return this.paymentProviders;
  }

  /**
   * Get government system configurations
   */
  static getGovernmentSystems(): GovernmentIntegration[] {
    return this.governmentSystems;
  }

  /**
   * Get accounting system configurations
   */
  static getAccountingSystems(): AccountingIntegration[] {
    return this.accountingSystems;
  }
}
