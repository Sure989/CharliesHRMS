import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Bulk employees to seed
const bulkEmployees = [
  { firstName: 'STRIVE', lastName: 'MACHIIRA', email: 'smachiira@charliescorp.co.ke', position: 'MARKETING HEAD' },
  { firstName: 'PAUL', lastName: 'MACHARIA', email: 'pmacharia@charliescorp.co.ke', position: 'FINANCE DEPARTMENT HEAD' },
  { firstName: 'JUNE', lastName: 'NJOROGE', email: 'jnjoroge@charliescorp.co.ke', position: 'CEO' },
  { firstName: 'MARY WANJA', lastName: 'KIBICHO', email: 'mwanja@charliescorp.co.ke', position: 'GENERAL MANAGER' },
  { firstName: 'SOPHIA NYAKERARIO', lastName: 'OMOSA', email: 'snyakerario@charliescorp.co.ke', position: 'OPERATIONS DEPARTMENT HEAD' },
  { firstName: 'PHILLIP', lastName: 'WASONGA', email: 'pwasonga@charliescorp.co.ke', position: 'HR DEPARTMENT HEAD' },
  { firstName: 'WENCESLAUS JUMA', lastName: 'WASIKE', email: 'jwasike@charliescorp.co.ke', position: 'MAINTENANCE DEPARTMENT HEAD' },
  { firstName: 'SUSAN WAIRIMU', lastName: 'GACHANJA', email: 'swairimu@charliescorp.co.ke', position: 'FINANCE MANAGER ASSISTANT' },
  { firstName: 'MARY', lastName: 'THABUKU', email: 'mthabuku@charliescorp.co.ke', position: 'HR MANAGER ASSISTANT' },
  { firstName: 'RAYMOND', lastName: 'BIEGON', email: 'rbiegon@charliescorp.co.ke', position: 'MAINTENANCE DEPARTMENT' },
  { firstName: 'DAVID', lastName: 'KAMAU', email: 'dkamau@charliescorp.co.ke', position: 'OPERATIONS MANAGER ASSISTANT' },
  { firstName: 'EMILY', lastName: 'WANJIRU', email: 'ewanjiru@charliescorp.co.ke', position: 'FOOD SAFETY DEPARTMENT HEAD' },
  { firstName: 'JOSEPHINE', lastName: 'MATU', email: 'jmatu@charliescorp.co.ke', position: 'FINANCE TEAM MEMBER' },
  { firstName: 'FRANCIS', lastName: 'NDUNGU', email: 'fndungu@charliescorp.co.ke', position: 'FINANCE TEAM MEMBER' },
  { firstName: 'LINA', lastName: 'CHRISTINE', email: 'lchristine@charliescorp.co.ke', position: 'HR TEAM MEMBER' },
  { firstName: 'FAITH', lastName: 'MUTHONI', email: 'fmuthoni@charliescorp.co.ke', position: 'HR TEAM MEMBER' },
  { firstName: 'ASHLEY', lastName: 'ALI', email: 'ashley@charliescorp.co.ke', position: 'MARKETING TEAM MEMBER' },
  { firstName: 'SHARON', lastName: 'NYATICH', email: 'snyatich@charliescorp.co.ke', position: 'SOHO BRANCH MANAGER' },
  { firstName: 'ANTHONY', lastName: 'NGILA', email: 'angila@charliescorp.co.ke', position: 'OYSTER BAR BRANCH MANAGER' },
  { firstName: 'FRANCIS', lastName: 'WAMBUA', email: 'fwambua@charliescorp.co.ke', position: 'GEMINI BISTRO BRANCH MANAGER' },
  { firstName: 'VENZA', lastName: 'CENTRA', email: 'vcentra@charliescorp.co.ke', position: 'IBIZA BRANCH MANAGER' },
  { firstName: 'LUCY', lastName: 'WAIRIMU', email: 'lwairimu@charliescorp.co.ke', position: 'RED-ROOM BRANCH MANAGER' },
  { firstName: 'MILLICENT', lastName: 'WAMUYU', email: 'mwamuyu@charliescorp.co.ke', position: 'ASSISTANT RED-ROOM BRANCH MANAGER' },
  { firstName: 'ENOSH', lastName: 'OGEGA', email: 'eogega@charliescorp.co.ke', position: 'ASSISTANT GEMINI BISTRO BRANCH MANAGER' },
  { firstName: 'CAROL', lastName: 'NDIRANGU', email: 'cndirangu@charliescorp.co.ke', position: 'ASSISTANT IBIZA BRANCH MANAGER' },
  { firstName: 'MAXWELL', lastName: 'OUMA', email: 'mouma@charliescorp.co.ke', position: 'ASSISTANT IBIZA BRANCH MANAGER' },
  { firstName: 'PATRICK LISILI', lastName: 'LIKOBELE', email: 'plikobele@charliescorp.co.ke', position: 'ASSISTANT SOHO BRANCH MANAGER' },
  { firstName: 'ARNOLD', lastName: 'SURE', email: 'asure@charliescorp.co.ke', position: 'ASSISTANT SOHO BRANCH MANAGER' },
  { firstName: 'GEORGE', lastName: 'OBIENGE', email: 'gobienge@charliescorp.co.ke', position: 'RED-ROOM BAR MANAGER' },
  { firstName: 'PETER', lastName: 'MBURU', email: 'pmburu@charliescorp.co.ke', position: 'GEMINI BISTRO BAR MANAGER' },
  { firstName: 'COLLINS', lastName: 'AMBOSO', email: 'camboso@charliescorp.co.ke', position: 'IBIZA BAR MANAGER' },
  { firstName: 'COLLET', lastName: 'NDUTA', email: 'cnduta@charliescorp.co.ke', position: 'SOHO BAR MANAGER' },
  { firstName: 'SIMON', lastName: '', email: 'simon@charliescorp.co.ke', position: 'OYSTER BAY BAR MANAGER' },
];

