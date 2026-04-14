const { PrismaClient } = require('@prisma/client');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'menu');
const BASE_URL = 'http://173.212.227.106:3000/uploads/menu';

// Free image URLs from Unsplash/Pexels for items without photos
// Using small size for fast download
const missingImages = {
  // FOOD
  'Filé Mignon com Fritas': 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=800&q=80',
  'Churrasco Misto P/1': 'https://images.unsplash.com/photo-1558030006-450675393462?w=800&q=80',
  'Churrasco Misto P/2': 'https://images.unsplash.com/photo-1558030006-450675393462?w=800&q=80',
  'Filé/Picanha': 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80',
  'Strogonoff': 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=800&q=80',
  'Estrogonofe de Frango': 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=800&q=80',
  'Camarão Crocante': 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=800&q=80',

  // BEBIDAS
  'Água': 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=800&q=80',
  'Refrigerante KS': 'https://images.unsplash.com/photo-1581636625402-29b2a704ef13?w=800&q=80',
  'Tônica': 'https://images.unsplash.com/photo-1558645836-e44122a743ee?w=800&q=80',
  'H2O': 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=800&q=80',
  'Suco Natural': 'https://images.unsplash.com/photo-1534353473418-4cfa6c56fd38?w=800&q=80',
  'Red Bull': 'https://images.unsplash.com/photo-1527960471264-932f39eb5846?w=800&q=80',
  'Água de Coco': 'https://images.unsplash.com/photo-1525385133512-2f3bdd039054?w=800&q=80',

  // GIN
  'Gin Tropical': 'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=800&q=80',
  'Gin Frutas Vermelhas': 'https://images.unsplash.com/photo-1560512823-829485b8bf24?w=800&q=80',
  'Gin Maracujá': 'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=800&q=80',
  'Gin Limão': 'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=800&q=80',
  'Gin Tanqueray': 'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=800&q=80',

  // DRINKS
  'Aperol Spritz': 'https://images.unsplash.com/photo-1560512823-829485b8bf24?w=800&q=80',
  'Moscow Mule': 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&q=80',
  'Mojito': 'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=800&q=80',
  'Pina Colada': 'https://images.unsplash.com/photo-1587223962930-cb7f31384c19?w=800&q=80',
  'Sex on the Beach': 'https://images.unsplash.com/photo-1560512823-829485b8bf24?w=800&q=80',

  // CAIPS
  'Caipvodka': 'https://images.unsplash.com/photo-1587223962930-cb7f31384c19?w=800&q=80',
  'Caipirinha': 'https://images.unsplash.com/photo-1587223962930-cb7f31384c19?w=800&q=80',
  'Caipifrutas': 'https://images.unsplash.com/photo-1587223962930-cb7f31384c19?w=800&q=80',

  // SHOTS
  'Tequila': 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&q=80',
  'Bananinha': 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&q=80',
  'Licor 43': 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&q=80',
  'Jagermeister': 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&q=80',
  'Whisky Dose': 'https://images.unsplash.com/photo-1527281400683-1aae777175f8?w=800&q=80',

  // CERVEJAS
  'Budweiser LN': 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=800&q=80',
  'Brahma 600ml': 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=800&q=80',

  // GARRAFAS
  'Smirnoff': 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&q=80',
  'Absolut': 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&q=80',
  'Grey Goose': 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&q=80',
  'Jack Daniels': 'https://images.unsplash.com/photo-1527281400683-1aae777175f8?w=800&q=80',
  'Johnnie Walker Red': 'https://images.unsplash.com/photo-1527281400683-1aae777175f8?w=800&q=80',
  'Johnnie Walker Black': 'https://images.unsplash.com/photo-1527281400683-1aae777175f8?w=800&q=80',
  'Tanqueray': 'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=800&q=80',

  // COMBOS
  'Gin + 5 Red Bull': 'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=800&q=80',
  'Vodka + 5 Red Bull': 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&q=80',
  'Whisky + 5 Red Bull': 'https://images.unsplash.com/photo-1527281400683-1aae777175f8?w=800&q=80',
};

function slugify(s) {
  return s.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function downloadFile(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, { timeout: 15000, headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadFile(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function main() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }

  const items = await prisma.menuItem.findMany();
  let updated = 0;
  let failed = 0;

  for (const item of items) {
    // Skip items that already have a local image
    if (item.image && item.image.includes('/uploads/menu/')) continue;
    
    const sourceUrl = missingImages[item.name];
    if (!sourceUrl) {
      console.log(`  ⏭ ${item.name} (no mapping)`);
      continue;
    }

    const slug = slugify(item.name);
    const filename = `${slug}.jpg`;
    const filepath = path.join(UPLOAD_DIR, filename);

    if (fs.existsSync(filepath)) {
      const localUrl = `${BASE_URL}/${filename}`;
      await prisma.menuItem.update({
        where: { id: item.id },
        data: { image: localUrl },
      });
      console.log(`  ⏭ ${item.name} (file exists, DB updated)`);
      updated++;
      continue;
    }

    try {
      const buffer = await downloadFile(sourceUrl);
      fs.writeFileSync(filepath, buffer);
      const localUrl = `${BASE_URL}/${filename}`;
      await prisma.menuItem.update({
        where: { id: item.id },
        data: { image: localUrl },
      });
      updated++;
      console.log(`  ✓ ${item.name} → ${filename} (${(buffer.length / 1024).toFixed(0)}KB)`);
    } catch (err) {
      failed++;
      console.log(`  ✗ ${item.name}: ${err.message}`);
    }
  }

  console.log(`\n✅ ${updated} items updated, ${failed} failed`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
