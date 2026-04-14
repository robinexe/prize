const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const menuData = [
  {
    name: 'ENTRADAS',
    slug: 'entradas',
    items: [
      { name: 'Salada Prize', description: 'Salada especial da casa', price: 34.90 },
      { name: 'Feijão Amigo', description: 'Porção de feijão', price: 12.00 },
      { name: 'Pastel Camarão', description: 'Pastel recheado com camarão', price: 95.90 },
      { name: 'Pastel Queijo/Carne', description: 'Pastel de queijo ou carne', price: 49.90 },
    ],
  },
  {
    name: 'SUGESTÕES DO CHEF',
    slug: 'sugestoes-do-chef',
    items: [
      { name: 'Medalhão ao Molho Madeira', description: 'Medalhão de filé com molho madeira', price: 98.00 },
      { name: 'Salmão', description: 'Salmão grelhado', price: 106.00 },
      { name: 'Filé Osvaldo Aranha', description: 'Filé mignon ao estilo Osvaldo Aranha', price: 89.00 },
      { name: 'Camarão ao Catupiry', description: 'Camarão gratinado com catupiry', price: 99.00 },
      { name: 'Filé Parmegiana', description: 'Filé à parmegiana', price: 92.00 },
      { name: 'Filé Mignon com Fritas', description: 'Filé mignon acompanhado de fritas', price: 85.00 },
      { name: 'Peixe com Molho de Camarão p/2', description: 'Peixe ao molho de camarão para 2 pessoas', price: 179.90 },
      { name: 'Peixe com Fritas p/2', description: 'Peixe frito com fritas para 2 pessoas', price: 140.00 },
    ],
  },
  {
    name: 'GRILL',
    slug: 'grill',
    items: [
      { name: 'Picanha P/1', description: 'Picanha na brasa individual', price: 132.00 },
      { name: 'Picanha P/2', description: 'Picanha na brasa para 2 pessoas', price: 220.90 },
      { name: 'Churrasco Misto P/1', description: 'Churrasco misto individual', price: 115.00 },
      { name: 'Churrasco Misto P/2', description: 'Churrasco misto para 2 pessoas', price: 185.00 },
      { name: 'Galeto P/2', description: 'Galeto assado na brasa para 2 pessoas', price: 105.00 },
      { name: 'Cupim/Costela', description: 'Cupim ou costela na brasa', price: 169.90 },
    ],
  },
  {
    name: 'EXECUTIVOS',
    slug: 'executivos',
    items: [
      { name: 'Frango', description: 'Prato executivo de frango', price: 45.90 },
      { name: 'Peixe', description: 'Prato executivo de peixe', price: 69.90 },
      { name: 'Contra Filé', description: 'Prato executivo de contra filé', price: 79.90 },
      { name: 'Filé/Picanha', description: 'Prato executivo de filé ou picanha', price: 89.90 },
      { name: 'Prize Kids', description: 'Prato infantil', price: 39.00 },
      { name: 'Strogonoff', description: 'Strogonoff de carne', price: 69.90 },
      { name: 'Estrogonofe de Frango', description: 'Strogonoff de frango', price: 49.90 },
    ],
  },
  {
    name: 'PETISCOS',
    slug: 'petiscos',
    items: [
      { name: 'Filé Gorgonzola', description: 'Filé ao molho gorgonzola', price: 99.00 },
      { name: 'Trio do Mar', description: 'Combinação de frutos do mar', price: 169.90 },
      { name: 'Batata Frita', description: 'Porção de batata frita', price: 39.90 },
      { name: 'Batata Especial', description: 'Batata frita com cobertura especial', price: 44.90 },
      { name: 'Sticks de Frango', description: 'Tiras de frango empanadas', price: 69.90 },
      { name: 'Loucuras do Mar', description: 'Mix especial de frutos do mar', price: 169.00 },
      { name: 'Camarão Crocante', description: 'Camarão empanado crocante', price: 115.00 },
      { name: 'Isca de Peixe', description: 'Iscas de peixe empanadas', price: 99.00 },
      { name: 'Lula Crocante', description: 'Lula empanada crocante', price: 75.00 },
    ],
  },
  {
    name: 'SOBREMESAS',
    slug: 'sobremesas',
    items: [
      { name: 'Brownie com Sorvete', description: 'Brownie de chocolate com sorvete', price: 32.00 },
    ],
  },
  {
    name: 'BEBIDAS',
    slug: 'bebidas',
    items: [
      { name: 'Água', description: 'Água mineral', price: 7.99 },
      { name: 'Refrigerante KS', description: 'Refrigerante lata', price: 9.90 },
      { name: 'Tônica', description: 'Água tônica', price: 9.99 },
      { name: 'H2O', description: 'Água saborizada H2O', price: 11.00 },
      { name: 'Suco Natural', description: 'Suco natural de frutas', price: 11.99 },
      { name: 'Red Bull', description: 'Energético Red Bull', price: 18.99 },
      { name: 'Água de Coco', description: 'Água de coco natural', price: 9.99 },
    ],
  },
  {
    name: 'GIN PRIZE',
    slug: 'gin-prize',
    items: [
      { name: 'Gin Tropical', description: 'Gin com mix tropical', price: 39.00 },
      { name: 'Gin Frutas Vermelhas', description: 'Gin com frutas vermelhas', price: 42.00 },
      { name: 'Gin Maracujá', description: 'Gin com maracujá', price: 39.00 },
      { name: 'Gin Limão', description: 'Gin com limão', price: 39.00 },
      { name: 'Gin Tanqueray', description: 'Gin Tanqueray especial', price: 42.00 },
    ],
  },
  {
    name: "PRIZE DRINK'S",
    slug: 'prize-drinks',
    items: [
      { name: 'Aperol Spritz', description: 'Aperol com espumante e soda', price: 44.00 },
      { name: 'Moscow Mule', description: 'Vodka, ginger beer e limão', price: 45.00 },
      { name: 'Mojito', description: 'Rum, hortelã, limão e soda', price: 39.00 },
      { name: 'Pina Colada', description: 'Rum, leite de coco e abacaxi', price: 39.00 },
      { name: 'Sex on the Beach', description: 'Vodka, licor de pêssego, suco de laranja e cranberry', price: 39.00 },
    ],
  },
  {
    name: 'CAIPS TROPICAIS',
    slug: 'caips-tropicais',
    items: [
      { name: 'Caipvodka', description: 'Caipirinha com vodka', price: 39.00 },
      { name: 'Caipirinha', description: 'Caipirinha tradicional', price: 35.00 },
      { name: 'Caipifrutas', description: 'Caipirinha com mix de frutas', price: 39.00 },
    ],
  },
  {
    name: "SHOT'S E DOSES",
    slug: 'shots-e-doses',
    items: [
      { name: 'Tequila', description: 'Dose de tequila', price: 21.99 },
      { name: 'Bananinha', description: 'Dose de licor de banana', price: 15.00 },
      { name: 'Licor 43', description: 'Dose de Licor 43', price: 24.99 },
      { name: 'Jagermeister', description: 'Dose de Jagermeister', price: 21.99 },
      { name: 'Whisky Dose', description: 'Dose de whisky', price: 24.99 },
    ],
  },
  {
    name: 'CERVEJAS LONG NECK E 600ML',
    slug: 'cervejas',
    items: [
      { name: 'Balde Stella Artois (5un)', description: 'Balde com 5 Stella Artois long neck', price: 69.99 },
      { name: 'Balde Heineken (5un)', description: 'Balde com 5 Heineken long neck', price: 59.99 },
      { name: 'Stella Artois LN', description: 'Stella Artois long neck individual', price: 14.99 },
      { name: 'Heineken LN', description: 'Heineken long neck individual', price: 12.99 },
      { name: 'Budweiser LN', description: 'Budweiser long neck individual', price: 9.99 },
      { name: 'Corona LN', description: 'Corona long neck individual', price: 14.99 },
      { name: 'Brahma 600ml', description: 'Brahma garrafa 600ml', price: 14.99 },
    ],
  },
  {
    name: 'GARRAFAS',
    slug: 'garrafas',
    items: [
      { name: 'Smirnoff', description: 'Garrafa de vodka Smirnoff', price: 129.90 },
      { name: 'Absolut', description: 'Garrafa de vodka Absolut', price: 219.90 },
      { name: 'Grey Goose', description: 'Garrafa de vodka Grey Goose', price: 399.90 },
      { name: 'Jack Daniels', description: 'Garrafa de whisky Jack Daniels', price: 239.90 },
      { name: 'Johnnie Walker Red', description: 'Garrafa Johnnie Walker Red Label', price: 179.90 },
      { name: 'Johnnie Walker Black', description: 'Garrafa Johnnie Walker Black Label', price: 399.90 },
      { name: 'Tanqueray', description: 'Garrafa de gin Tanqueray', price: 199.90 },
    ],
  },
  {
    name: 'COMBOS',
    slug: 'combos',
    items: [
      { name: 'Gin + 5 Red Bull', description: 'Garrafa de gin com 5 Red Bull', price: 299.00 },
      { name: 'Vodka + 5 Red Bull', description: 'Garrafa de vodka com 5 Red Bull', price: 249.00 },
      { name: 'Whisky + 5 Red Bull', description: 'Garrafa de whisky com 5 Red Bull', price: 349.00 },
    ],
  },
];

async function main() {
  console.log('Limpando dados existentes do cardápio...');
  await prisma.menuItem.deleteMany();
  await prisma.menuCategory.deleteMany();

  console.log('Inserindo categorias e itens...');
  for (let catIdx = 0; catIdx < menuData.length; catIdx++) {
    const catData = menuData[catIdx];
    const category = await prisma.menuCategory.create({
      data: {
        name: catData.name,
        slug: catData.slug,
        order: catIdx + 1,
        isActive: true,
      },
    });
    console.log(`  ✓ ${category.name} (${catData.items.length} itens)`);

    for (let itemIdx = 0; itemIdx < catData.items.length; itemIdx++) {
      const item = catData.items[itemIdx];
      await prisma.menuItem.create({
        data: {
          categoryId: category.id,
          name: item.name,
          description: item.description || null,
          price: item.price,
          isAvailable: true,
          order: itemIdx + 1,
        },
      });
    }
  }

  const totalCategories = await prisma.menuCategory.count();
  const totalItems = await prisma.menuItem.count();
  console.log(`\n✅ Seed concluído: ${totalCategories} categorias, ${totalItems} itens`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
