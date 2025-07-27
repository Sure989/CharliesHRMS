-- Supabase Seed File for CharliesHRMS
-- Clear existing data safely (ignore if tables don't exist)
DO $$ 
BEGIN
    -- Clear data in dependency order, ignore errors if tables don't exist
    BEGIN TRUNCATE TABLE salary_advance_requests CASCADE; EXCEPTION WHEN undefined_table THEN NULL; END;
    BEGIN TRUNCATE TABLE payrolls CASCADE; EXCEPTION WHEN undefined_table THEN NULL; END;
    BEGIN TRUNCATE TABLE leave_requests CASCADE; EXCEPTION WHEN undefined_table THEN NULL; END;
    BEGIN TRUNCATE TABLE performance_reviews CASCADE; EXCEPTION WHEN undefined_table THEN NULL; END;
    BEGIN TRUNCATE TABLE integration_logs CASCADE; EXCEPTION WHEN undefined_table THEN NULL; END;
    BEGIN TRUNCATE TABLE integrations CASCADE; EXCEPTION WHEN undefined_table THEN NULL; END;
    BEGIN TRUNCATE TABLE workflow_stats CASCADE; EXCEPTION WHEN undefined_table THEN NULL; END;
    BEGIN TRUNCATE TABLE approvals CASCADE; EXCEPTION WHEN undefined_table THEN NULL; END;
    BEGIN TRUNCATE TABLE workflows CASCADE; EXCEPTION WHEN undefined_table THEN NULL; END;
    BEGIN TRUNCATE TABLE leave_policies CASCADE; EXCEPTION WHEN undefined_table THEN NULL; END;
    BEGIN TRUNCATE TABLE leave_types CASCADE; EXCEPTION WHEN undefined_table THEN NULL; END;
    BEGIN TRUNCATE TABLE performance_review_cycles CASCADE; EXCEPTION WHEN undefined_table THEN NULL; END;
    BEGIN TRUNCATE TABLE payroll_periods CASCADE; EXCEPTION WHEN undefined_table THEN NULL; END;
    BEGIN TRUNCATE TABLE salary_advance_policies CASCADE; EXCEPTION WHEN undefined_table THEN NULL; END;
    BEGIN TRUNCATE TABLE trainings CASCADE; EXCEPTION WHEN undefined_table THEN NULL; END;
    BEGIN TRUNCATE TABLE employees CASCADE; EXCEPTION WHEN undefined_table THEN NULL; END;
    BEGIN TRUNCATE TABLE users CASCADE; EXCEPTION WHEN undefined_table THEN NULL; END;
    BEGIN TRUNCATE TABLE branches CASCADE; EXCEPTION WHEN undefined_table THEN NULL; END;
    BEGIN TRUNCATE TABLE departments CASCADE; EXCEPTION WHEN undefined_table THEN NULL; END;
    BEGIN TRUNCATE TABLE tenants CASCADE; EXCEPTION WHEN undefined_table THEN NULL; END;
END $$;

-- Create default tenant
INSERT INTO tenants (id, name, domain, created_at, updated_at) VALUES 
('5bba6f14-accf-4e64-b85c-db4d3fa9c848', 'Charlie''s HRMS', 'charlieshrms.com', NOW(), NOW());

-- Create demo users (password: password123, hashed with bcrypt)
INSERT INTO users (id, email, password_hash, first_name, last_name, role, status, tenant_id, created_at, updated_at) VALUES 
(gen_random_uuid(), 'admin@charlieshrms.com', '$2b$10$rOj0YXglNkf5W4rD5n9MaeZX4vy1vq4nM8lYvB5wF5pKq4y2X.GZe', 'Admin', 'User', 'ADMIN', 'ACTIVE', '5bba6f14-accf-4e64-b85c-db4d3fa9c848', NOW(), NOW()),
(gen_random_uuid(), 'hr@charlieshrms.com', '$2b$10$rOj0YXglNkf5W4rD5n9MaeZX4vy1vq4nM8lYvB5wF5pKq4y2X.GZe', 'HR', 'Manager', 'HR_MANAGER', 'ACTIVE', '5bba6f14-accf-4e64-b85c-db4d3fa9c848', NOW(), NOW()),
(gen_random_uuid(), 'operations@charlieshrms.com', '$2b$10$rOj0YXglNkf5W4rD5n9MaeZX4vy1vq4nM8lYvB5wF5pKq4y2X.GZe', 'Operations', 'Manager', 'OPERATIONS_MANAGER', 'ACTIVE', '5bba6f14-accf-4e64-b85c-db4d3fa9c848', NOW(), NOW()),
(gen_random_uuid(), 'employee@charlieshrms.com', '$2b$10$rOj0YXglNkf5W4rD5n9MaeZX4vy1vq4nM8lYvB5wF5pKq4y2X.GZe', 'John', 'Employee', 'EMPLOYEE', 'ACTIVE', '5bba6f14-accf-4e64-b85c-db4d3fa9c848', NOW(), NOW());

-- Create departments
INSERT INTO departments (id, name, description, tenant_id, status, created_at, updated_at) VALUES 
(gen_random_uuid(), 'Operations', 'Operations Department', '5bba6f14-accf-4e64-b85c-db4d3fa9c848', 'ACTIVE', NOW(), NOW()),
(gen_random_uuid(), 'HR', 'HR Department', '5bba6f14-accf-4e64-b85c-db4d3fa9c848', 'ACTIVE', NOW(), NOW()),
(gen_random_uuid(), 'Finance', 'Finance Department', '5bba6f14-accf-4e64-b85c-db4d3fa9c848', 'ACTIVE', NOW(), NOW()),
(gen_random_uuid(), 'Maintenance', 'Maintenance Department', '5bba6f14-accf-4e64-b85c-db4d3fa9c848', 'ACTIVE', NOW(), NOW()),
(gen_random_uuid(), 'Marketing', 'Marketing Department', '5bba6f14-accf-4e64-b85c-db4d3fa9c848', 'ACTIVE', NOW(), NOW()),
(gen_random_uuid(), 'Food Safety', 'Food Safety Department', '5bba6f14-accf-4e64-b85c-db4d3fa9c848', 'ACTIVE', NOW(), NOW()),
(gen_random_uuid(), 'Senior Management', 'Senior Management Department', '5bba6f14-accf-4e64-b85c-db4d3fa9c848', 'ACTIVE', NOW(), NOW());

-- Create branches
INSERT INTO branches (id, name, location, address, tenant_id, status, department_id, created_at, updated_at) VALUES 
(gen_random_uuid(), 'SOHO', 'SOHO', 'SOHO St', '5bba6f14-accf-4e64-b85c-db4d3fa9c848', 'ACTIVE', (SELECT id FROM departments WHERE name = 'Operations' LIMIT 1), NOW(), NOW()),
(gen_random_uuid(), 'OYSTER BAR', 'OYSTER BAR', 'OYSTER BAR St', '5bba6f14-accf-4e64-b85c-db4d3fa9c848', 'ACTIVE', (SELECT id FROM departments WHERE name = 'Operations' LIMIT 1), NOW(), NOW()),
(gen_random_uuid(), 'GEMINI BISTRO', 'GEMINI BISTRO', 'GEMINI BISTRO St', '5bba6f14-accf-4e64-b85c-db4d3fa9c848', 'ACTIVE', (SELECT id FROM departments WHERE name = 'Operations' LIMIT 1), NOW(), NOW()),
(gen_random_uuid(), 'IBIZA', 'IBIZA', 'IBIZA St', '5bba6f14-accf-4e64-b85c-db4d3fa9c848', 'ACTIVE', (SELECT id FROM departments WHERE name = 'Operations' LIMIT 1), NOW(), NOW()),
(gen_random_uuid(), 'RED-ROOM', 'RED-ROOM', 'RED-ROOM St', '5bba6f14-accf-4e64-b85c-db4d3fa9c848', 'ACTIVE', (SELECT id FROM departments WHERE name = 'Operations' LIMIT 1), NOW(), NOW());

-- Create employees
INSERT INTO employees (id, employee_number, first_name, last_name, email, position, department_id, branch_id, hire_date, status, tenant_id, created_at, updated_at) VALUES 
(gen_random_uuid(), 'EMP001', 'STRIVE', 'MACHIIRA', 'smachiira@charliescorp.co.ke', 'MARKETING HEAD', (SELECT id FROM departments WHERE name = 'Marketing' LIMIT 1), NULL, '2022-01-01', 'ACTIVE', '5bba6f14-accf-4e64-b85c-db4d3fa9c848', NOW(), NOW()),
(gen_random_uuid(), 'EMP002', 'PAUL', 'MACHARIA', 'pmacharia@charliescorp.co.ke', 'FINANCE DEPARTMENT HEAD', (SELECT id FROM departments WHERE name = 'Finance' LIMIT 1), NULL, '2022-01-01', 'ACTIVE', '5bba6f14-accf-4e64-b85c-db4d3fa9c848', NOW(), NOW()),
(gen_random_uuid(), 'EMP003', 'JUNE', 'NJOROGE', 'jnjoroge@charliescorp.co.ke', 'CEO', (SELECT id FROM departments WHERE name = 'Senior Management' LIMIT 1), NULL, '2022-01-01', 'ACTIVE', '5bba6f14-accf-4e64-b85c-db4d3fa9c848', NOW(), NOW()),
(gen_random_uuid(), 'EMP004', 'MARY WANJA', 'KIBICHO', 'mwanja@charliescorp.co.ke', 'GENERAL MANAGER', (SELECT id FROM departments WHERE name = 'Senior Management' LIMIT 1), NULL, '2022-01-01', 'ACTIVE', '5bba6f14-accf-4e64-b85c-db4d3fa9c848', NOW(), NOW()),
(gen_random_uuid(), 'EMP005', 'SOPHIA NYAKERARIO', 'OMOSA', 'snyakerario@charliescorp.co.ke', 'OPERATIONS DEPARTMENT HEAD', (SELECT id FROM departments WHERE name = 'Operations' LIMIT 1), NULL, '2022-01-01', 'ACTIVE', '5bba6f14-accf-4e64-b85c-db4d3fa9c848', NOW(), NOW()),
(gen_random_uuid(), 'EMP006', 'PHILLIP', 'WASONGA', 'pwasonga@charliescorp.co.ke', 'HR DEPARTMENT HEAD', (SELECT id FROM departments WHERE name = 'HR' LIMIT 1), NULL, '2022-01-01', 'ACTIVE', '5bba6f14-accf-4e64-b85c-db4d3fa9c848', NOW(), NOW()),
(gen_random_uuid(), 'EMP007', 'WENCESLAUS JUMA', 'WASIKE', 'jwasike@charliescorp.co.ke', 'MAINTENANCE DEPARTMENT HEAD', (SELECT id FROM departments WHERE name = 'Maintenance' LIMIT 1), NULL, '2022-01-01', 'ACTIVE', '5bba6f14-accf-4e64-b85c-db4d3fa9c848', NOW(), NOW()),
(gen_random_uuid(), 'EMP008', 'SUSAN WAIRIMU', 'GACHANJA', 'swairimu@charliescorp.co.ke', 'FINANCE MANAGER ASSISTANT', (SELECT id FROM departments WHERE name = 'Finance' LIMIT 1), NULL, '2022-01-01', 'ACTIVE', '5bba6f14-accf-4e64-b85c-db4d3fa9c848', NOW(), NOW()),
(gen_random_uuid(), 'EMP009', 'MARY', 'THABUKU', 'mthabuku@charliescorp.co.ke', 'HR MANAGER ASSISTANT', (SELECT id FROM departments WHERE name = 'HR' LIMIT 1), NULL, '2022-01-01', 'ACTIVE', '5bba6f14-accf-4e64-b85c-db4d3fa9c848', NOW(), NOW()),
(gen_random_uuid(), 'EMP010', 'RAYMOND', 'BIEGON', 'rbiegon@charliescorp.co.ke', 'MAINTENANCE DEPARTMENT', (SELECT id FROM departments WHERE name = 'Maintenance' LIMIT 1), NULL, '2022-01-01', 'ACTIVE', '5bba6f14-accf-4e64-b85c-db4d3fa9c848', NOW(), NOW()),
(gen_random_uuid(), 'EMP011', 'DAVID', 'KAMAU', 'dkamau@charliescorp.co.ke', 'OPERATIONS MANAGER ASSISTANT', (SELECT id FROM departments WHERE name = 'Operations' LIMIT 1), NULL, '2022-01-01', 'ACTIVE', '5bba6f14-accf-4e64-b85c-db4d3fa9c848', NOW(), NOW()),
(gen_random_uuid(), 'EMP012', 'EMILY', 'WANJIRU', 'ewanjiru@charliescorp.co.ke', 'FOOD SAFETY DEPARTMENT HEAD', (SELECT id FROM departments WHERE name = 'Food Safety' LIMIT 1), NULL, '2022-01-01', 'ACTIVE', '5bba6f14-accf-4e64-b85c-db4d3fa9c848', NOW(), NOW()),
(gen_random_uuid(), 'EMP013', 'JOSEPHINE', 'MATU', 'jmatu@charliescorp.co.ke', 'FINANCE TEAM MEMBER', (SELECT id FROM departments WHERE name = 'Finance' LIMIT 1), NULL, '2022-01-01', 'ACTIVE', '5bba6f14-accf-4e64-b85c-db4d3fa9c848', NOW(), NOW()),
(gen_random_uuid(), 'EMP014', 'FRANCIS', 'NDUNGU', 'fndungu@charliescorp.co.ke', 'FINANCE TEAM MEMBER', (SELECT id FROM departments WHERE name = 'Finance' LIMIT 1), NULL, '2022-01-01', 'ACTIVE', '5bba6f14-accf-4e64-b85c-db4d3fa9c848', NOW(), NOW()),
(gen_random_uuid(), 'EMP015', 'LINA', 'CHRISTINE', 'lchristine@charliescorp.co.ke', 'HR TEAM MEMBER', (SELECT id FROM departments WHERE name = 'HR' LIMIT 1), NULL, '2022-01-01', 'ACTIVE', '5bba6f14-accf-4e64-b85c-db4d3fa9c848', NOW(), NOW()),
(gen_random_uuid(), 'EMP016', 'FAITH', 'MUTHONI', 'fmuthoni@charliescorp.co.ke', 'HR TEAM MEMBER', (SELECT id FROM departments WHERE name = 'HR' LIMIT 1), NULL, '2022-01-01', 'ACTIVE', '5bba6f14-accf-4e64-b85c-db4d3fa9c848', NOW(), NOW()),
(gen_random_uuid(), 'EMP017', 'ASHLEY', 'ALI', 'ashley@charliescorp.co.ke', 'MARKETING TEAM MEMBER', (SELECT id FROM departments WHERE name = 'Marketing' LIMIT 1), NULL, '2022-01-01', 'ACTIVE', '5bba6f14-accf-4e64-b85c-db4d3fa9c848', NOW(), NOW()),
(gen_random_uuid(), 'EMP018', 'SHARON', 'NYATICH', 'snyatich@charliescorp.co.ke', 'SOHO BRANCH MANAGER', (SELECT id FROM departments WHERE name = 'Operations' LIMIT 1), (SELECT id FROM branches WHERE name = 'SOHO' LIMIT 1), '2022-01-01', 'ACTIVE', '5bba6f14-accf-4e64-b85c-db4d3fa9c848', NOW(), NOW()),
(gen_random_uuid(), 'EMP019', 'ANTHONY', 'NGILA', 'angila@charliescorp.co.ke', 'OYSTER BAR BRANCH MANAGER', (SELECT id FROM departments WHERE name = 'Operations' LIMIT 1), (SELECT id FROM branches WHERE name = 'OYSTER BAR' LIMIT 1), '2022-01-01', 'ACTIVE', '5bba6f14-accf-4e64-b85c-db4d3fa9c848', NOW(), NOW()),
(gen_random_uuid(), 'EMP020', 'FRANCIS', 'WAMBUA', 'fwambua@charliescorp.co.ke', 'GEMINI BISTRO BRANCH MANAGER', (SELECT id FROM departments WHERE name = 'Operations' LIMIT 1), (SELECT id FROM branches WHERE name = 'GEMINI BISTRO' LIMIT 1), '2022-01-01', 'ACTIVE', '5bba6f14-accf-4e64-b85c-db4d3fa9c848', NOW(), NOW()),
(gen_random_uuid(), 'EMP021', 'VENZA', 'CENTRA', 'vcentra@charliescorp.co.ke', 'IBIZA BRANCH MANAGER', (SELECT id FROM departments WHERE name = 'Operations' LIMIT 1), (SELECT id FROM branches WHERE name = 'IBIZA' LIMIT 1), '2022-01-01', 'ACTIVE', '5bba6f14-accf-4e64-b85c-db4d3fa9c848', NOW(), NOW()),
(gen_random_uuid(), 'EMP022', 'LUCY', 'WAIRIMU', 'lwairimu@charliescorp.co.ke', 'RED-ROOM BRANCH MANAGER', (SELECT id FROM departments WHERE name = 'Operations' LIMIT 1), (SELECT id FROM branches WHERE name = 'RED-ROOM' LIMIT 1), '2022-01-01', 'ACTIVE', '5bba6f14-accf-4e64-b85c-db4d3fa9c848', NOW(), NOW()),
(gen_random_uuid(), 'EMP023', 'MILLICENT', 'WAMUYU', 'mwamuyu@charliescorp.co.ke', 'ASSISTANT RED-ROOM BRANCH MANAGER', (SELECT id FROM departments WHERE name = 'Operations' LIMIT 1), (SELECT id FROM branches WHERE name = 'RED-ROOM' LIMIT 1), '2022-01-01', 'ACTIVE', '5bba6f14-accf-4e64-b85c-db4d3fa9c848', NOW(), NOW()),
(gen_random_uuid(), 'EMP024', 'ENOSH', 'OGEGA', 'eogega@charliescorp.co.ke', 'ASSISTANT GEMINI BISTRO BRANCH MANAGER', (SELECT id FROM departments WHERE name = 'Operations' LIMIT 1), (SELECT id FROM branches WHERE name = 'GEMINI BISTRO' LIMIT 1), '2022-01-01', 'ACTIVE', '5bba6f14-accf-4e64-b85c-db4d3fa9c848', NOW(), NOW()),
(gen_random_uuid(), 'EMP025', 'CAROL', 'NDIRANGU', 'cndirangu@charliescorp.co.ke', 'ASSISTANT IBIZA BRANCH MANAGER', (SELECT id FROM departments WHERE name = 'Operations' LIMIT 1), (SELECT id FROM branches WHERE name = 'IBIZA' LIMIT 1), '2022-01-01', 'ACTIVE', '5bba6f14-accf-4e64-b85c-db4d3fa9c848', NOW(), NOW()),
(gen_random_uuid(), 'EMP026', 'MAXWELL', 'OUMA', 'mouma@charliescorp.co.ke', 'ASSISTANT IBIZA BRANCH MANAGER', (SELECT id FROM departments WHERE name = 'Operations' LIMIT 1), (SELECT id FROM branches WHERE name = 'IBIZA' LIMIT 1), '2022-01-01', 'ACTIVE', '5bba6f14-accf-4e64-b85c-db4d3fa9c848', NOW(), NOW()),
(gen_random_uuid(), 'EMP027', 'PATRICK LISILI', 'LIKOBELE', 'plikobele@charliescorp.co.ke', 'ASSISTANT SOHO BRANCH MANAGER', (SELECT id FROM departments WHERE name = 'Operations' LIMIT 1), (SELECT id FROM branches WHERE name = 'SOHO' LIMIT 1), '2022-01-01', 'ACTIVE', '5bba6f14-accf-4e64-b85c-db4d3fa9c848', NOW(), NOW()),
(gen_random_uuid(), 'EMP028', 'ARNOLD', 'SURE', 'asure@charliescorp.co.ke', 'ASSISTANT SOHO BRANCH MANAGER', (SELECT id FROM departments WHERE name = 'Operations' LIMIT 1), (SELECT id FROM branches WHERE name = 'SOHO' LIMIT 1), '2022-01-01', 'ACTIVE', '5bba6f14-accf-4e64-b85c-db4d3fa9c848', NOW(), NOW()),
(gen_random_uuid(), 'EMP029', 'GEORGE', 'OBIENGE', 'gobienge@charliescorp.co.ke', 'RED-ROOM BAR MANAGER', (SELECT id FROM departments WHERE name = 'Operations' LIMIT 1), (SELECT id FROM branches WHERE name = 'RED-ROOM' LIMIT 1), '2022-01-01', 'ACTIVE', '5bba6f14-accf-4e64-b85c-db4d3fa9c848', NOW(), NOW()),
(gen_random_uuid(), 'EMP030', 'PETER', 'MBURU', 'pmburu@charliescorp.co.ke', 'GEMINI BISTRO BAR MANAGER', (SELECT id FROM departments WHERE name = 'Operations' LIMIT 1), (SELECT id FROM branches WHERE name = 'GEMINI BISTRO' LIMIT 1), '2022-01-01', 'ACTIVE', '5bba6f14-accf-4e64-b85c-db4d3fa9c848', NOW(), NOW()),
(gen_random_uuid(), 'EMP031', 'COLLINS', 'AMBOSO', 'camboso@charliescorp.co.ke', 'IBIZA BAR MANAGER', (SELECT id FROM departments WHERE name = 'Operations' LIMIT 1), (SELECT id FROM branches WHERE name = 'IBIZA' LIMIT 1), '2022-01-01', 'ACTIVE', '5bba6f14-accf-4e64-b85c-db4d3fa9c848', NOW(), NOW()),
(gen_random_uuid(), 'EMP032', 'COLLET', 'NDUTA', 'cnduta@charliescorp.co.ke', 'SOHO BAR MANAGER', (SELECT id FROM departments WHERE name = 'Operations' LIMIT 1), (SELECT id FROM branches WHERE name = 'SOHO' LIMIT 1), '2022-01-01', 'ACTIVE', '5bba6f14-accf-4e64-b85c-db4d3fa9c848', NOW(), NOW()),
(gen_random_uuid(), 'EMP033', 'SIMON', '', 'simon@charliescorp.co.ke', 'OYSTER BAY BAR MANAGER', (SELECT id FROM departments WHERE name = 'Operations' LIMIT 1), (SELECT id FROM branches WHERE name = 'OYSTER BAR' LIMIT 1), '2022-01-01', 'ACTIVE', '5bba6f14-accf-4e64-b85c-db4d3fa9c848', NOW(), NOW());

-- Create user accounts for employees
INSERT INTO users (id, email, password_hash, first_name, last_name, role, status, tenant_id, employee_id, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    e.email,
    '$2b$10$rOj0YXglNkf5W4rD5n9MaeZX4vy1vq4nM8lYvB5wF5pKq4y2X.GZe', -- password123
    e.first_name,
    e.last_name,
    'EMPLOYEE',
    'ACTIVE',
    e.tenant_id,
    e.id,
    NOW(),
    NOW()
FROM employees e
WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.email = e.email);

-- Create leave types
INSERT INTO leave_types (id, name, code, color, tenant_id, created_at, updated_at) VALUES
(gen_random_uuid(), 'Annual Leave', 'AL', '#4caf50', '5bba6f14-accf-4e64-b85c-db4d3fa9c848', NOW(), NOW()),
(gen_random_uuid(), 'Sick Leave', 'SL', '#f44336', '5bba6f14-accf-4e64-b85c-db4d3fa9c848', NOW(), NOW()),
(gen_random_uuid(), 'Maternity Leave', 'ML', '#2196f3', '5bba6f14-accf-4e64-b85c-db4d3fa9c848', NOW(), NOW()),
(gen_random_uuid(), 'Paternity Leave', 'PL', '#ff9800', '5bba6f14-accf-4e64-b85c-db4d3fa9c848', NOW(), NOW()),
(gen_random_uuid(), 'Compassionate Leave', 'CL', '#9c27b0', '5bba6f14-accf-4e64-b85c-db4d3fa9c848', NOW(), NOW());

-- Create leave policies
INSERT INTO leave_policies (id, leave_type_id, name, description, max_days_per_year, min_days_notice, max_days_per_request, max_carry_forward, allow_negative_balance, requires_approval, auto_approve, accrual_rate, probation_period_days, is_active, effective_date, tenant_id, created_at, updated_at) VALUES
(gen_random_uuid(), (SELECT id FROM leave_types WHERE code = 'AL' LIMIT 1), 'Annual Leave Policy', 'Annual leave policy: 21 working days per year, accrues at 1.75 days/month.', 21, 0, 21, 7, false, true, false, 1.75, 0, true, NOW(), '5bba6f14-accf-4e64-b85c-db4d3fa9c848', NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM leave_types WHERE code = 'SL' LIMIT 1), 'Sick Leave Policy', 'Sick leave: 7 days full pay, 7 days half pay per year.', 14, 0, 7, 0, false, true, false, 0, 0, true, NOW(), '5bba6f14-accf-4e64-b85c-db4d3fa9c848', NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM leave_types WHERE code = 'ML' LIMIT 1), 'Maternity Leave Policy', 'Maternity leave: 12 weeks (84 days) paid leave.', 84, 0, 84, 0, false, true, false, 0, 0, true, NOW(), '5bba6f14-accf-4e64-b85c-db4d3fa9c848', NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM leave_types WHERE code = 'PL' LIMIT 1), 'Paternity Leave Policy', 'Paternity leave: 2 weeks (14 days) paid leave.', 14, 0, 14, 0, false, true, false, 0, 0, true, NOW(), '5bba6f14-accf-4e64-b85c-db4d3fa9c848', NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM leave_types WHERE code = 'CL' LIMIT 1), 'Compassionate Leave Policy', 'Compassionate leave: max 15 days per year.', 15, 0, 15, 0, false, true, false, 0, 0, true, NOW(), '5bba6f14-accf-4e64-b85c-db4d3fa9c848', NOW(), NOW());

