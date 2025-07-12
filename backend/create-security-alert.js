const { prisma } = require('./src/index'); 
async function createSecurityAlert() { 
  try { 
    const tenants = await prisma.tenant.findMany({ take: 1 }); 
    if (tenants.length === 0) { 
      console.log('No tenants found'); 
      return; 
    } 
    const tenantId = tenants[0].id; 
    console.log('Found tenant:', tenantId); 
    const result = await prisma.securityAlert.create({ 
      data: { 
        type: 'THREAT', 
        title: 'Suspicious Login Activity', 
        description: 'Multiple failed login attempts detected from unknown IP address', 
        tenantId
      } 
    }); 
    console.log('Created security alert:', result); 
  } catch (e) { 
    console.error(e); 
  } finally { 
    await prisma.$disconnect(); 
  } 
} 
createSecurityAlert();
