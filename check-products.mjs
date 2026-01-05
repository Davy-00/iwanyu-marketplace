import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const { data: products, error } = await supabase
  .from('products')
  .select('id, name, category')
  .limit(20);

if (error) {
  console.error('Error:', error);
} else {
  console.log('\n📦 Sample Products and Their Categories:\n');
  console.log('ID | Name | Current Category');
  console.log('---|------|------------------');
  products.forEach(p => {
    console.log(`${p.id.substring(0, 8)}... | ${p.name.substring(0, 40)} | ${p.category || 'NULL'}`);
  });
  
  // Get unique categories
  const { data: allProducts } = await supabase.from('products').select('category');
  const categories = [...new Set(allProducts.map(p => p.category).filter(Boolean))];
  console.log('\n📂 Unique Categories in Database:', categories.length);
  console.log(categories.sort());
}