-- Create sample trainings
INSERT INTO trainings (id, title, description, start_date, end_date, status, tenant_id, created_at, updated_at) VALUES
(gen_random_uuid(), 'Workplace Safety Training', 'Mandatory safety procedures and emergency response.', '2025-07-01', '2025-07-02', 'COMPLETED', '5bba6f14-accf-4e64-b85c-db4d3fa9c848', NOW(), NOW()),
(gen_random_uuid(), 'Customer Service Excellence', 'Improving customer interaction and satisfaction.', '2025-07-10', '2025-07-11', 'PLANNED', '5bba6f14-accf-4e64-b85c-db4d3fa9c848', NOW(), NOW()),
(gen_random_uuid(), 'Food Safety & Hygiene', 'Best practices for food safety in hospitality.', '2025-07-15', '2025-07-15', 'PLANNED', '5bba6f14-accf-4e64-b85c-db4d3fa9c848', NOW(), NOW()),
(gen_random_uuid(), 'HR Policy Refresher', 'Annual HR policy and compliance training.', '2025-08-01', '2025-08-01', 'PLANNED', '5bba6f14-accf-4e64-b85c-db4d3fa9c848', NOW(), NOW());

-- Create payroll period
INSERT INTO payroll_periods (id, name, start_date, end_date, pay_date, status, tenant_id, created_at, updated_at) VALUES
(gen_random_uuid(), 'July 2025', '2025-07-01', '2025-07-31', '2025-07-31', 'DRAFT', '5bba6f14-accf-4e64-b85c-db4d3fa9c848', NOW(), NOW());

