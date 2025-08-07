-- Fix demo users by setting isDemo flag to true
UPDATE "User" SET "isDemo" = true 
WHERE email IN (
  'admin@charlieshrms.com',
  'hr@charlieshrms.com',
  'operations@charlieshrms.com',
  'employee@charlieshrms.com'
);

-- Verify the update
SELECT id, email, "firstName", "lastName", role, "isDemo" 
FROM "User" 
WHERE email IN (
  'admin@charlieshrms.com',
  'hr@charlieshrms.com',
  'operations@charlieshrms.com',
  'employee@charlieshrms.com'
);