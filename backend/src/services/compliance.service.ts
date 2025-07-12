import { prisma } from '../index';

export interface ComplianceOverview {
  overallStatus: 'compliant' | 'warning' | 'non-compliant';
  lastAuditDate: string | null;
  nextAuditDate: string;
  pendingIssues: number;
  resolvedIssues: number;
  totalPolicies: number;
  compliantPolicies: number;
}

export interface ComplianceViolation {
  id: string;
  policy: string;
  date: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Open' | 'Resolved' | 'In Progress';
  description: string;
  employeeId?: string;
  employeeName?: string;
}

export interface PolicyCompliance {
  id: string;
  name: string;
  status: 'Compliant' | 'Warning' | 'Non-Compliant';
  lastReview: string;
  nextReview: string;
  violationCount: number;
}

/**
 * Get compliance overview metrics
 */
export async function getComplianceOverview(tenantId: string): Promise<ComplianceOverview> {
  try {
    // Count total policies (Leave policies + Salary advance policies)
    const [leavePolicies, salaryAdvancePolicies] = await Promise.all([
      prisma.leavePolicy.count({ where: { tenantId, isActive: true } }),
      prisma.salaryAdvancePolicy.count({ where: { tenantId, isActive: true } })
    ]);
    
    const totalPolicies = leavePolicies + salaryAdvancePolicies + 5; // +5 for default HR policies

    // Count recent violations from audit logs (policy violations)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    
    const pendingIssues = await prisma.auditLog.count({
      where: {
        tenantId,
        action: { in: ['POLICY_VIOLATION', 'COMPLIANCE_WARNING', 'SECURITY_BREACH'] },
        createdAt: { gte: thirtyDaysAgo }
      }
    });

    const resolvedIssues = await prisma.auditLog.count({
      where: {
        tenantId,
        action: { in: ['POLICY_VIOLATION_RESOLVED', 'COMPLIANCE_RESOLVED'] },
        createdAt: { gte: ninetyDaysAgo }
      }
    });

    // Calculate compliant policies (simplified logic)
    const violatedPolicies = await prisma.auditLog.groupBy({
      by: ['entity'],
      where: {
        tenantId,
        action: 'POLICY_VIOLATION',
        createdAt: { gte: ninetyDaysAgo }
      }
    });
    
    const compliantPolicies = Math.max(0, totalPolicies - violatedPolicies.length);

    // Get last audit date from audit logs
    const lastAudit = await prisma.auditLog.findFirst({
      where: {
        tenantId,
        action: 'COMPLIANCE_AUDIT'
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate next audit date (annual)
    const nextAuditDate = new Date();
    if (lastAudit) {
      nextAuditDate.setTime(lastAudit.createdAt.getTime() + 365 * 24 * 60 * 60 * 1000);
    } else {
      nextAuditDate.setTime(Date.now() + 365 * 24 * 60 * 60 * 1000);
    }

    // Determine overall status
    let overallStatus: 'compliant' | 'warning' | 'non-compliant' = 'compliant';
    const complianceRate = totalPolicies > 0 ? (compliantPolicies / totalPolicies) : 1;
    
    if (complianceRate < 0.7 || pendingIssues > 5) {
      overallStatus = 'non-compliant';
    } else if (complianceRate < 0.9 || pendingIssues > 2) {
      overallStatus = 'warning';
    }

    return {
      overallStatus,
      lastAuditDate: lastAudit?.createdAt?.toISOString().split('T')[0] || null,
      nextAuditDate: nextAuditDate.toISOString().split('T')[0],
      pendingIssues,
      resolvedIssues,
      totalPolicies,
      compliantPolicies
    };
  } catch (error) {
    console.error('Error fetching compliance overview:', error);
    // Return safe defaults
    return {
      overallStatus: 'warning',
      lastAuditDate: null,
      nextAuditDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      pendingIssues: 0,
      resolvedIssues: 0,
      totalPolicies: 5,
      compliantPolicies: 4
    };
  }
}

/**
 * Get recent compliance violations
 */
export async function getComplianceViolations(tenantId: string, limit = 10): Promise<ComplianceViolation[]> {
  try {
    const violations = await prisma.auditLog.findMany({
      where: {
        tenantId,
        action: { in: ['POLICY_VIOLATION', 'COMPLIANCE_WARNING', 'SECURITY_BREACH'] }
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    return violations.map(violation => {
      // Extract severity from action or details
      let severity: 'Low' | 'Medium' | 'High' | 'Critical' = 'Medium';
      if (violation.action === 'SECURITY_BREACH') severity = 'Critical';
      else if (violation.action === 'POLICY_VIOLATION') severity = 'High';
      else if (violation.action === 'COMPLIANCE_WARNING') severity = 'Medium';

      // Determine status (simplified logic)
      const status = violation.createdAt < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) 
        ? 'Resolved' 
        : 'Open';

      return {
        id: violation.id,
        policy: violation.entity || 'General Policy',
        date: violation.createdAt.toISOString().split('T')[0],
        severity,
        status,
        description: typeof violation.details === 'object' && violation.details 
          ? JSON.stringify(violation.details) 
          : 'Policy violation detected',
        employeeId: violation.userId || undefined,
        employeeName: violation.user 
          ? `${violation.user.firstName} ${violation.user.lastName}` 
          : undefined
      };
    });
  } catch (error) {
    console.error('Error fetching compliance violations:', error);
    return [];
  }
}

/**
 * Get policy compliance status
 */
export async function getPolicyCompliance(tenantId: string): Promise<PolicyCompliance[]> {
  try {
    const [leavePolicies, salaryAdvancePolicies] = await Promise.all([
      prisma.leavePolicy.findMany({
        where: { tenantId, isActive: true },
        select: { id: true, name: true, createdAt: true, updatedAt: true }
      }),
      prisma.salaryAdvancePolicy.findMany({
        where: { tenantId, isActive: true },
        select: { id: true, name: true, createdAt: true, updatedAt: true }
      })
    ]);

    const policies = [
      ...leavePolicies.map(p => ({ ...p, type: 'leave' })),
      ...salaryAdvancePolicies.map(p => ({ ...p, type: 'salary_advance' })),
      // Add default HR policies
      {
        id: 'hr_policy_1',
        name: 'Code of Conduct',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-06-01'),
        type: 'hr'
      },
      {
        id: 'hr_policy_2',
        name: 'Data Privacy Policy',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-05-01'),
        type: 'hr'
      },
      {
        id: 'hr_policy_3',
        name: 'Workplace Safety Guidelines',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-04-10'),
        type: 'hr'
      },
      {
        id: 'hr_policy_4',
        name: 'Anti-Discrimination Policy',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-03-15'),
        type: 'hr'
      }
    ];

    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    const policyCompliance = await Promise.all(
      policies.map(async (policy) => {
        // Count violations for this policy
        const violationCount = await prisma.auditLog.count({
          where: {
            tenantId,
            action: 'POLICY_VIOLATION',
            entity: policy.name,
            createdAt: { gte: ninetyDaysAgo }
          }
        });

        // Determine compliance status
        let status: 'Compliant' | 'Warning' | 'Non-Compliant' = 'Compliant';
        if (violationCount > 5) {
          status = 'Non-Compliant';
        } else if (violationCount > 2) {
          status = 'Warning';
        }

        // Calculate next review date (annual)
        const nextReview = new Date(policy.updatedAt);
        nextReview.setFullYear(nextReview.getFullYear() + 1);

        return {
          id: policy.id,
          name: policy.name,
          status,
          lastReview: policy.updatedAt.toISOString().split('T')[0],
          nextReview: nextReview.toISOString().split('T')[0],
          violationCount
        };
      })
    );

    return policyCompliance;
  } catch (error) {
    console.error('Error fetching policy compliance:', error);
    return [];
  }
}
