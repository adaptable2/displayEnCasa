// Script: Fetch Google reviews at build time and write to public/data
// Usage: GOOGLE_API_KEY=... PLACE_ID=... node scripts/fetch-reviews.js
require('dotenv').config();

const fs = require('fs');
const path = require('path');

async function main() {
  const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
  const PLACE_ID = process.env.PLACE_ID;

  if (!GOOGLE_API_KEY || !PLACE_ID) {
    console.error('Faltan variables de entorno: GOOGLE_API_KEY o PLACE_ID');
    process.exit(1);
  }

  const url = `https://maps.googleapis.com/maps/api/place/details/json?placeid=${PLACE_ID}&fields=reviews&language=es&key=${GOOGLE_API_KEY}`;

  try {
    const { default: fetch } = await import('node-fetch');
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const data = await res.json();
    if (data.status !== 'OK') {
      throw new Error(data.error_message || `Status ${data.status}`);
    }

    const reviews = data.result?.reviews || [];

    const outDir = path.join(__dirname, '..', 'public', 'data');
    const outFile = path.join(outDir, 'google-reviews.json');
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(outFile, JSON.stringify(reviews, null, 2), 'utf8');
    console.log(`Guardado: ${outFile} (${reviews.length} reseñas)`);
  } catch (err) {
    console.error('Error al obtener/guardar reseñas:', err.message);
    process.exit(1);
  }
}

main();

