# Frontend to Backend Migration Plan

## Overview
This document outlines the comprehensive plan for migrating the frontend to use strictly backend data instead of mock data.

## Current State Assessment

### ✅ Completed
1. **Mock Data Files Cleaned**: 
   - `src/utils/mock-data.ts` - Emptied with placeholder functions
   - `src/utils/kenyanMockData.ts` - Emptied with placeholder functions

2. **API Infrastructure in Place**:
   - Well-structured API services in `src/services/api/`
   - Robust `apiClient.ts` with error handling and token management
   - Service files for different domains (auth, employee, leave, payroll, etc.)

3. **UnifiedApi.ts Migration Started**:
   - Created new implementation that maps to real API services
   - Fixed auth methods to use correct service methods
   - Implemented leave request workflow methods
   - Implemented salary advance workflow methods

### ❌ Remaining Issues

#### Type Compatibility Issues
1. **Employee Service**: 
   - `getAll()` method doesn't exist, should use `getEmployees()`
   - Need to handle the response structure correctly

2. **Leave Request Types**:
   - `leaveTypeId` property doesn't exist in LeaveRequest type
   - Need to remove or map correctly

3. **Salary Advance Types**:
   - API response types don't match frontend types
   - `amount` property missing in API response types
   - ID type mismatches (string vs number)

4. **Payroll Service Methods**:
   - Several methods don't exist or have different signatures
   - Response structures don't match expected types

## Migration Strategy

### Phase 1: Fix Type Compatibility Issues

#### 1.1 Update Employee Service Usage
```typescript
// Current (broken):
const employees = await realApi.employees.getAll();

// Fix to:
const response = await realApi.employees.getEmployees();
const employees = response.data || [];
```

#### 1.2 Fix Leave Request Types
- Remove `leaveTypeId` from LeaveRequest type mappings
- Use only `leaveType` (string) as per the actual type definition

#### 1.3 Fix Salary Advance Types
- Create proper type mappings between API response and frontend types
- Handle ID type conversions (string to number where needed)
- Map API response properties to frontend properties correctly

#### 1.4 Fix Payroll Service Methods
- Check actual payroll service methods and signatures
- Update method calls to match actual API
- Handle response structures correctly

### Phase 2: Component Migration

#### 2.1 Update Components Using UnifiedApi
1. **WorkflowTestDashboard.tsx**:
   - Already imports from unifiedApi
   - Should work once type issues are resolved

2. **Other Components**:
   - Identify components still using mock data
   - Update imports to use real API services
   - Test functionality with real backend

#### 2.2 Remove Mock Data Dependencies
1. **Search for Mock Data Usage**:
   ```bash
   grep -r "mock" src/ --include="*.ts" --include="*.tsx"
   ```

2. **Update Imports**:
   - Replace mock data imports with real API calls
   - Update component logic to handle real data structures

### Phase 3: Testing and Validation

#### 3.1 Component Testing
- Test each component with real backend data
- Verify workflows function correctly
- Check error handling

#### 3.2 Integration Testing
- Test complete workflows end-to-end
- Verify data consistency
- Test error scenarios

### Phase 4: Cleanup

#### 4.1 Remove Unused Mock Files
- Delete or minimize mock data files
- Remove unused mock functions
- Clean up imports

#### 4.2 Documentation Update
- Update component documentation
- Update API usage documentation
- Create migration notes

## Implementation Priority

### High Priority (Fix Immediately)
1. Fix type errors in unifiedApi.ts
2. Update employee service usage
3. Fix leave request type mappings
4. Fix salary advance type mappings

### Medium Priority
1. Update payroll service method calls
2. Test WorkflowTestDashboard component
3. Identify other components using mock data

### Low Priority
1. Clean up unused mock files
2. Update documentation
3. Performance optimization

## Technical Debt

### Current Issues
1. **Type Safety**: Many type assertions and `any` types used
2. **Error Handling**: Inconsistent error handling across services
3. **Response Mapping**: Manual mapping between API and frontend types

### Recommendations
1. **Create Type Adapters**: Build adapter functions to map between API and frontend types
2. **Standardize Error Handling**: Create consistent error handling patterns
3. **Add Validation**: Add runtime validation for API responses
4. **Create Mock Mode**: Keep mock mode for development/testing

## Next Steps

1. **Immediate**: Fix type errors in unifiedApi.ts
2. **Short-term**: Test with real backend and fix integration issues
3. **Medium-term**: Migrate remaining components
4. **Long-term**: Optimize and clean up codebase

## Success Criteria

- [ ] No TypeScript errors in unifiedApi.ts
- [ ] All components use real backend data
- [ ] No mock data imports in production code
- [ ] All workflows function correctly with real data
- [ ] Error handling works properly
- [ ] Performance is acceptable

## Risk Mitigation

1. **Backup Strategy**: Keep mock data as fallback during migration
2. **Feature Flags**: Use feature flags to toggle between mock and real data
3. **Gradual Migration**: Migrate components one by one
4. **Testing**: Comprehensive testing at each step
