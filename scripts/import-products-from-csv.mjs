import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { parse } from "csv-parse/sync";
import { createClient } from "@supabase/supabase-js";

function loadDotEnvFile(filePath) {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;

      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;

      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();

      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // ignore missing/invalid env files
  }
}

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

function pickEnv(...names) {
  for (const name of names) {
    const value = process.env[name];
    if (value) return value;
  }
  return null;
}

function normalizeSupabaseUrl(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;

  // Allow passing project ref (e.g. iakxtffxaevszuouapih)
  if (/^[a-z0-9]{20}$/.test(raw)) {
    return `https://${raw}.supabase.co`;
  }

  return raw;
}

function slugify(input) {
  return String(input ?? "")
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function normalizeWhitespace(input) {
  return String(input ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function titleCase(input) {
  const value = normalizeWhitespace(input);
  if (!value) return value;

  const isAllLower = value === value.toLowerCase();
  const isAllUpper = value === value.toUpperCase();
  if (!isAllLower && !isAllUpper) return value;

  const small = new Set(["and", "or", "the", "a", "an", "of", "to", "in", "on", "for", "with"]);
  return value
    .split(" ")
    .map((word, idx) => {
      const w = word.toLowerCase();
      if (idx !== 0 && small.has(w)) return w;
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(" ");
}

function toBool(v) {
  if (typeof v === "boolean") return v;
  const s = String(v ?? "").trim().toLowerCase();
  return s === "true" || s === "1" || s === "yes";
}

function toNumber(v) {
  const n = Number(String(v ?? "").trim());
  return Number.isFinite(n) ? n : 0;
}

function stripHtml(html) {
  return String(html ?? "")
    .replace(/<\s*br\s*\/?\s*>/gi, "\n")
    .replace(/<\s*\/p\s*>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .trim();
}

function simplifyCategoryPath(value) {
  const raw = normalizeWhitespace(value);
  if (!raw) return "";
  if (!raw.includes(">")) return titleCase(raw);
  const parts = raw
    .split(">")
    .map((p) => normalizeWhitespace(p))
    .filter(Boolean);
  const last = parts.at(-1) ?? raw;
  return titleCase(last);
}

async function main() {
  // Load environment variables for local runs.
  // This is intentionally minimal (no dependency) and does not override existing env.
  loadDotEnvFile(path.resolve(process.cwd(), ".env.local"));
  loadDotEnvFile(path.resolve(process.cwd(), ".env"));

  const csvPath = process.argv[2];
  if (!csvPath) {
    console.error("Usage: node scripts/import-products-from-csv.mjs /absolute/path/to/file.csv");
    process.exit(1);
  }

  const abs = path.resolve(csvPath);
  const raw = fs.readFileSync(abs, "utf8");

  /** @type {Array<Record<string, string>>} */
  const rows = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
    relax_column_count: true,
    trim: true,
  });

  const supabaseUrl = normalizeSupabaseUrl(pickEnv("SUPABASE_URL", "VITE_SUPABASE_URL"));
  if (!supabaseUrl) throw new Error("Missing SUPABASE_URL (or VITE_SUPABASE_URL)");

  // Service role is required to bypass RLS for bulk import.
  const serviceKey = pickEnv("SUPABASE_SERVICE_ROLE_KEY", "VITE_SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SERVICE_KEY");
  if (!serviceKey) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY (or VITE_SUPABASE_SERVICE_ROLE_KEY)");

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Preload existing vendors to avoid duplicates by name.
  const { data: existingVendors, error: vendorsErr } = await supabase.from("vendors").select("id, name");
  if (vendorsErr) throw new Error(vendorsErr.message);

  const vendorByName = new Map();
  for (const v of existingVendors ?? []) {
    vendorByName.set(String(v.name).trim().toLowerCase(), { id: v.id, name: v.name });
  }

  const vendorCreates = [];
  const vendorIdByName = new Map();

  for (const r of rows) {
    const name = titleCase(r["Vendor"] ?? "");
    if (!name) continue;
    const key = name.toLowerCase();

    const existing = vendorByName.get(key);
    if (existing) {
      vendorIdByName.set(key, existing.id);
      continue;
    }

    if (!vendorIdByName.has(key)) {
      const id = `v_${slugify(name) || "vendor"}_${Math.random().toString(36).slice(2, 8)}`;
      vendorCreates.push({ id, name, location: null, verified: false, owner_user_id: null });
      vendorIdByName.set(key, id);
    }
  }

  if (vendorCreates.length) {
    const { error } = await supabase.from("vendors").insert(vendorCreates);
    if (error) throw new Error(error.message);
  }

  // Build product rows
  // Shopify exports may contain multiple rows per product (variants/images) with the same Handle.
  const byHandle = new Map();

  for (const r of rows) {
    const handle = normalizeWhitespace(r["Handle"] ?? "");
    if (!handle) continue;

    const status = String(r["Status"] ?? "").trim().toLowerCase();
    const published = toBool(r["Published"]);
    const vendorName = titleCase(r["Vendor"] ?? "");
    const title = titleCase(r["Title"] ?? "");
    const imageUrl = normalizeWhitespace(r["Image Src"] ?? r["Variant Image"] ?? "");
    const qty = toNumber(r["Variant Inventory Qty"]);

    const existing = byHandle.get(handle) ?? {
      handle,
      status: "",
      published: false,
      vendorName: "",
      title: "",
      description: "",
      category: "",
      price: 0,
      requiresShipping: true,
      imageUrl: "",
      totalQty: 0,
      sku: "",
    };

    // Aggregate inventory across variant rows.
    existing.totalQty += qty;

    // Keep first non-empty image across all rows.
    if (!existing.imageUrl && imageUrl) existing.imageUrl = imageUrl;

    // Prefer the primary row (the one with a Title) for metadata.
    if (title) {
      existing.title = title;
      existing.vendorName = vendorName;
      if (status) existing.status = status;
      if (published) existing.published = true;
      const description = stripHtml(r["Body (HTML)"] ?? "");
      if (description) existing.description = description;

      const rawType = normalizeWhitespace(r["Type"] ?? "");
      const rawCategory = normalizeWhitespace(r["Product Category"] ?? "");
      existing.category = simplifyCategoryPath(rawType || rawCategory);

      const price = toNumber(r["Variant Price"]);
      if (price) existing.price = price;
      existing.requiresShipping = toBool(r["Variant Requires Shipping"]);

      const sku = normalizeWhitespace(r["Variant SKU"] ?? "");
      if (sku) existing.sku = sku;
    }

    byHandle.set(handle, existing);
  }

  const seenProductIds = new Map();
  const products = [];

  for (const entry of byHandle.values()) {
    if (!entry.title) continue;
    if (!entry.published) continue;
    if (entry.status && entry.status !== "active") continue;

    const vendorName = entry.vendorName;
    if (!vendorName) continue;
    const vendorKey = vendorName.toLowerCase();
    const vendorId = vendorIdByName.get(vendorKey) ?? vendorByName.get(vendorKey)?.id;
    if (!vendorId) continue;

    const vendorSlug = slugify(vendorName) || "vendor";
    const baseId = slugify(entry.sku || entry.handle || entry.title) || "product";

    let id = `${baseId}-${vendorSlug}`;
    const count = (seenProductIds.get(id) ?? 0) + 1;
    seenProductIds.set(id, count);
    if (count > 1) id = `${id}-${count}`;

    products.push({
      id,
      vendor_id: vendorId,
      title: entry.title,
      description: entry.description || null,
      category: entry.category || null,
      price_rwf: Math.round(Number(entry.price ?? 0)),
      image_url: entry.imageUrl || null,
      image_public_id: null,
      in_stock: Number(entry.totalQty ?? 0) > 0,
      free_shipping: !entry.requiresShipping,
      rating: 0,
      review_count: 0,
    });
  }

  // Upsert in chunks
  const chunkSize = 200;
  for (let i = 0; i < products.length; i += chunkSize) {
    const chunk = products.slice(i, i + chunkSize);
    const { error } = await supabase.from("products").upsert(chunk);
    if (error) throw new Error(error.message);
  }

  console.log(`Imported vendors: ${vendorCreates.length}`);
  console.log(`Imported/updated products: ${products.length}`);
}

main().catch((e) => {
  console.error(e?.message ?? e);
  process.exit(1);
});
