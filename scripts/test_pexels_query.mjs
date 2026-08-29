import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read PEXELS_API_KEY from .env.local
const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const match = envContent.match(/PEXELS_API_KEY=(.*)/);
const apiKey = match ? match[1].trim() : '';

console.log('Using API Key:', apiKey ? apiKey.slice(0, 8) + '...' : 'NONE');

async function testQuery(query) {
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=5&orientation=landscape`;
  const res = await fetch(url, {
    headers: { Authorization: apiKey }
  });
  if (!res.ok) {
    console.error(`Query "${query}" failed:`, res.status, res.statusText);
    return;
  }
  const data = await res.json();
  console.log(`\nQuery: "${query}" -> Found ${data.photos.length} photos`);
  data.photos.slice(0, 3).forEach((p, idx) => {
    console.log(`  [${idx+1}] Photo ID: ${p.id} | Alt: "${p.alt}" | Photographer: ${p.photographer}`);
    console.log(`      URL: ${p.src.large2x || p.src.large}`);
  });
}

async function run() {
  await testQuery('Hogenakkal Falls Tamil Nadu India');
  await testQuery('Manali Himachal Pradesh India');
  await testQuery('Munnar Kerala India');
  await testQuery('Khajuraho Madhya Pradesh India');
  await testQuery('Qutub Minar Delhi India');
}

run();
