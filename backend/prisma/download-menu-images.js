const { PrismaClient } = require('@prisma/client');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const prisma = new PrismaClient();
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'menu');
const BASE_URL = 'http://173.212.227.106:3000/uploads/menu';

function slugify(s) {
  return s.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function downloadFile(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, { timeout: 15000 }, (res) => {
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
  let downloaded = 0;
  let skipped = 0;
  let failed = 0;

  for (const item of items) {
    if (!item.image || !item.image.startsWith('http')) {
      skipped++;
      continue;
    }

    const slug = slugify(item.name);
    const filename = `${slug}.jpg`;
    const filepath = path.join(UPLOAD_DIR, filename);

    // Skip if already downloaded
    if (fs.existsSync(filepath)) {
      const localUrl = `${BASE_URL}/${filename}`;
      if (item.image !== localUrl) {
        await prisma.menuItem.update({
          where: { id: item.id },
          data: { image: localUrl },
        });
      }
      console.log(`  ⏭ ${item.name} (already exists)`);
      downloaded++;
      continue;
    }

    try {
      const buffer = await downloadFile(item.image);
      fs.writeFileSync(filepath, buffer);
      const localUrl = `${BASE_URL}/${filename}`;
      await prisma.menuItem.update({
        where: { id: item.id },
        data: { image: localUrl },
      });
      downloaded++;
      console.log(`  ✓ ${item.name} → ${filename} (${(buffer.length / 1024).toFixed(0)}KB)`);
    } catch (err) {
      failed++;
      console.log(`  ✗ ${item.name}: ${err.message}`);
    }
  }

  console.log(`\n✅ ${downloaded} downloaded, ${skipped} skipped (no image), ${failed} failed`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
