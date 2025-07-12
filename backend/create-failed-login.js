const { prisma } = require('./src/index'); 
async function createFailedLogin() { 
  try { 
    const tenants = await prisma.tenant.findMany({ take: 1 }); 
    if (tenants.length === 0) { 
      console.log('No tenants found'); 
      return; 
    } 
    const tenantId = tenants[0].id; 
    console.log('Found tenant:', tenantId); 
    const result = await prisma.auditLog.create({ 
      data: { 
        action: 'FAILED_LOGIN', 
        entity: 'USER', 
        entityId: 'test', 
        tenantId, 
        details: { reason: 'invalid_password' } 
      } 
    }); 
    console.log('Created audit log entry:', result); 
  } catch (e) { 
    console.error(e); 
  } finally { 
    await prisma.$disconnect(); 
  } 
} 
createFailedLogin();
