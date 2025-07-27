-- Seed data for CharliesHRMS
-- Run this in Supabase SQL Editor

-- Insert sample tenant
INSERT INTO tenants (id, name, domain) VALUES 
('550e8400-e29b-41d4-a716-446655440000', 'Charlie''s Company', 'charlies-company.com');

-- Insert sample departments
INSERT INTO departments (id, name, description, tenant_id) VALUES 
('550e8400-e29b-41d4-a716-446655440001', 'Human Resources', 'HR Department', '550e8400-e29b-41d4-a716-446655440000'),
('550e8400-e29b-41d4-a716-446655440002', 'Engineering', 'Software Development', '550e8400-e29b-41d4-a716-446655440000'),
('550e8400-e29b-41d4-a716-446655440003', 'Sales', 'Sales Department', '550e8400-e29b-41d4-a716-446655440000');

-- Insert sample branches
INSERT INTO branches (id, name, location, department_id, tenant_id) VALUES 
('550e8400-e29b-41d4-a716-446655440004', 'Main Office', 'Nairobi', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000'),
('550e8400-e29b-41d4-a716-446655440005', 'Tech Hub', 'Nairobi', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000');

-- Insert sample employees
INSERT INTO employees (id, employee_number, first_name, last_name, email, position, department_id, branch_id, salary, hire_date, tenant_id) VALUES 
('550e8400-e29b-41d4-a716-446655440006', 'EMP001', 'John', 'Doe', 'john.doe@charlies-company.com', 'HR Manager', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440004', 80000, '2024-01-15', '550e8400-e29b-41d4-a716-446655440000'),
('550e8400-e29b-41d4-a716-446655440007', 'EMP002', 'Jane', 'Smith', 'jane.smith@charlies-company.com', 'Software Engineer', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440005', 90000, '2024-02-01', '550e8400-e29b-41d4-a716-446655440000');

-- Insert sample users
INSERT INTO users (id, email, password_hash, first_name, last_name, role, tenant_id, employee_id) VALUES 
('550e8400-e29b-41d4-a716-446655440008', 'admin@charlies-company.com', '$2b$10$rOzJqZxQZ8qZ8qZ8qZ8qZO8qZ8qZ8qZ8qZ8qZ8qZ8qZ8qZ8qZ8qZ8', 'Admin', 'User', 'ADMIN', '550e8400-e29b-41d4-a716-446655440000', NULL),
('550e8400-e29b-41d4-a716-446655440009', 'john.doe@charlies-company.com', '$2b$10$rOzJqZxQZ8qZ8qZ8qZ8qZO8qZ8qZ8qZ8qZ8qZ8qZ8qZ8qZ8qZ8qZ8', 'John', 'Doe', 'HR_MANAGER', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440006');

-- Insert sample leave types
INSERT INTO leave_types (id, name, code, description, tenant_id) VALUES 
('550e8400-e29b-41d4-a716-446655440010', 'Annual Leave', 'AL', 'Annual vacation leave', '550e8400-e29b-41d4-a716-446655440000'),
('550e8400-e29b-41d4-a716-446655440011', 'Sick Leave', 'SL', 'Medical leave', '550e8400-e29b-41d4-a716-446655440000'),
('550e8400-e29b-41d4-a716-446655440012', 'Maternity Leave', 'ML', 'Maternity leave', '550e8400-e29b-41d4-a716-446655440000');