-- Create performance review cycle
INSERT INTO performance_review_cycles (id, name, description, start_date, end_date, review_deadline, status, tenant_id, created_at, updated_at) VALUES
(gen_random_uuid(), 'Mid-Year 2025', 'Mid-year performance review', '2025-06-01', '2025-07-31', '2025-07-31', 'ACTIVE', '5bba6f14-accf-4e64-b85c-db4d3fa9c848', NOW(), NOW());

-- Create salary advance policy
INSERT INTO salary_advance_policies (id, name, description, max_advance_percentage, max_advance_amount, min_service_months, max_advances_per_year, interest_rate, requires_approval, auto_approve, is_active, effective_date, tenant_id, monthly_deduction_percentage, created_at, updated_at) VALUES
(gen_random_uuid(), 'Monthly Salary Advance Policy', 'Employees can request up to 25% of their basic salary per month with unlimited requests until limit is reached. All advances are deducted from salary at month end.', 25, NULL, 0, 999, 0, true, false, true, NOW(), '5bba6f14-accf-4e64-b85c-db4d3fa9c848', 100, NOW(), NOW());

-- Create sample integrations
INSERT INTO integrations (id, name, type, status, config, success_rate, last_sync_time, tenant_id, created_at, updated_at) VALUES
(gen_random_uuid(), 'Payroll API', 'API', 'ACTIVE', '{"endpoint": "https://api.payroll.com", "apiKey": "demo-key"}', 98.5, NOW() - INTERVAL '1 hour', '5bba6f14-accf-4e64-b85c-db4d3fa9c848', NOW(), NOW()),
(gen_random_uuid(), 'Slack Notifications', 'WEBHOOK', 'ACTIVE', '{"webhookUrl": "https://hooks.slack.com/services/demo"}', 99.2, NOW() - INTERVAL '30 minutes', '5bba6f14-accf-4e64-b85c-db4d3fa9c848', NOW(), NOW()),
(gen_random_uuid(), 'Email Service', 'SMTP', 'INACTIVE', '{"host": "smtp.mail.com", "port": 587}', 0.0, NULL, '5bba6f14-accf-4e64-b85c-db4d3fa9c848', NOW(), NOW()),
(gen_random_uuid(), 'HR Information System', 'API', 'ACTIVE', '{"endpoint": "https://hris.company.com/api", "version": "v2"}', 95.8, NOW() - INTERVAL '2 hours', '5bba6f14-accf-4e64-b85c-db4d3fa9c848', NOW(), NOW()),
(gen_random_uuid(), 'Teams Webhook', 'WEBHOOK', 'ERROR', '{"webhookUrl": "https://company.webhook.office.com/webhookb2/demo"}', 45.3, NOW() - INTERVAL '1 day', '5bba6f14-accf-4e64-b85c-db4d3fa9c848', NOW(), NOW());

