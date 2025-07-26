# SHA (Social Health Authority) Implementation Readiness

## Current Status (January 2025)

### What We Know
- **SHA has officially replaced NHIF** as Kenya's health insurance authority
- The transition has been announced and SHA is operational
- SHA registration portals are available (sha.go.ke)

### What We Don't Know (Awaiting Official Publication)
- **Contribution rates and payment structures**
- **Payroll deduction formulas and brackets**
- **Employer vs employee contribution splits**
- **Integration requirements for payroll systems**
- **Compliance deadlines and implementation timeline**

## HRMS Readiness Status

### ✅ Completed Preparations
1. **Codebase is SHA-ready**: All payroll logic is centralized and easy to modify
2. **Types are prepared**: Added TODO comments for SHA fields in `payroll.ts`
3. **Engine is modular**: PayrollEngine can easily accommodate new deduction structures
4. **No hardcoded values**: All statutory rates are configurable
5. **Clean architecture**: Removed legacy/US compatibility code

### 🔄 Pending Actions (When SHA Details Are Available)

#### 1. Update Type Definitions (`src/types/payroll.ts`)
```typescript
// Add to KenyanStatutoryDeductions
export interface KenyanStatutoryDeductions {
  paye: number;
  nssf: number;
  sha: number;    // Replace nhif with sha
  total: number;
}

// Add to PayStub
export interface KenyanPayStub {
  // Employee Details
  kraPin: string;
  nssfNumber?: string;
  shaNumber: string;  // Replace nhifNumber with shaNumber
  // ... rest of fields
}
```

#### 2. Update Payroll Engine (`src/services/payrollEngine.ts`)
- Replace `NHIF_BANDS` with `SHA_BANDS` or `SHA_RATES`
- Update contribution calculation methods
- Modify deduction calculation logic
- Update validation rules

#### 3. Update UI Components
- **PayrollReports**: Update statutory deduction displays
- **TaxManagement**: Add SHA management features
- **PayStubViewer**: Replace NHIF with SHA on pay stubs
- **EmployeeCompensation**: Update deduction breakdowns

#### 4. Update API Integration
- Modify payroll service calls to include SHA data
- Update employee records to include SHA numbers
- Ensure backend supports SHA calculations

#### 5. Database Schema Updates
- Add `sha_number` fields to employee records
- Update payroll history tables
- Create migration scripts for NHIF to SHA transition

## Monitoring Strategy

### Official Sources to Monitor
1. **SHA Official Website**: https://sha.go.ke/
2. **Ministry of Health**: https://www.health.go.ke/
3. **Kenya Revenue Authority**: https://www.kra.go.ke/
4. **National Treasury**: https://www.treasury.go.ke/

### Key Information to Watch For
- **Contribution Rate Structures**: Percentage-based vs bracket-based
- **Monthly Premium Amounts**: Fixed amounts or income-based
- **Employer Obligations**: Remittance deadlines and processes
- **Employee Registration**: Required documentation and processes
- **System Integration**: APIs or bulk upload requirements
- **Compliance Penalties**: Late payment fees and consequences

## Implementation Timeline (Once Information Is Available)

### Phase 1: Analysis (1-2 days)
- Review official SHA documentation
- Compare with current NHIF structure
- Identify code changes required
- Plan migration strategy

### Phase 2: Development (3-5 days)
- Update type definitions
- Modify payroll engine calculations
- Update UI components
- Test calculations with sample data

### Phase 3: Testing (2-3 days)
- Unit tests for new calculations
- Integration tests for payroll process
- User acceptance testing
- Performance validation

### Phase 4: Deployment (1-2 days)
- Database migrations
- Code deployment
- User training materials
- Go-live monitoring

## Risk Mitigation

### Potential Challenges
1. **Calculation Complexity**: SHA may use different calculation methods than NHIF
2. **Data Migration**: Transitioning employee records from NHIF to SHA numbers
3. **Compliance Gaps**: Ensuring no payroll processing gaps during transition
4. **User Training**: Staff need to understand new deduction structures

### Mitigation Strategies
1. **Parallel Processing**: Run SHA calculations alongside NHIF until confirmed
2. **Phased Rollout**: Test with small employee groups first
3. **Backup Plans**: Maintain NHIF capability until SHA is fully stable
4. **Documentation**: Create detailed guides for payroll staff

## Current Code Markers

All locations in the codebase that need SHA updates are marked with:
- `TODO: SHA` comments in type definitions
- `TODO: Replace with SHA` comments in calculation logic
- Comments indicating NHIF replacement requirements

## Next Steps

1. **Monitor Official Sources**: Check weekly for SHA rate publications
2. **Stakeholder Communication**: Inform HR and Finance teams about pending changes
3. **Technical Preparation**: Ensure development environment is ready for rapid implementation
4. **User Communication**: Prepare employees for upcoming changes to pay stubs

---

**Last Updated**: January 2025  
**Next Review**: When SHA official rates are published
