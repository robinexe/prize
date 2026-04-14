const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  // Fix Estrogonofe de Frango - wrong partial match to Frango
  await p.menuItem.updateMany({ where: { name: 'Estrogonofe de Frango' }, data: { image: null } });
  console.log('Fixed Estrogonofe de Frango');

  // Add Pastel Camarão photo (from petiscos section on source)
  await p.menuItem.updateMany({ where: { name: 'Pastel Camarão' }, data: { image: 'https://lh3.googleusercontent.com/pE2NcRfwH-neAVIFHl2vke4tykiaXsHKDDTI-xueUFEUEBN97qQJxd2b0QFSBJhTIvzdW7oa3Ml1DB45szDXjeH7wDRUInJXRA=s800' } });
  console.log('Added Pastel Camarão photo');

  const count = await p.menuItem.count({ where: { image: { not: null } } });
  const total = await p.menuItem.count();
  console.log(`Total: ${count}/${total} with photos`);
}

main().catch(console.error).finally(() => p.$disconnect());
