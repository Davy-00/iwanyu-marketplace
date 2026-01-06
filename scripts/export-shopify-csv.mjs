#!/usr/bin/env node
/**
 * Export Shopify-style product CSV to:
 * - export/raw-rows.json (every row, all columns preserved)
 * - export/products.json (grouped by Handle, with variants + images)
 * - export/images/** (downloads Image Src + Variant Image URLs)
 * - export/images-manifest.csv (mapping from row/handle to downloaded file)
 *
 * Usage:
 *   node scripts/export-shopify-csv.mjs /absolute/path/to/products.csv
 *   node scripts/export-shopify-csv.mjs /path/to/products.csv --out export
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function die(msg) {
  console.error(msg);
  process.exit(1);
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function sanitizeSegment(s) {
  return String(s ?? '')
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 180) || 'item';
}

function guessExtFromUrl(url) {
  try {
    const u = new URL(url);
    const ext = path.extname(u.pathname);
    if (ext && ext.length <= 6) return ext;
  } catch {
    // ignore
  }
  return '';
}

function toCsvLine(values) {
  return values
    .map((v) => {
      const s = String(v ?? '');
      if (/[\n\r",]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    })
    .join(',');
}

function parseArgs(argv) {
  const args = { input: null, outDir: 'export' };
  const rest = [...argv];
  while (rest.length) {
    const a = rest.shift();
    if (!a) break;
    if (!args.input && !a.startsWith('--')) {
      args.input = a;
      continue;
    }
    if (a === '--out') {
      const v = rest.shift();
      if (!v) die('Missing value for --out');
      args.outDir = v;
      continue;
    }
    die(`Unknown arg: ${a}`);
  }
  return args;
}

// Minimal CSV parser for well-formed Shopify exports.
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let i = 0;
  let inQuotes = false;

  while (i < text.length) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        const next = text[i + 1];
        if (next === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      field += ch;
      i += 1;
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }

    if (ch === ',') {
      row.push(field);
      field = '';
      i += 1;
      continue;
    }

    if (ch === '\n') {
      row.push(field);
      field = '';
      rows.push(row);
      row = [];
      i += 1;
      continue;
    }

    if (ch === '\r') {
      // ignore CR
      i += 1;
      continue;
    }

    field += ch;
    i += 1;
  }

  // last field
  row.push(field);
  rows.push(row);
  return rows;
}

async function download(url, destPath) {
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await fs.promises.writeFile(destPath, buf);
}

function extractImageUrls(row) {
  const urls = [];
  const imageSrc = row['Image Src'];
  const variantImage = row['Variant Image'];

  for (const v of [imageSrc, variantImage]) {
    if (!v) continue;
    const s = String(v).trim();
    if (!s) continue;
    urls.push(s);
  }

  return urls;
}

function groupProducts(rows) {
  const byHandle = new Map();

  for (const r of rows) {
    const handle = String(r.Handle ?? '').trim();
    if (!handle) continue;

    if (!byHandle.has(handle)) {
      byHandle.set(handle, {
        handle,
        title: r.Title ?? null,
        bodyHtml: r['Body (HTML)'] ?? null,
        vendor: r.Vendor ?? null,
        productCategory: r['Product Category'] ?? null,
        type: r.Type ?? null,
        tags: r.Tags ?? null,
        published: r.Published ?? null,
        status: r.Status ?? null,
        options: [
          { name: r['Option1 Name'] ?? null, linkedTo: r['Option1 Linked To'] ?? null },
          { name: r['Option2 Name'] ?? null, linkedTo: r['Option2 Linked To'] ?? null },
          { name: r['Option3 Name'] ?? null, linkedTo: r['Option3 Linked To'] ?? null },
        ],
        seo: {
          title: r['SEO Title'] ?? null,
          description: r['SEO Description'] ?? null,
        },
        googleShopping: Object.fromEntries(
          Object.entries(r).filter(([k]) => k.startsWith('Google Shopping / '))
        ),
        metafields: Object.fromEntries(
          Object.entries(r).filter(([k]) => k.includes('(product.metafields.'))
        ),
        images: [],
        variants: [],
        rows: [],
      });
    }

    const product = byHandle.get(handle);
    product.rows.push(r);

    const imageSrc = String(r['Image Src'] ?? '').trim();
    if (imageSrc) {
      product.images.push({
        src: imageSrc,
        position: r['Image Position'] ?? null,
        alt: r['Image Alt Text'] ?? null,
      });
    }

    product.variants.push({
      sku: r['Variant SKU'] ?? null,
      option1: r['Option1 Value'] ?? null,
      option2: r['Option2 Value'] ?? null,
      option3: r['Option3 Value'] ?? null,
      grams: r['Variant Grams'] ?? null,
      inventoryTracker: r['Variant Inventory Tracker'] ?? null,
      inventoryQty: r['Variant Inventory Qty'] ?? null,
      inventoryPolicy: r['Variant Inventory Policy'] ?? null,
      fulfillmentService: r['Variant Fulfillment Service'] ?? null,
      price: r['Variant Price'] ?? null,
      compareAtPrice: r['Variant Compare At Price'] ?? null,
      requiresShipping: r['Variant Requires Shipping'] ?? null,
      taxable: r['Variant Taxable'] ?? null,
      barcode: r['Variant Barcode'] ?? null,
      image: r['Variant Image'] ?? null,
      weightUnit: r['Variant Weight Unit'] ?? null,
      taxCode: r['Variant Tax Code'] ?? null,
      costPerItem: r['Cost per item'] ?? null,
    });
  }

  return [...byHandle.values()];
}

async function main() {
  const { input, outDir } = parseArgs(process.argv.slice(2));
  if (!input) die('Usage: node scripts/export-shopify-csv.mjs /path/to/products.csv [--out export]');

  const csvPath = path.isAbsolute(input) ? input : path.resolve(process.cwd(), input);
  if (!fs.existsSync(csvPath)) die(`File not found: ${csvPath}`);

  const outRoot = path.isAbsolute(outDir) ? outDir : path.resolve(process.cwd(), outDir);
  const imagesDir = path.join(outRoot, 'images');

  ensureDir(outRoot);
  ensureDir(imagesDir);

  const csvText = await fs.promises.readFile(csvPath, 'utf-8');
  const parsed = parseCsv(csvText);
  if (parsed.length < 2) die('CSV appears empty');

  const headers = parsed[0];
  const dataRows = parsed.slice(1).filter((r) => r.some((v) => String(v ?? '').trim() !== ''));

  const rows = dataRows.map((vals) => {
    const obj = {};
    for (let i = 0; i < headers.length; i += 1) {
      obj[headers[i]] = vals[i] ?? '';
    }
    return obj;
  });

  await fs.promises.writeFile(path.join(outRoot, 'raw-rows.json'), JSON.stringify(rows, null, 2));

  const products = groupProducts(rows);
  await fs.promises.writeFile(path.join(outRoot, 'products.json'), JSON.stringify(products, null, 2));

  // Download images
  const manifestPath = path.join(outRoot, 'images-manifest.csv');
  const manifestLines = [
    toCsvLine(['handle', 'row_index', 'field', 'url', 'local_path', 'bytes', 'error']),
  ];

  // Deduplicate by URL but keep per-row manifest entries.
  const downloaded = new Map();

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
    const r = rows[rowIndex];
    const handle = String(r.Handle ?? '').trim() || 'unknown';

    const fields = [
      { field: 'Image Src', url: String(r['Image Src'] ?? '').trim() },
      { field: 'Variant Image', url: String(r['Variant Image'] ?? '').trim() },
    ].filter((x) => x.url);

    for (const { field, url } of fields) {
      const handleDir = path.join(imagesDir, sanitizeSegment(handle));
      ensureDir(handleDir);

      const ext = guessExtFromUrl(url) || '.jpg';
      const filename = `${sanitizeSegment(field)}_${String(r['Image Position'] ?? rowIndex).trim() || rowIndex}${ext}`;
      const localPath = path.join(handleDir, filename);

      let bytes = '';
      let errMsg = '';

      try {
        if (!downloaded.has(url)) {
          await download(url, localPath);
          const stat = await fs.promises.stat(localPath);
          downloaded.set(url, { localPath, bytes: stat.size });
        } else {
          // If already downloaded, point to the original file path.
          const prev = downloaded.get(url);
          bytes = String(prev.bytes);
        }

        const stat = await fs.promises.stat(localPath).catch(() => null);
        if (stat) bytes = String(stat.size);
      } catch (e) {
        errMsg = e instanceof Error ? e.message : String(e);
      }

      manifestLines.push(
        toCsvLine([
          handle,
          rowIndex,
          field,
          url,
          path.relative(outRoot, localPath),
          bytes,
          errMsg,
        ])
      );
    }
  }

  await fs.promises.writeFile(manifestPath, manifestLines.join('\n') + '\n');

  console.log(`Export complete:`);
  console.log(`- Rows: ${rows.length}`);
  console.log(`- Products (grouped by Handle): ${products.length}`);
  console.log(`- Output: ${outRoot}`);
  console.log(`- Images downloaded (unique URLs): ${downloaded.size}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
