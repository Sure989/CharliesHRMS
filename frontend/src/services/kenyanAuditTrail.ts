
export interface AuditEvent {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: string;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  entityName?: string;
  changes?: AuditChange[];
  metadata?: Record<string, any>;
  ipAddress: string;
  userAgent?: string;
  sessionId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'payroll' | 'employee' | 'tax' | 'compliance' | 'security' | 'system';
  description: string;
  outcome: 'success' | 'failure' | 'partial';
  errorMessage?: string;
}

export type AuditAction = 
  | 'create' | 'update' | 'delete' | 'view' | 'export' | 'import'
  | 'calculate' | 'approve' | 'reject' | 'process' | 'submit'
  | 'login' | 'logout' | 'password_change' | 'permission_change'
  | 'backup' | 'restore' | 'configuration_change';

export type AuditEntityType = 
  | 'payroll_period' | 'employee' | 'payroll_record' | 'pay_stub'
  | 'tax_settings' | 'deduction' | 'payment' | 'user' | 'role'
  | 'regulatory_update' | 'report' | 'system_setting';

export interface AuditChange {
  field: string;
  oldValue: any;
  newValue: any;
  fieldType: 'string' | 'number' | 'boolean' | 'object' | 'array';
}

export interface AuditQuery {
  startDate?: string;
  endDate?: string;
  userId?: string;
  entityType?: AuditEntityType;
  action?: AuditAction;
  severity?: string[];
  category?: string[];
  outcome?: string[];
  searchTerm?: string;
  limit?: number;
  offset?: number;
}