async function main() {
  // === CLEAR EMPLOYEE AND RELATED DATA ===
  // Order matters due to foreign key constraints
  await prisma.salaryAdvanceRequest.deleteMany({});
  await prisma.payroll.deleteMany({});
  await prisma.leaveRequest.deleteMany({});
  await prisma.performanceReview.deleteMany({});
  await prisma.user.updateMany({ data: { employeeId: null } });
  await prisma.employee.deleteMany({});
  console.log('Cleared all employee and related records!');
  console.log('Starting database seeding...');

  // Create default tenant
  const defaultTenant = await prisma.tenant.upsert({
    where: { id: "5bba6f14-accf-4e64-b85c-db4d3fa9c848" },
    update: {},
    create: {
      id: "5bba6f14-accf-4e64-b85c-db4d3fa9c848",
      name: "Charlie's HRMS",
      domain: 'charlieshrms.com', // update this if you have a specific domain
    },
  });
  console.log('Default tenant created:', defaultTenant.name);

  // Create demo users with password123
  const hashedPassword = await bcrypt.hash('password123', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@charlieshrms.com' },
    update: {},
    create: {
      email: 'admin@charlieshrms.com',
      passwordHash: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      status: 'ACTIVE',
      tenantId: "5bba6f14-accf-4e64-b85c-db4d3fa9c848",
    },
  });
  const hrUser = await prisma.user.upsert({
    where: { email: 'hr@charlieshrms.com' },
    update: {},
    create: {
      email: 'hr@charlieshrms.com',
      passwordHash: hashedPassword,
      firstName: 'HR',
      lastName: 'Manager',
      role: 'HR_MANAGER',
      status: 'ACTIVE',
    tenantId: "5bba6f14-accf-4e64-b85c-db4d3fa9c848",
    },
  });
  const opsUser = await prisma.user.upsert({
    where: { email: 'operations@charlieshrms.com' },
    update: {},
    create: {
      email: 'operations@charlieshrms.com',
      passwordHash: hashedPassword,
      firstName: 'Operations',
      lastName: 'Manager',
      role: 'OPERATIONS_MANAGER',
      status: 'ACTIVE',
    tenantId: "5bba6f14-accf-4e64-b85c-db4d3fa9c848",
    },
  });
  const employeeUser = await prisma.user.upsert({
    where: { email: 'employee@charlieshrms.com' },
    update: {},
    create: {
      email: 'employee@charlieshrms.com',
      passwordHash: hashedPassword,
      firstName: 'John',
      lastName: 'Employee',
      role: 'EMPLOYEE',
      status: 'ACTIVE',
    tenantId: "5bba6f14-accf-4e64-b85c-db4d3fa9c848",
    },
  });
  console.log('Demo users created!');

  // === SEED CORE DEPARTMENTS ===
  const departmentNames = [
    'Operations', 'HR', 'Finance', 'Maintenance', 'Marketing', 'Food Safety', 'Senior Management',
  ];
  const departments: Record<string, any> = {};
  for (const name of departmentNames) {
    let dept = await prisma.department.findFirst({ where: { name, tenantId: defaultTenant.id } });
    if (!dept) {
      dept = await prisma.department.create({
        data: {
          name,
          description: `${name} Department`,
    tenantId: "5bba6f14-accf-4e64-b85c-db4d3fa9c848",
          status: 'ACTIVE',
        },
      });
      console.log('Department created:', dept.name);
    }
    departments[name] = dept;
  }

  // === SEED BRANCHES ===
  const branchData = [
    { name: 'SOHO', location: 'SOHO', address: 'SOHO St', managerEmail: 'snyatich@charliescorp.co.ke' },
    { name: 'OYSTER BAR', location: 'OYSTER BAR', address: 'OYSTER BAR St', managerEmail: 'angila@charliescorp.co.ke' },
    { name: 'GEMINI BISTRO', location: 'GEMINI BISTRO', address: 'GEMINI BISTRO St', managerEmail: 'fwambua@charliescorp.co.ke' },
    { name: 'IBIZA', location: 'IBIZA', address: 'IBIZA St', managerEmail: 'vcentra@charliescorp.co.ke' },
    { name: 'RED-ROOM', location: 'RED-ROOM', address: 'RED-ROOM St', managerEmail: 'lwairimu@charliescorp.co.ke' },
  ];
  const users = await prisma.user.findMany({ where: { tenantId: defaultTenant.id } });
  const userMap = Object.fromEntries(users.map(u => [u.email, u]));
  const branches: Record<string, any> = {};
  for (const b of branchData) {
    let branch = await prisma.branch.findFirst({ where: { name: b.name, tenantId: defaultTenant.id } });
    if (!branch) {
      branch = await prisma.branch.create({
        data: {
          name: b.name,
          location: b.location,
          address: b.address,
          managerId: userMap[b.managerEmail]?.id,
          departmentId: departments['Operations'].id,
    tenantId: "5bba6f14-accf-4e64-b85c-db4d3fa9c848",
          status: 'ACTIVE',
        },
      });
      console.log('Branch created:', branch.name);
    }
    branches[b.name] = branch;
  }

  // === BULK EMPLOYEE SEEDING ===
  const departmentEmailMap: Record<string, string> = {
    'smachiira@charliescorp.co.ke': 'Marketing',
    'pmacharia@charliescorp.co.ke': 'Finance',
    'jnjoroge@charliescorp.co.ke': 'Senior Management',
    'mwanja@charliescorp.co.ke': 'Senior Management',
    'snyakerario@charliescorp.co.ke': 'Operations',
    'pwasonga@charliescorp.co.ke': 'HR',
    'jwasike@charliescorp.co.ke': 'Maintenance',
    'swairimu@charliescorp.co.ke': 'Finance',
    'mthabuku@charliescorp.co.ke': 'HR',
    'rbiegon@charliescorp.co.ke': 'Maintenance',
    'dkamau@charliescorp.co.ke': 'Operations',
    'ewanjiru@charliescorp.co.ke': 'Food Safety',
    'jmatu@charliescorp.co.ke': 'Finance',
    'fndungu@charliescorp.co.ke': 'Finance',
    'lchristine@charliescorp.co.ke': 'HR',
    'fmuthoni@charliescorp.co.ke': 'HR',
    'ashley@charliescorp.co.ke': 'Marketing',
    'snyatich@charliescorp.co.ke': 'Operations',
    'angila@charliescorp.co.ke': 'Operations',
    'fwambua@charliescorp.co.ke': 'Operations',
    'vcentra@charliescorp.co.ke': 'Operations',
    'lwairimu@charliescorp.co.ke': 'Operations',
    'mwamuyu@charliescorp.co.ke': 'Operations',
    'eogega@charliescorp.co.ke': 'Operations',
    'cndirangu@charliescorp.co.ke': 'Operations',
    'mouma@charliescorp.co.ke': 'Operations',
    'plikobele@charliescorp.co.ke': 'Operations',
    'asure@charliescorp.co.ke': 'Operations',
    'gobienge@charliescorp.co.ke': 'Operations',
    'pmburu@charliescorp.co.ke': 'Operations',
    'camboso@charliescorp.co.ke': 'Operations',
    'cnduta@charliescorp.co.ke': 'Operations',
    'simon@charliescorp.co.ke': 'Operations',
  };
  const branchEmailMap: Record<string, string> = {
    'snyatich@charliescorp.co.ke': 'SOHO',
    'plikobele@charliescorp.co.ke': 'SOHO',
    'asure@charliescorp.co.ke': 'SOHO',
    'cnduta@charliescorp.co.ke': 'SOHO',
    'angila@charliescorp.co.ke': 'OYSTER BAR',
    'simon@charliescorp.co.ke': 'OYSTER BAR',
    'fwambua@charliescorp.co.ke': 'GEMINI BISTRO',
    'eogega@charliescorp.co.ke': 'GEMINI BISTRO',
    'pmburu@charliescorp.co.ke': 'GEMINI BISTRO',
    'vcentra@charliescorp.co.ke': 'IBIZA',
    'cndirangu@charliescorp.co.ke': 'IBIZA',
    'mouma@charliescorp.co.ke': 'IBIZA',
    'camboso@charliescorp.co.ke': 'IBIZA',
    'lwairimu@charliescorp.co.ke': 'RED-ROOM',
    'mwamuyu@charliescorp.co.ke': 'RED-ROOM',
    'gobienge@charliescorp.co.ke': 'RED-ROOM',
  };
  for (let i = 0; i < bulkEmployees.length; i++) {
    const emp = bulkEmployees[i];
    const deptName = departmentEmailMap[emp.email] || 'Operations';
    const deptId = departments[deptName].id;
    const branchName = branchEmailMap[emp.email];
    const branchId = branchName ? branches[branchName]?.id : undefined;
    const lastEmployee = await prisma.employee.findFirst({ orderBy: { employeeNumber: 'desc' }, select: { employeeNumber: true } });
    let nextNumber = 1;
    if (lastEmployee && lastEmployee.employeeNumber) {
      const lastNum = parseInt(lastEmployee.employeeNumber.replace('EMP', ''), 10);
      nextNumber = lastNum + 1;
    }
    const employeeNumber = `EMP${String(nextNumber).padStart(3, '0')}`;
    const existingEmployee = await prisma.employee.findFirst({
      where: { OR: [ { email: emp.email }, { employeeNumber } ] },
    });
    if (existingEmployee) {
      await prisma.payroll.deleteMany({ where: { employeeId: existingEmployee.id } });
      await prisma.leaveRequest.deleteMany({ where: { employeeId: existingEmployee.id } });
      await prisma.performanceReview.deleteMany({ where: { employeeId: existingEmployee.id } });
      await prisma.salaryAdvanceRequest.deleteMany({ where: { employeeId: existingEmployee.id } });
    }
    await prisma.employee.deleteMany({ where: { OR: [ { email: emp.email }, { employeeNumber } ] } });
    const createdEmployee = await prisma.employee.create({
      data: {
        employeeNumber,
        firstName: emp.firstName,
        lastName: emp.lastName,
        email: emp.email,
        position: emp.position,
        departmentId: deptId,
        branchId: branchId,
        hireDate: new Date('2022-01-01'),
        status: 'ACTIVE',
    tenantId: "5bba6f14-accf-4e64-b85c-db4d3fa9c848",
      },
    });

    // Create or link user for each employee
    await prisma.user.upsert({
      where: { email: emp.email },
      update: {
        employeeId: createdEmployee.id,
      },
      create: {
        email: emp.email,
        passwordHash: hashedPassword,
        firstName: emp.firstName,
        lastName: emp.lastName,
        role: 'EMPLOYEE',
        status: 'ACTIVE',
    tenantId: "5bba6f14-accf-4e64-b85c-db4d3fa9c848",
        employeeId: createdEmployee.id,
      },
    });
  }
  console.log('Bulk employees seeded and linked to users!');

  // === SEED SAMPLE TRAINING DATA ===
  const sampleTrainings = [
    {
      title: 'Workplace Safety Training',
      description: 'Mandatory safety procedures and emergency response.',
      startDate: new Date('2025-07-01'),
      endDate: new Date('2025-07-02'),
      status: 'COMPLETED',
    },
    {
      title: 'Customer Service Excellence',
      description: 'Improving customer interaction and satisfaction.',
      startDate: new Date('2025-07-10'),
      endDate: new Date('2025-07-11'),
      status: 'PLANNED',
    },
    {
      title: 'Food Safety & Hygiene',
      description: 'Best practices for food safety in hospitality.',
      startDate: new Date('2025-07-15'),
      endDate: new Date('2025-07-15'),
      status: 'PLANNED',
    },
    {
      title: 'HR Policy Refresher',
      description: 'Annual HR policy and compliance training.',
      startDate: new Date('2025-08-01'),
      endDate: new Date('2025-08-01'),
      status: 'PLANNED',
    },
  ];
  for (const t of sampleTrainings) {
    await prisma.training.create({
      data: {
        ...t,
    tenantId: "5bba6f14-accf-4e64-b85c-db4d3fa9c848",
      },
    });
  }
  console.log('Sample training data seeded!');

  // === SEED PAYROLL PERIODS & PAYROLLS ===
  const payrollPeriod = await prisma.payrollPeriod.upsert({
    where: { name_tenantId: { name: 'July 2025', tenantId: defaultTenant.id } },
    update: {
      status: 'DRAFT'
    },
    create: {
      name: 'July 2025',
      startDate: new Date('2025-07-01'),
      endDate: new Date('2025-07-31'),
      payDate: new Date('2025-07-31'),
      status: 'DRAFT',
    tenantId: "5bba6f14-accf-4e64-b85c-db4d3fa9c848",
    },
  });
  const seededEmployees = await prisma.employee.findMany({ where: { tenantId: defaultTenant.id } });
  for (const emp of seededEmployees) {
    await prisma.payroll.upsert({
      where: { employeeId_payrollPeriodId: { employeeId: emp.id, payrollPeriodId: payrollPeriod.id } },
      update: {},
      create: {
        employeeId: emp.id,
        payrollPeriodId: payrollPeriod.id,
        basicSalary: emp.salary || 0,
        grossSalary: emp.salary || 0,
        totalDeductions: 0,
        netSalary: emp.salary || 0,
        status: 'DRAFT',
    tenantId: "5bba6f14-accf-4e64-b85c-db4d3fa9c848",
      },
    });
  }
  console.log('Payroll periods and payrolls seeded!');

  // === SEED LEAVE TYPES & LEAVE REQUESTS ===
  const leaveTypes = [
    { name: 'Annual Leave', code: 'AL', color: '#4caf50' },
    { name: 'Sick Leave', code: 'SL', color: '#f44336' },
    { name: 'Maternity Leave', code: 'ML', color: '#2196f3' },
    { name: 'Paternity Leave', code: 'PL', color: '#ff9800' },
    { name: 'Compassionate Leave', code: 'CL', color: '#9c27b0' },
  ];
  const leaveTypeRecords: Record<string, any> = {};
  for (const lt of leaveTypes) {
    const rec = await prisma.leaveType.upsert({
      where: { code_tenantId: { code: lt.code, tenantId: defaultTenant.id } },
      update: {},
      create: { ...lt, tenantId: defaultTenant.id },
    });
    leaveTypeRecords[lt.code] = rec;
  }

  // === SEED LEAVE POLICIES ===
  const today = new Date();
  const leavePolicies = [
    {
      code: 'AL',
      name: 'Annual Leave Policy',
      description: 'Annual leave policy: 21 working days per year, accrues at 1.75 days/month.',
      maxDaysPerYear: 21,
      minDaysNotice: 0,
      maxDaysPerRequest: 21,
      maxCarryForward: 7,
      allowNegativeBalance: false,
      requiresApproval: true,
      autoApprove: false,
      accrualRate: 1.75,
      probationPeriodDays: 0,
    },
    {
      code: 'SL',
      name: 'Sick Leave Policy',
      description: 'Sick leave: 7 days full pay, 7 days half pay per year.',
      maxDaysPerYear: 14,
      minDaysNotice: 0,
      maxDaysPerRequest: 7,
      maxCarryForward: 0,
      allowNegativeBalance: false,
      requiresApproval: true,
      autoApprove: false,
      accrualRate: 0,
      probationPeriodDays: 0,
    },
    {
      code: 'ML',
      name: 'Maternity Leave Policy',
      description: 'Maternity leave: 12 weeks (84 days) paid leave.',
      maxDaysPerYear: 84,
      minDaysNotice: 0,
      maxDaysPerRequest: 84,
      maxCarryForward: 0,
      allowNegativeBalance: false,
      requiresApproval: true,
      autoApprove: false,
      accrualRate: 0,
      probationPeriodDays: 0,
    },
    {
      code: 'PL',
      name: 'Paternity Leave Policy',
      description: 'Paternity leave: 2 weeks (14 days) paid leave.',
      maxDaysPerYear: 14,
      minDaysNotice: 0,
      maxDaysPerRequest: 14,
      maxCarryForward: 0,
      allowNegativeBalance: false,
      requiresApproval: true,
      autoApprove: false,
      accrualRate: 0,
      probationPeriodDays: 0,
    },
    {
      code: 'CL',
      name: 'Compassionate Leave Policy',
      description: 'Compassionate leave: max 15 days per year.',
      maxDaysPerYear: 15,
      minDaysNotice: 0,
      maxDaysPerRequest: 15,
      maxCarryForward: 0,
      allowNegativeBalance: false,
      requiresApproval: true,
      autoApprove: false,
      accrualRate: 0,
      probationPeriodDays: 0,
    },
  ];
  for (const policy of leavePolicies) {
    const leaveType = leaveTypeRecords[policy.code];
    if (!leaveType) continue;
    // Remove 'code' from policy before DB insert/update
    const { code, ...policyData } = policy;
    const existing = await prisma.leavePolicy.findFirst({
      where: {
        leaveTypeId: leaveType.id,
        tenantId: "5bba6f14-accf-4e64-b85c-db4d3fa9c848",
        name: policy.name,
      },
    });
    if (existing) {
      await prisma.leavePolicy.update({
        where: { id: existing.id },
        data: {
          ...policyData,
          leaveTypeId: leaveType.id,
          tenantId: "5bba6f14-accf-4e64-b85c-db4d3fa9c848",
          isActive: true,
          effectiveDate: today,
        },
      });
    } else {
      await prisma.leavePolicy.create({
        data: {
          ...policyData,
          leaveTypeId: leaveType.id,
          tenantId: "5bba6f14-accf-4e64-b85c-db4d3fa9c848",
          isActive: true,
          effectiveDate: today,
        },
      });
    }
  }
  console.log('Leave policies seeded!');
  // Seed a few leave requests for the first 5 employees
  for (let i = 0; i < Math.min(5, seededEmployees.length); i++) {
    await prisma.leaveRequest.create({
      data: {
        employeeId: seededEmployees[i].id,
        leaveTypeId: leaveTypeRecords['AL'].id,
        startDate: new Date('2025-07-10'),
        endDate: new Date('2025-07-15'),
        totalDays: 5,
        status: i % 2 === 0 ? 'APPROVED' : 'PENDING',
        appliedAt: new Date('2025-07-01'),
    tenantId: "5bba6f14-accf-4e64-b85c-db4d3fa9c848",
      },
    });
  }
  console.log('Leave types and leave requests seeded!');

  // === SEED PERFORMANCE REVIEW CYCLES & REVIEWS ===
  const reviewCycle = await prisma.performanceReviewCycle.upsert({
    where: { name_tenantId: { name: 'Mid-Year 2025', tenantId: defaultTenant.id } },
    update: {},
    create: {
      name: 'Mid-Year 2025',
      description: 'Mid-year performance review',
      startDate: new Date('2025-06-01'),
      endDate: new Date('2025-07-31'),
      reviewDeadline: new Date('2025-07-31'),
      status: 'ACTIVE',
    tenantId: "5bba6f14-accf-4e64-b85c-db4d3fa9c848",
    },
  });
  for (let i = 0; i < Math.min(5, seededEmployees.length); i++) {
    await prisma.performanceReview.create({
      data: {
        employeeId: seededEmployees[i].id,
        reviewCycleId: reviewCycle.id,
        reviewerId: adminUser.id,
        status: i % 2 === 0 ? 'COMPLETED' : 'IN_PROGRESS',
        overallRating: 4.0,
        overallComments: 'Good performance',
        createdAt: new Date('2025-07-01'),
    tenantId: "5bba6f14-accf-4e64-b85c-db4d3fa9c848",
      },
    });
  }
  console.log('Performance review cycles and reviews seeded!');

  // === SEED SALARY ADVANCE REQUESTS ===
  for (let i = 0; i < Math.min(3, seededEmployees.length); i++) {
    await prisma.salaryAdvanceRequest.create({
      data: {
        employeeId: seededEmployees[i].id,
        requestedAmount: 10000,
        approvedAmount: i % 2 === 0 ? 10000 : null,
        reason: 'Personal',
        status: i % 2 === 0 ? 'APPROVED' : 'PENDING',
        requestDate: new Date('2025-07-05'),
        tenantId: defaultTenant.id,
      },
    });
  }
  console.log('Salary advance requests seeded!');

  // === SEED INTEGRATIONS ===
  const integrationsSeed = [
    {
      name: 'Payroll API',
      type: 'API',
      status: 'ACTIVE',
      config: { endpoint: 'https://api.payroll.com', apiKey: 'demo-key' },
      successRate: 98.5,
      lastSyncTime: new Date(Date.now() - 3600000), // 1 hour ago
      tenantId: defaultTenant.id,
    },
    {
      name: 'Slack Notifications',
      type: 'WEBHOOK',
      status: 'ACTIVE',
      config: { webhookUrl: 'https://hooks.slack.com/services/demo' },
      successRate: 99.2,
      lastSyncTime: new Date(Date.now() - 1800000), // 30 minutes ago
      tenantId: defaultTenant.id,
    },
    {
      name: 'Email Service',
      type: 'SMTP',
      status: 'INACTIVE',
      config: { host: 'smtp.mail.com', port: 587 },
      successRate: 0.0,
      lastSyncTime: null,
      tenantId: defaultTenant.id,
    },
    {
      name: 'HR Information System',
      type: 'API',
      status: 'ACTIVE',
      config: { endpoint: 'https://hris.company.com/api', version: 'v2' },
      successRate: 95.8,
      lastSyncTime: new Date(Date.now() - 7200000), // 2 hours ago
      tenantId: defaultTenant.id,
    },
    {
      name: 'Teams Webhook',
      type: 'WEBHOOK',
      status: 'ERROR',
      config: { webhookUrl: 'https://company.webhook.office.com/webhookb2/demo' },
      successRate: 45.3,
      lastSyncTime: new Date(Date.now() - 86400000), // 1 day ago
      tenantId: defaultTenant.id,
    },
  ];
  
  const integrations: Array<Awaited<ReturnType<typeof prisma.integration.create>>> = [];
  for (const integData of integrationsSeed) {
    // Check if integration already exists
    const existing = await prisma.integration.findFirst({
      where: {
        name: integData.name,
        tenantId: integData.tenantId,
      }
    });
    
    if (!existing) {
      const created = await prisma.integration.create({ data: integData });
      integrations.push(created);
      console.log(`Created integration: ${integData.name}`);
    } else {
      integrations.push(existing);
      console.log(`Integration already exists: ${integData.name}`);
    }
  }
  console.log('Integrations seeded!');

  // === SEED INTEGRATION LOGS ===
  for (const integ of integrations) {
    // Check if logs already exist for this integration
    const existingLogs = await prisma.integrationLog.findFirst({
      where: {
        integrationId: integ.id,
        tenantId: defaultTenant.id,
      }
    });
    
    if (!existingLogs) {
      await prisma.integrationLog.create({
        data: {
          integrationId: integ.id,
          status: 'SUCCESS',
          message: `Sync completed for ${integ.name}`,
          createdAt: new Date(),
          tenantId: defaultTenant.id,
        },
      });
      await prisma.integrationLog.create({
        data: {
          integrationId: integ.id,
          status: 'FAILURE',
          message: `Sync failed for ${integ.name}`,
          createdAt: new Date(Date.now() - 86400000), // 1 day ago
          tenantId: defaultTenant.id,
        },
      });
      console.log(`Created logs for integration: ${integ.name}`);
    } else {
      console.log(`Logs already exist for integration: ${integ.name}`);
    }
  }
  console.log('Integration logs seeded!');

  // === SEED WORKFLOWS ===
  const workflowsSeed = [
    { name: 'Onboarding Workflow' },
    { name: 'Offboarding Workflow' },
  ];
  const workflows: Array<Awaited<ReturnType<typeof prisma.workflow.create>>> = [];
  for (const wf of workflowsSeed) {
    const created = await prisma.workflow.create({
      data: {
        name: wf.name,
        tenantId: defaultTenant.id,
      },
    });
    workflows.push(created);
  }
  console.log('Workflows seeded!');

  // === SEED WORKFLOW STATS ===
  for (const workflow of workflows) {
    await prisma.workflowStats.create({
      data: {
        workflowId: workflow.id,
        stats: {},
        tenantId: defaultTenant.id,
      },
    });
  }
  console.log('Workflow stats seeded!');

  // === SEED APPROVALS ===
  for (const workflow of workflows) {
    await prisma.approval.create({
      data: {
        workflowId: workflow.id,
        approverId: adminUser.id,
        status: 'PENDING',
        tenantId: defaultTenant.id,
      },
    });
  }
  console.log('Approvals seeded!');

  // === LINK USERS TO EMPLOYEES BY EMAIL ===
  const allEmployees = await prisma.employee.findMany({ where: { tenantId: defaultTenant.id } });
  for (const emp of allEmployees) {
    const user = await prisma.user.findFirst({ where: { email: emp.email, tenantId: defaultTenant.id } });
    if (user && !user.employeeId) {
      await prisma.user.update({ where: { id: user.id }, data: { employeeId: emp.id } });
      console.log(`Linked user ${user.email} to employee ${emp.id}`);
    }
  }

  // === SEED SALARY ADVANCE POLICY ===
  const existingPolicy = await prisma.salaryAdvancePolicy.findFirst({
    where: { tenantId: defaultTenant.id, isActive: true }
  });
  if (!existingPolicy) {
    await prisma.salaryAdvancePolicy.create({
      data: {
        name: 'Monthly Salary Advance Policy',
        description: 'Employees can request up to 25% of their basic salary per month with unlimited requests until limit is reached. All advances are deducted from salary at month end.',
        maxAdvancePercentage: 25,
        maxAdvanceAmount: null, // No fixed cap - only percentage based
        minServiceMonths: 0, // No minimum service requirement
        maxAdvancesPerYear: 999, // Unlimited requests per year
        interestRate: 0, // No interest
        requiresApproval: true, // HR approval required
        autoApprove: false, // Manual approval needed
        isActive: true,
        effectiveDate: new Date(),
        tenantId: defaultTenant.id,
        monthlyDeductionPercentage: 100, // Full deduction at month end
      }
    });
    console.log('Seeded salary advance policy: Monthly advances up to 25% of basic salary!');
  } else {
    console.log('Salary advance policy already exists!');
  }

  console.log('Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
