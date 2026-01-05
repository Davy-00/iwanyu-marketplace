import fs from "node:fs";
import path from "node:path";
import process from "node:process";
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

function decodeJwtPayload(token) {
  const parts = String(token ?? "").split(".");
  if (parts.length < 2) return null;
  const b64url = parts[1];
  const pad = "=".repeat((4 - (b64url.length % 4)) % 4);
  const b64 = (b64url + pad).replace(/-/g, "+").replace(/_/g, "/");
  try {
    return JSON.parse(Buffer.from(b64, "base64").toString("utf8"));
  } catch {
    return null;
  }
}

function assertServiceRoleKey(token) {
  const payload = decodeJwtPayload(token);
  const role = payload?.role;
  if (role !== "service_role" && role !== "supabase_admin") {
    throw new Error(
      `SUPABASE_SERVICE_ROLE_KEY is not a service role key (role=${role ?? "unknown"}). Use the service_role key from Supabase Dashboard → Project Settings → API.`
    );
  }
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

function normalizeWhitespace(input) {
  return String(input ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeKey(input) {
  return normalizeWhitespace(input).toLowerCase();
}

function tokenize(input) {
  return normalizeKey(input)
    .replace(/[^a-z0-9\s]+/g, " ")
    .split(" ")
    .map((t) => t.trim())
    .filter(Boolean);
}

function uniq(arr) {
  return Array.from(new Set(arr));
}

function countOccurrences(haystackTokens, needleTokens) {
  if (!needleTokens.length) return 0;
  const set = new Set(haystackTokens);
  let hits = 0;
  for (const t of needleTokens) {
    if (set.has(t)) hits += 1;
  }
  return hits;
}

function buildCategorySynonyms() {
  // Only used if the corresponding category exists.
  return {
    electronics: [
      "phone",
      "smartphone",
      "iphone",
      "android",
      "laptop",
      "computer",
      "tablet",
      "charger",
      "cable",
      "usb",
      "earbud",
      "headphone",
      "speaker",
      "camera",
      "tv",
      "router",
      "powerbank",
      "power",
    ],
    kitchen: [
      "kitchen",
      "cook",
      "cooking",
      "pan",
      "pot",
      "knife",
      "spoon",
      "fork",
      "plate",
      "bowl",
      "cup",
      "kettle",
      "blender",
      "microwave",
      "cookware",
    ],
    fashion: [
      "shirt",
      "tshirt",
      "t-shirt",
      "dress",
      "jeans",
      "pants",
      "trouser",
      "skirt",
      "jacket",
      "hoodie",
      "shoe",
      "sneaker",
      "bag",
      "handbag",
      "belt",
    ],
    beauty: [
      "beauty",
      "makeup",
      "lipstick",
      "perfume",
      "fragrance",
      "cream",
      "lotion",
      "shampoo",
      "conditioner",
      "soap",
      "skincare",
    ],
    health: ["health", "vitamin", "supplement", "medical", "wellness", "mask", "sanitizer"],
    sports: ["sport", "sports", "gym", "fitness", "ball", "yoga", "bicycle", "bike"],
    toys: ["toy", "toys", "lego", "doll", "kids", "child"],
    baby: ["baby", "diaper", "nappy", "stroller", "milk", "bottle"],
    home: [
      "home",
      "decor",
      "furniture",
      "chair",
      "table",
      "sofa",
      "curtain",
      "carpet",
      "bedding",
      "pillow",
      "blanket",
    ],
    groceries: ["food", "snack", "grocery", "groceries", "tea", "coffee", "rice", "oil", "sugar"],
  };
}

function inferSynonymsFromCategoryName(categoryKey, categoryName) {
  const k = String(categoryKey ?? "");
  const n = normalizeKey(categoryName);
  const syn = [];

  const add = (...items) => syn.push(...items.flat());

  if (k.includes("shoe") || n.includes("shoe") || n.includes("sneaker") || n.includes("boot")) {
    add(["shoe", "shoes", "sneaker", "sneakers", "boot", "boots", "heel", "heels", "loafer", "sandals", "slipper"]);
  }
  if (k.includes("jacket") || n.includes("jacket") || n.includes("coat")) {
    add(["jacket", "jackets", "coat", "coats", "outerwear", "hoodie", "parka", "windbreaker", "blazer"]);
  }
  if (k.includes("pant") || n.includes("pant") || n.includes("trouser") || n.includes("jean")) {
    add(["pants", "pant", "trouser", "trousers", "jeans", "jean", "leggings", "shorts"]);
  }
  if (k.includes("top") || n.includes("top") || n.includes("shirt") || n.includes("tee")) {
    add(["top", "tops", "shirt", "shirts", "tshirt", "t-shirts", "t-shirt", "tee", "tees", "blouse", "blouses", "polo"]);
  }
  if (k.includes("dress") || n.includes("dress")) {
    add(["dress", "dresses", "gown", "gowns"]);
  }
  if (k.includes("bag") || n.includes("bag") || n.includes("handbag")) {
    add(["bag", "bags", "handbag", "handbags", "backpack", "backpacks", "purse", "purses", "wallet", "wallets"]);
  }
  if (k.includes("watch") || n.includes("watch")) {
    add(["watch", "watches", "smartwatch"]);
  }
  if (k.includes("kid") || n.includes("kid") || n.includes("kids") || n.includes("baby")) {
    add(["kid", "kids", "baby", "infant", "toddler", "children", "child"]);
  }
  if (k.includes("kitchen") || n.includes("kitchen")) {
    add(["kitchen", "cook", "cooking", "cookware", "utensil", "utensils", "pan", "pot", "knife", "spoon", "fork"]);
  }
  if (k.includes("electronic") || n.includes("electronic") || n.includes("phone") || n.includes("laptop")) {
    add(["electronics", "electronic", "phone", "smartphone", "iphone", "android", "laptop", "tablet", "charger", "cable", "usb"]);
  }

  return uniq(tokenize(syn.join(" ")));
}

function chooseFallbackCategory(categories) {
  const preferred = ["general", "all", "uncategorized", "misc", "others", "other"];
  for (const key of preferred) {
    const found = categories.find((c) => c.key === key || c.key.includes(key));
    if (found) return found;
  }
  // Fall back to most common category.
  return categories[0] ?? null;
}

function isBadCategoryKey(key) {
  const k = normalizeKey(key);
  return !k || k === "general" || k === "uncategorized";
}

function buildKeywordRules() {
  // Each rule: if title/description contains any keyword, try to map to an existing category
  // whose name contains any of the preferred category name fragments.
  return [
    { keywords: ["shoe", "shoes", "sneaker", "sneakers", "boot", "boots", "heel", "heels", "sandal", "sandals", "slipper", "slippers"], preferCategoryNameIncludes: ["shoe", "sneaker", "boot", "heel", "sandal", "slipper"] },
    { keywords: ["tshirt", "t-shirt", "tshirts", "t-shirts", "tee", "tees"], preferCategoryNameIncludes: ["t-shirt", "tshirt", "tee"] },
    { keywords: ["shirt", "shirts", "blouse", "blouses", "top", "tops", "polo"], preferCategoryNameIncludes: ["top", "tops", "shirt", "blouse", "polo"] },
    { keywords: ["jacket", "jackets", "coat", "coats", "hoodie", "outerwear", "parka", "windbreaker", "blazer"], preferCategoryNameIncludes: ["jacket", "coat", "outerwear", "hoodie", "blazer"] },
    { keywords: ["pant", "pants", "trouser", "trousers", "jean", "jeans", "legging", "leggings", "short", "shorts"], preferCategoryNameIncludes: ["pant", "pants", "trouser", "jean", "leggings", "shorts"] },
    { keywords: ["dress", "dresses", "gown", "gowns"], preferCategoryNameIncludes: ["dress", "gown"] },
    { keywords: ["bag", "bags", "handbag", "handbags", "backpack", "backpacks", "purse", "purses", "wallet", "wallets"], preferCategoryNameIncludes: ["bag", "handbag", "backpack", "purse", "wallet"] },
    { keywords: ["laptop", "laptops", "notebook"], preferCategoryNameIncludes: ["laptop", "computer"] },
    { keywords: ["phone", "phones", "smartphone", "iphone", "android"], preferCategoryNameIncludes: ["phone", "smartphone"] },
    { keywords: ["wallpaper", "wallpapers"], preferCategoryNameIncludes: ["wallpaper"] },
  ];
}

function findCategoryByNameFragments(categories, fragments) {
  const frags = fragments.map((f) => normalizeKey(f));
  const matches = categories.filter((c) => {
    const name = normalizeKey(c.name);
    return frags.some((f) => f && name.includes(f));
  });
  if (!matches.length) return null;
  matches.sort((a, b) => b.count - a.count);
  return matches[0];
}

function ruleBasedCategory(productsTextTokens, categories) {
  const rules = buildKeywordRules();
  const tokenSet = new Set(productsTextTokens);

  for (const rule of rules) {
    const hit = rule.keywords.some((k) => tokenSet.has(normalizeKey(k)));
    if (!hit) continue;
    const match = findCategoryByNameFragments(categories, rule.preferCategoryNameIncludes);
    if (match) return match;
  }

  return null;
}

function scoreCategory({
  categoryName,
  categoryKey,
  categoryTokens,
  categorySynTokens,
  titleTokens,
  descTokens,
}) {
  // Weights: title matches matter more than description.
  const titleHits = countOccurrences(titleTokens, categoryTokens);
  const descHits = countOccurrences(descTokens, categoryTokens);

  const synTitleHits = countOccurrences(titleTokens, categorySynTokens);
  const synDescHits = countOccurrences(descTokens, categorySynTokens);

  // Bonus if the full category phrase appears in the raw text.
  const rawCategory = normalizeKey(categoryName);
  const rawText = `${titleTokens.join(" ")} ${descTokens.join(" ")}`;
  const phraseBonus = rawCategory && rawText.includes(rawCategory) ? 5 : 0;

  // Small boost for partial token overlap density.
  const totalTokens = Math.max(1, categoryTokens.length);
  const densityBonus = Math.min(3, Math.floor(((titleHits + descHits) / totalTokens) * 3));

  return titleHits * 3 + descHits * 1 + synTitleHits * 2 + synDescHits * 1 + phraseBonus + densityBonus;
}

async function fetchAll(supabase, table, select, pageSize = 1000) {
  const out = [];
  for (let from = 0; ; from += pageSize) {
    const to = from + pageSize - 1;
    const { data, error } = await supabase.from(table).select(select).range(from, to);
    if (error) throw new Error(error.message);
    out.push(...(data ?? []));
    if (!data || data.length < pageSize) break;
  }
  return out;
}

async function main() {
  // Local env for script runs
  loadDotEnvFile(path.resolve(process.cwd(), ".env.local"));
  loadDotEnvFile(path.resolve(process.cwd(), ".env"));

  const dryRun = process.argv.includes("--dry-run");

  const supabaseUrl = normalizeSupabaseUrl(pickEnv("SUPABASE_URL", "VITE_SUPABASE_URL"));
  if (!supabaseUrl) throw new Error("Missing SUPABASE_URL (or VITE_SUPABASE_URL)");

  const serviceKey = pickEnv("SUPABASE_SERVICE_ROLE_KEY", "VITE_SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SERVICE_KEY");
  const anonKey = pickEnv("SUPABASE_ANON_KEY", "VITE_SUPABASE_ANON_KEY");

  if (!dryRun && !serviceKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY (or VITE_SUPABASE_SERVICE_ROLE_KEY)");
  }

  if (!dryRun && serviceKey) {
    assertServiceRoleKey(serviceKey);
  }

  const key = serviceKey || anonKey;
  if (!key) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY for apply, or SUPABASE_ANON_KEY for dry-run");
  }

  const supabase = createClient(supabaseUrl, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const products = await fetchAll(
    supabase,
    "products",
    "id, title, description, category, created_at"
  );

  // Build the existing category set from what’s already in the DB.
  const categoryCounts = new Map();
  for (const p of products) {
    const raw = normalizeWhitespace(p.category);
    if (!raw) continue;
    const key = normalizeKey(raw);
    const entry = categoryCounts.get(key) ?? { key, examples: new Map(), count: 0 };
    entry.count += 1;
    entry.examples.set(raw, (entry.examples.get(raw) ?? 0) + 1);
    categoryCounts.set(key, entry);
  }

  // Pick a canonical display name per normalized category.
  const categories = [];
  for (const entry of categoryCounts.values()) {
    let bestName = "";
    let bestCount = -1;
    for (const [name, cnt] of entry.examples.entries()) {
      if (cnt > bestCount) {
        bestName = name;
        bestCount = cnt;
      }
    }
    categories.push({
      key: entry.key,
      name: bestName,
      count: entry.count,
    });
  }
  categories.sort((a, b) => b.count - a.count);

  // Only categorize INTO non-generic categories.
  const targetCategories = categories.filter((c) => !isBadCategoryKey(c.key));
  const fallbackCategory = chooseFallbackCategory(targetCategories);

  if (categories.length === 0) {
    console.log("No categories found in products table; nothing to map to.");
    return;
  }

  const categoryByKey = new Map(categories.map((c) => [c.key, c]));

  const synonymsByCanonicalKey = buildCategorySynonyms();

  // Precompute tokens for categories.
  const categoryMeta = targetCategories.map((c) => {
    const tokens = tokenize(c.name);

    // Attach synonyms only if the category exists (by common names).
    // e.g. if the category name is "Electronics", use electronics synonyms.
    const synKey = (() => {
      const k = c.key;
      if (k.includes("electronic")) return "electronics";
      if (k.includes("kitchen")) return "kitchen";
      if (k.includes("fashion") || k.includes("clothing") || k.includes("apparel")) return "fashion";
      if (k.includes("beauty") || k.includes("cosmetic") || k.includes("skincare")) return "beauty";
      if (k.includes("health")) return "health";
      if (k.includes("sport")) return "sports";
      if (k.includes("toy")) return "toys";
      if (k.includes("baby")) return "baby";
      if (k.includes("home") || k.includes("furniture") || k.includes("decor")) return "home";
      if (k.includes("grocery") || k.includes("food")) return "groceries";
      return null;
    })();

    const mappedSynTokens = synKey ? synonymsByCanonicalKey[synKey].flatMap(tokenize) : [];
    const inferredSynTokens = inferSynonymsFromCategoryName(c.key, c.name);
    const synTokens = uniq([...mappedSynTokens, ...inferredSynTokens]);

    return {
      categoryKey: c.key,
      categoryName: c.name,
      categoryTokens: tokens,
      categorySynTokens: synTokens,
      categoryCount: c.count,
    };
  });

  const force = process.argv.includes("--force");

  const needsUpdate = [];
  for (const p of products) {
    const raw = normalizeWhitespace(p.category);
    const k = normalizeKey(raw);

    if (force) {
      needsUpdate.push(p);
      continue;
    }

    // Only categorize products that are missing or have generic categories.
    if (isBadCategoryKey(k)) {
      needsUpdate.push(p);
      continue;
    }
  }

  if (needsUpdate.length === 0) {
    console.log("No products need categorization.");
    return;
  }

  const updatesByCategoryKey = new Map();
  const reassigned = [];
  const normalized = [];
  const ruleMatched = [];

  for (const p of needsUpdate) {
    const titleTokens = tokenize(p.title);
    const descTokens = tokenize(p.description);
    const allTokens = uniq([...titleTokens, ...descTokens]);

    const raw = normalizeWhitespace(p.category);
    const k = normalizeKey(raw);
    const canonicalExisting = raw && categoryByKey.has(k) ? categoryByKey.get(k) : null;
    if (canonicalExisting && raw !== canonicalExisting.name) {
      const list = updatesByCategoryKey.get(canonicalExisting.key) ?? [];
      list.push(p.id);
      updatesByCategoryKey.set(canonicalExisting.key, list);
      normalized.push(p.id);
      continue;
    }

    // 1) Simple keyword rules first (e.g., contains "shoes" -> Shoes/Sneakers category)
    const rulePick = ruleBasedCategory(allTokens, categories);
    if (rulePick) {
      const list = updatesByCategoryKey.get(rulePick.key) ?? [];
      list.push(p.id);
      updatesByCategoryKey.set(rulePick.key, list);
      reassigned.push(p.id);
      ruleMatched.push(p.id);
      continue;
    }

    let best = null;
    let bestScore = -1;
    let bestCount = -1;

    for (const c of categoryMeta) {
      const score = scoreCategory({
        categoryName: c.categoryName,
        categoryKey: c.categoryKey,
        categoryTokens: c.categoryTokens,
        categorySynTokens: c.categorySynTokens,
        titleTokens,
        descTokens,
      });

      if (score > bestScore) {
        bestScore = score;
        best = c;
        bestCount = c.categoryCount;
      } else if (score === bestScore) {
        // Tie-breaker: prefer the more common category
        if (c.categoryCount > bestCount) {
          best = c;
          bestCount = c.categoryCount;
        }
      }
    }

    const chosen = best && bestScore > 0 ? best : null;
    const fallback = fallbackCategory;
    const finalCategoryKey = (chosen ?? fallback)?.categoryKey ?? (fallback?.key ?? null);
    const finalCategoryName = (chosen ?? fallback)?.categoryName ?? (fallback?.name ?? null);

    if (!finalCategoryKey || !finalCategoryName) continue;

    const list = updatesByCategoryKey.get(finalCategoryKey) ?? [];
    list.push(p.id);
    updatesByCategoryKey.set(finalCategoryKey, list);
    reassigned.push(p.id);
  }

  const totalPlanned = Array.from(updatesByCategoryKey.values()).reduce((a, ids) => a + ids.length, 0);

  console.log(`Found ${products.length} products total.`);
  console.log(`Found ${categories.length} existing categories.`);
  console.log(`Products needing categorization${force ? " (force)" : ""}: ${needsUpdate.length}`);
  console.log(`Planned updates: ${totalPlanned}${dryRun ? " (dry-run)" : ""}`);
  console.log(`- Reassigned into existing categories: ${reassigned.length}`);
  console.log(`- Reassigned via keyword rules: ${ruleMatched.length}`);

  // Apply updates in batches grouped by category.
  for (const [categoryKey, ids] of updatesByCategoryKey.entries()) {
    const category = categoryByKey.get(categoryKey);
    if (!category) continue;

    // chunk to avoid query limits
    const chunkSize = 100;
    for (let i = 0; i < ids.length; i += chunkSize) {
      const chunk = ids.slice(i, i + chunkSize);
      if (dryRun) {
        console.log(`[dry-run] Would set category="${category.name}" for ${chunk.length} products`);
        continue;
      }

      const { data, error } = await supabase
        .from("products")
        .update({ category: category.name })
        .in("id", chunk)
        .select("id");
      if (error) throw new Error(error.message);
      const updated = (data ?? []).length;
      if (updated !== chunk.length) {
        throw new Error(
          `Update did not affect expected rows for category "${category.name}". Expected ${chunk.length}, updated ${updated}. Check that you are using a real service_role key (not anon).`
        );
      }
      console.log(`Set category="${category.name}" for ${chunk.length} products`);
    }
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
