import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const env = readFileSync('.env.local', 'utf-8')
  .split('\n')
  .reduce((acc, line) => {
    const [key, ...val] = line.split('=');
    if (key && val.length) acc[key.trim()] = val.join('=').trim();
    return acc;
  }, {});

const supabaseUrl = env.VITE_SUPABASE_URL?.includes('.')
  ? env.VITE_SUPABASE_URL
  : `https://${env.VITE_SUPABASE_URL}.supabase.co`;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('Checking database...\n');

const { data: products, error: prodErr } = await supabase
  .from('products')
  .select('id, title, category, vendor_id')
  .limit(10);

if (prodErr) {
  console.error('Products error:', prodErr);
} else {
  console.log(`Products found: ${products?.length ?? 0}`);
  if (products?.length > 0) {
    products.forEach(p => {
      console.log(`  - ${p.title} (category: ${p.category ?? 'null'})`);
    });
  }
}

const { data: vendors, error: vendorErr } = await supabase
  .from('vendors')
  .select('id, name')
  .limit(10);

if (vendorErr) {
  console.error('Vendors error:', vendorErr);
} else {
  console.log(`\nVendors found: ${vendors?.length ?? 0}`);
}
