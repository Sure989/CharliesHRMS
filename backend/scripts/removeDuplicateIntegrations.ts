import { prisma } from '../src/lib/prisma';

async function removeDuplicateIntegrations() {
  console.log('Removing duplicate integrations...');
  
  try {
    // Get all integrations grouped by name and tenantId
    const integrations = await prisma.integration.findMany({
      orderBy: { createdAt: 'asc' }
    });
    
    console.log(`Found ${integrations.length} total integrations`);
    
    // Group by name and tenantId to find duplicates
    const grouped = integrations.reduce((acc: Record<string, typeof integrations>, integration) => {
      const key = `${integration.name}_${integration.tenantId}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(integration);
      return acc;
    }, {} as Record<string, typeof integrations>);
    
    // Remove duplicates (keep the first one, delete the rest)
    for (const [key, group] of Object.entries(grouped)) {
      const integrationsGroup = group as typeof integrations;
      if (integrationsGroup.length > 1) {
        console.log(`Found ${integrationsGroup.length} duplicates for ${integrationsGroup[0].name}`);
        
        // Delete all but the first one
        const toDelete = integrationsGroup.slice(1);
        for (const duplicate of toDelete) {
          console.log(`Deleting duplicate integration: ${duplicate.name} (ID: ${duplicate.id})`);
          
          // First delete related integration logs
          await prisma.integrationLog.deleteMany({
            where: { integrationId: duplicate.id }
          });
          
          // Then delete the integration
          await prisma.integration.delete({
            where: { id: duplicate.id }
          });
        }
      }
    }
    
    const remainingIntegrations = await prisma.integration.findMany();
    console.log(`Cleanup complete. Remaining integrations: ${remainingIntegrations.length}`);
    
  } catch (error) {
    console.error('Error removing duplicates:', error);
  } finally {
    await prisma.$disconnect();
  }
}

removeDuplicateIntegrations();