-- Create workflows
INSERT INTO workflows (id, name, tenant_id, created_at, updated_at) VALUES
(gen_random_uuid(), 'Onboarding Workflow', '5bba6f14-accf-4e64-b85c-db4d3fa9c848', NOW(), NOW()),
(gen_random_uuid(), 'Offboarding Workflow', '5bba6f14-accf-4e64-b85c-db4d3fa9c848', NOW(), NOW());

-- Create workflow stats
INSERT INTO workflow_stats (id, workflow_id, stats, tenant_id, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    w.id,
    '{}',
    w.tenant_id,
    NOW(),
    NOW()
FROM workflows w;

-- Create approvals
INSERT INTO approvals (id, workflow_id, approver_id, status, tenant_id, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    w.id,
    u.id,
    'PENDING',
    w.tenant_id,
    NOW(),
    NOW()
FROM workflows w
CROSS JOIN (SELECT id FROM users WHERE email = 'admin@charlieshrms.com' LIMIT 1) u;

-- Create integration logs
INSERT INTO integration_logs (id, integration_id, status, message, tenant_id, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    i.id,
    'SUCCESS',
    'Sync completed for ' || i.name,
    i.tenant_id,
    NOW(),
    NOW()
FROM integrations i;

INSERT INTO integration_logs (id, integration_id, status, message, tenant_id, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    i.id,
    'FAILURE',
    'Sync failed for ' || i.name,
    i.tenant_id,
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day'
FROM integrations i;

-- Create sample payrolls for employees
INSERT INTO payrolls (id, employee_id, payroll_period_id, basic_salary, gross_salary, total_deductions, net_salary, status, tenant_id, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    e.id,
    pp.id,
    COALESCE(e.salary, 50000),
    COALESCE(e.salary, 50000),
    0,
    COALESCE(e.salary, 50000),
    'DRAFT',
    e.tenant_id,
    NOW(),
    NOW()
FROM employees e
CROSS JOIN (SELECT id FROM payroll_periods WHERE name = 'July 2025' LIMIT 1) pp;

-- Create sample leave requests (first 5 employees)
INSERT INTO leave_requests (id, employee_id, leave_type_id, start_date, end_date, total_days, status, applied_at, tenant_id, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    e.id,
    lt.id,
    '2025-07-10',
    '2025-07-15',
    5,
    CASE WHEN (ROW_NUMBER() OVER ()) % 2 = 0 THEN 'APPROVED' ELSE 'PENDING' END,
    '2025-07-01',
    e.tenant_id,
    NOW(),
    NOW()
FROM (SELECT * FROM employees ORDER BY employee_number LIMIT 5) e
CROSS JOIN (SELECT id FROM leave_types WHERE code = 'AL' LIMIT 1) lt;

-- Create sample performance reviews (first 5 employees)
INSERT INTO performance_reviews (id, employee_id, review_cycle_id, reviewer_id, status, overall_rating, overall_comments, tenant_id, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    e.id,
    prc.id,
    u.id,
    CASE WHEN (ROW_NUMBER() OVER ()) % 2 = 0 THEN 'COMPLETED' ELSE 'IN_PROGRESS' END,
    4.0,
    'Good performance',
    e.tenant_id,
    NOW(),
    NOW()
FROM (SELECT * FROM employees ORDER BY employee_number LIMIT 5) e
CROSS JOIN (SELECT id FROM performance_review_cycles WHERE name = 'Mid-Year 2025' LIMIT 1) prc
CROSS JOIN (SELECT id FROM users WHERE email = 'admin@charlieshrms.com' LIMIT 1) u;

-- Create sample salary advance requests (first 3 employees)
INSERT INTO salary_advance_requests (id, employee_id, requested_amount, approved_amount, reason, status, request_date, tenant_id, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    e.id,
    10000,
    CASE WHEN (ROW_NUMBER() OVER ()) % 2 = 0 THEN 10000 ELSE NULL END,
    'Personal',
    CASE WHEN (ROW_NUMBER() OVER ()) % 2 = 0 THEN 'APPROVED' ELSE 'PENDING' END,
    '2025-07-05',
    e.tenant_id,
    NOW(),
    NOW()
FROM (SELECT * FROM employees ORDER BY employee_number LIMIT 3) e;

-- Update branch managers
UPDATE branches SET manager_id = (
    SELECT u.id FROM users u 
    JOIN employees e ON u.employee_id = e.id 
    WHERE e.email = 'snyatich@charliescorp.co.ke' 
    LIMIT 1
) WHERE name = 'SOHO';

UPDATE branches SET manager_id = (
    SELECT u.id FROM users u 
    JOIN employees e ON u.employee_id = e.id 
    WHERE e.email = 'angila@charliescorp.co.ke' 
    LIMIT 1
) WHERE name = 'OYSTER BAR';

UPDATE branches SET manager_id = (
    SELECT u.id FROM users u 
    JOIN employees e ON u.employee_id = e.id 
    WHERE e.email = 'fwambua@charliescorp.co.ke' 
    LIMIT 1
) WHERE name = 'GEMINI BISTRO';

UPDATE branches SET manager_id = (
    SELECT u.id FROM users u 
    JOIN employees e ON u.employee_id = e.id 
    WHERE e.email = 'vcentra@charliescorp.co.ke' 
    LIMIT 1
) WHERE name = 'IBIZA';

UPDATE branches SET manager_id = (
    SELECT u.id FROM users u 
    JOIN employees e ON u.employee_id = e.id 
    WHERE e.email = 'lwairimu@charliescorp.co.ke' 
    LIMIT 1
) WHERE name = 'RED-ROOM';

-- Final message
SELECT 'Database seeded successfully! CharliesHRMS data loaded.' as message;