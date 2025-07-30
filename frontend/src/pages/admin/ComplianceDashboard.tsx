import React, { useState, useEffect } from 'react';
import { usePolling } from '@/hooks/usePolling';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, XCircle, FileText, Gavel, Lightbulb } from 'lucide-react';
import { adminService, ComplianceOverview, ComplianceViolation, PolicyCompliance } from '@/services/api/admin.service';

const ComplianceDashboard = () => {
  const [complianceOverview, setComplianceOverview] = useState<ComplianceOverview | null>(null);
  const [recentViolations, setRecentViolations] = useState<ComplianceViolation[]>([]);
  const [policyCompliance, setPolicyCompliance] = useState<PolicyCompliance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  usePolling(async () => {
    setLoading(true);
    try {
      const [overview, violations, policies] = await Promise.all([
        adminService.getComplianceOverview(),
        adminService.getComplianceViolations(),
        adminService.getPolicyCompliance()
      ]);
      setComplianceOverview(overview || null);
      setRecentViolations(violations || []);
      setPolicyCompliance(policies || []);
      setError(null);
    } catch (err) {
      setError('Failed to fetch compliance data');
    } finally {
      setLoading(false);
    }
  }, { interval: 30000 });

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'compliant':
      case 'resolved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
      case 'open':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'non-compliant':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Lightbulb className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'compliant':
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'warning':
      case 'open':
        return 'bg-yellow-100 text-yellow-800';
      case 'non-compliant':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Compliance Dashboard</h2>
      <p className="text-muted-foreground">Monitor regulatory compliance and internal policy adherence.</p>

      {loading && (
        <div className="text-center py-8">
          <p>Loading compliance data...</p>
        </div>
      )}

      {error && (
        <Alert>
          <XCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!loading && !error && complianceOverview && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overall Status</CardTitle>
                <Gavel className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold capitalize flex items-center gap-2">
                  {getStatusIcon(complianceOverview.overallStatus)} {complianceOverview.overallStatus}
                </div>
                <p className="text-xs text-muted-foreground">
                  Last Audit: {complianceOverview.lastAuditDate || 'Never'}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Issues</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{complianceOverview.pendingIssues}</div>
                <p className="text-xs text-muted-foreground">Requires immediate attention</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Resolved Issues</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{complianceOverview.resolvedIssues}</div>
                <p className="text-xs text-muted-foreground">In the last 90 days</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Policy Compliance</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{complianceOverview.compliantPolicies}/{complianceOverview.totalPolicies}</div>
                <p className="text-xs text-muted-foreground">Policies compliant</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Compliance Violations</CardTitle>
              <CardDescription>Overview of recent policy breaches and their status.</CardDescription>
            </CardHeader>
            <CardContent>
              {recentViolations.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Policy</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Employee</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentViolations.map((violation) => (
                      <TableRow key={violation.id}>
                        <TableCell className="font-medium">{violation.policy}</TableCell>
                        <TableCell>{violation.date}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(violation.severity)}>{violation.severity}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(violation.status)}>{violation.status}</Badge>
                        </TableCell>
                        <TableCell>{violation.description}</TableCell>
                        <TableCell>{violation.employeeName || 'System'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-4">No recent violations found</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Policy Adherence Overview</CardTitle>
              <CardDescription>Status of adherence to various internal and external policies.</CardDescription>
            </CardHeader>
            <CardContent>
              {policyCompliance.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Policy Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Review</TableHead>
                      <TableHead>Next Review</TableHead>
                      <TableHead>Violations</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {policyCompliance.map((policy) => (
                      <TableRow key={policy.id}>
                        <TableCell className="font-medium">{policy.name}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(policy.status)}>{policy.status}</Badge>
                        </TableCell>
                        <TableCell>{policy.lastReview}</TableCell>
                        <TableCell>{policy.nextReview}</TableCell>
                        <TableCell>{policy.violationCount}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-4">No policies found</p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default ComplianceDashboard;