export interface AuditSummary {
  totalEvents: number;
  criticalEvents: number;
  failedEvents: number;
  uniqueUsers: number;
  topActions: { action: string; count: number }[];
  topEntities: { entityType: string; count: number }[];
  complianceScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export class KenyanAuditTrailService {
  private static auditEvents: AuditEvent[] = [];
  private static readonly MAX_EVENTS = 100000; // Keep last 100k events in memory
  private static readonly RETENTION_DAYS = 2555; // 7 years for compliance

  /**
   * Log an audit event
   */
  static async logEvent(event: Omit<AuditEvent, 'id' | 'timestamp'>): Promise<void> {
    const auditEvent: AuditEvent = {
      id: this.generateEventId(),
      timestamp: new Date().toISOString(),
      ...event
    };

    // Add to in-memory storage
    this.auditEvents.unshift(auditEvent);

    // Maintain size limit
    if (this.auditEvents.length > this.MAX_EVENTS) {
      this.auditEvents = this.auditEvents.slice(0, this.MAX_EVENTS);
    }

    // In a real implementation, this would also:
    // 1. Store in database
    // 2. Send to external audit system
    // 3. Trigger alerts for critical events
    // 4. Encrypt sensitive data

    // Check for critical events that need immediate attention
    if (auditEvent.severity === 'critical') {
      await this.handleCriticalEvent(auditEvent);
    }

    console.log('Audit event logged:', auditEvent);
  }

  /**
   * Log payroll calculation event
   */
  static async logPayrollCalculation(
    userId: string,
    userName: string,
    payrollPeriodId: string,
    employeeCount: number,
    totalGrossPay: number,
    ipAddress: string,
    sessionId: string
  ): Promise<void> {
    await this.logEvent({
      userId,
      userName,
      userRole: 'payroll_admin',
      action: 'calculate',
      entityType: 'payroll_period',
      entityId: payrollPeriodId,
      entityName: `Payroll Period ${payrollPeriodId}`,
      metadata: {
        employeeCount,
        totalGrossPay,
        calculationEngine: 'PayrollEngine'
      },
      ipAddress,
      sessionId,
      severity: 'medium',
      category: 'payroll',
      description: `Calculated payroll for ${employeeCount} employees with total gross pay of KSH ${totalGrossPay.toLocaleString()}`,
      outcome: 'success'
    });
  }

  /**
   * Log employee data changes
   */
  static async logEmployeeChange(
    userId: string,
    userName: string,
    employeeId: string,
    employeeName: string,
    changes: AuditChange[],
    ipAddress: string,
    sessionId: string
  ): Promise<void> {
    const hasSensitiveChanges = changes.some(change => 
      ['salary', 'bankAccount', 'kraPin', 'nssfNumber', 'nhifNumber'].includes(change.field)
    );

    await this.logEvent({
      userId,
      userName,
      userRole: 'hr_admin',
      action: 'update',
      entityType: 'employee',
      entityId: employeeId,
      entityName: employeeName,
      changes,
      ipAddress,
      sessionId,
      severity: hasSensitiveChanges ? 'high' : 'medium',
      category: 'employee',
      description: `Updated employee ${employeeName} - ${changes.length} field(s) changed`,
      outcome: 'success'
    });
  }

  /**
   * Log tax settings changes
   */
  static async logTaxSettingsChange(
    userId: string,
    userName: string,
    settingType: string,
    changes: AuditChange[],
    ipAddress: string,
    sessionId: string
  ): Promise<void> {
    await this.logEvent({
      userId,
      userName,
      userRole: 'system_admin',
      action: 'configuration_change',
      entityType: 'tax_settings',
      entityId: settingType,
      entityName: `Tax Settings - ${settingType}`,
      changes,
      ipAddress,
      sessionId,
      severity: 'critical',
      category: 'tax',
      description: `Modified tax settings for ${settingType}`,
      outcome: 'success'
    });
  }

  /**
   * Log payment processing
   */
  static async logPaymentProcessing(
    userId: string,
    userName: string,
    payrollPeriodId: string,
    paymentMethod: string,
    totalAmount: number,
    employeeCount: number,
    ipAddress: string,
    sessionId: string,
    outcome: 'success' | 'failure' | 'partial',
    errorMessage?: string
  ): Promise<void> {
    await this.logEvent({
      userId,
      userName,
      userRole: 'payroll_admin',
      action: 'process',
      entityType: 'payment',
      entityId: payrollPeriodId,
      entityName: `Payment Batch ${payrollPeriodId}`,
      metadata: {
        paymentMethod,
        totalAmount,
        employeeCount,
        processingDate: new Date().toISOString()
      },
      ipAddress,
      sessionId,
      severity: outcome === 'failure' ? 'critical' : 'high',
      category: 'payroll',
      description: `Processed payments for ${employeeCount} employees totaling KSH ${totalAmount.toLocaleString()}`,
      outcome,
      errorMessage
    });
  }

  /**
   * Log regulatory compliance events
   */
  static async logComplianceEvent(
    userId: string,
    userName: string,
    complianceType: string,
    action: string,
    details: Record<string, any>,
    ipAddress: string,
    sessionId: string
  ): Promise<void> {
    await this.logEvent({
      userId,
      userName,
      userRole: 'compliance_officer',
      action: action as AuditAction,
      entityType: 'regulatory_update',
      entityId: complianceType,
      entityName: `Compliance - ${complianceType}`,
      metadata: details,
      ipAddress,
      sessionId,
      severity: 'high',
      category: 'compliance',
      description: `${action} for ${complianceType} compliance`,
      outcome: 'success'
    });
  }

  /**
   * Log security events
   */
  static async logSecurityEvent(
    userId: string,
    userName: string,
    securityAction: string,
    details: Record<string, any>,
    ipAddress: string,
    sessionId: string,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): Promise<void> {
    await this.logEvent({
      userId,
      userName,
      userRole: 'user',
      action: securityAction as AuditAction,
      entityType: 'user',
      entityId: userId,
      entityName: userName,
      metadata: details,
      ipAddress,
      sessionId,
      severity,
      category: 'security',
      description: `Security event: ${securityAction}`,
      outcome: 'success'
    });
  }

  /**
   * Query audit events
   */
  static queryEvents(query: AuditQuery): { events: AuditEvent[]; total: number } {
    let filteredEvents = [...this.auditEvents];

    // Apply filters
    if (query.startDate) {
      const startDate = new Date(query.startDate);
      filteredEvents = filteredEvents.filter(event => 
        new Date(event.timestamp) >= startDate
      );
    }

    if (query.endDate) {
      const endDate = new Date(query.endDate);
      filteredEvents = filteredEvents.filter(event => 
        new Date(event.timestamp) <= endDate
      );
    }

    if (query.userId) {
      filteredEvents = filteredEvents.filter(event => 
        event.userId === query.userId
      );
    }

    if (query.entityType) {
      filteredEvents = filteredEvents.filter(event => 
        event.entityType === query.entityType
      );
    }

    if (query.action) {
      filteredEvents = filteredEvents.filter(event => 
        event.action === query.action
      );
    }

    if (query.severity && query.severity.length > 0) {
      filteredEvents = filteredEvents.filter(event => 
        query.severity!.includes(event.severity)
      );
    }

    if (query.category && query.category.length > 0) {
      filteredEvents = filteredEvents.filter(event => 
        query.category!.includes(event.category)
      );
    }

    if (query.outcome && query.outcome.length > 0) {
      filteredEvents = filteredEvents.filter(event => 
        query.outcome!.includes(event.outcome)
      );
    }

    if (query.searchTerm) {
      const searchTerm = query.searchTerm.toLowerCase();
      filteredEvents = filteredEvents.filter(event => 
        event.description.toLowerCase().includes(searchTerm) ||
        event.userName.toLowerCase().includes(searchTerm) ||
        (event.entityName && event.entityName.toLowerCase().includes(searchTerm))
      );
    }

    const total = filteredEvents.length;

    // Apply pagination
    const offset = query.offset || 0;
    const limit = query.limit || 50;
    const paginatedEvents = filteredEvents.slice(offset, offset + limit);

    return {
      events: paginatedEvents,
      total
    };
  }

  /**
   * Generate audit summary
   */
  static generateSummary(days: number = 30): AuditSummary {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const recentEvents = this.auditEvents.filter(event => 
      new Date(event.timestamp) >= cutoffDate
    );

    const totalEvents = recentEvents.length;
    const criticalEvents = recentEvents.filter(e => e.severity === 'critical').length;
    const failedEvents = recentEvents.filter(e => e.outcome === 'failure').length;
    const uniqueUsers = new Set(recentEvents.map(e => e.userId)).size;

    // Calculate top actions
    const actionCounts = recentEvents.reduce((acc, event) => {
      acc[event.action] = (acc[event.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topActions = Object.entries(actionCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([action, count]) => ({ action, count }));

    // Calculate top entities
    const entityCounts = recentEvents.reduce((acc, event) => {
      acc[event.entityType] = (acc[event.entityType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topEntities = Object.entries(entityCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([entityType, count]) => ({ entityType, count }));

    // Calculate compliance score (0-100)
    const complianceScore = Math.max(0, 100 - (criticalEvents * 10) - (failedEvents * 5));

    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (criticalEvents > 10 || failedEvents > 20) {
      riskLevel = 'critical';
    } else if (criticalEvents > 5 || failedEvents > 10) {
      riskLevel = 'high';
    } else if (criticalEvents > 0 || failedEvents > 5) {
      riskLevel = 'medium';
    }

    return {
      totalEvents,
      criticalEvents,
      failedEvents,
      uniqueUsers,
      topActions,
      topEntities,
      complianceScore,
      riskLevel
    };
  }

  /**
   * Export audit trail for compliance
   */
  static exportAuditTrail(
    startDate: string,
    endDate: string,
    format: 'json' | 'csv' | 'pdf' = 'json'
  ): string {
    const query: AuditQuery = { startDate, endDate };
    const { events } = this.queryEvents(query);

    switch (format) {
      case 'json':
        return JSON.stringify(events, null, 2);
      
      case 'csv':
        return this.convertToCSV(events);
      
      case 'pdf':
        // In a real implementation, this would generate a PDF
        return 'PDF export not implemented in demo';
      
      default:
        return JSON.stringify(events, null, 2);
    }
  }

  /**
   * Handle critical audit events
   */
  private static async handleCriticalEvent(event: AuditEvent): Promise<void> {
    // In a real implementation, this would:
    // 1. Send immediate alerts to administrators
    // 2. Log to external security systems
    // 3. Trigger automated responses if needed
    // 4. Create incident tickets

    console.warn('CRITICAL AUDIT EVENT:', event);

    // Simulate alert notification
    if (typeof window !== 'undefined') {
      // Browser environment - could show notification
      console.log('Would send browser notification for critical event');
    }
  }

  /**
   * Generate unique event ID
   */
  private static generateEventId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Convert events to CSV format
   */
  private static convertToCSV(events: AuditEvent[]): string {
    if (events.length === 0) return '';

    const headers = [
      'ID', 'Timestamp', 'User ID', 'User Name', 'Action', 'Entity Type',
      'Entity ID', 'Severity', 'Category', 'Description', 'Outcome', 'IP Address'
    ];

    const csvRows = [
      headers.join(','),
      ...events.map(event => [
        event.id,
        event.timestamp,
        event.userId,
        event.userName,
        event.action,
        event.entityType,
        event.entityId,
        event.severity,
        event.category,
        `"${event.description.replace(/"/g, '""')}"`,
        event.outcome,
        event.ipAddress
      ].join(','))
    ];

    return csvRows.join('\n');
  }

  /**
   * Clean up old audit events (for memory management)
   */
  static cleanupOldEvents(): void {
    const retentionDate = new Date();
    retentionDate.setDate(retentionDate.getDate() - this.RETENTION_DAYS);

    const initialCount = this.auditEvents.length;
    this.auditEvents = this.auditEvents.filter(event => 
      new Date(event.timestamp) >= retentionDate
    );

    const removedCount = initialCount - this.auditEvents.length;
    if (removedCount > 0) {
      console.log(`Cleaned up ${removedCount} old audit events`);
    }
  }

  /**
   * Get audit statistics for dashboard
   */
  static getAuditStats(): {
    totalEvents: number;
    todayEvents: number;
    criticalEvents: number;
    lastEventTime: string;
  } {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayEvents = this.auditEvents.filter(event => 
      new Date(event.timestamp) >= today
    ).length;

    const criticalEvents = this.auditEvents.filter(event => 
      event.severity === 'critical'
    ).length;

    const lastEventTime = this.auditEvents.length > 0 
      ? this.auditEvents[0].timestamp 
      : '';

    return {
      totalEvents: this.auditEvents.length,
      todayEvents,
      criticalEvents,
      lastEventTime
    };
  }
}
