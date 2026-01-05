import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://iakxtffxaevszuouapih.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlha3h0ZmZ4YWV2c3p1b3VhcGloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2MTgxNTIsImV4cCI6MjA4MzE5NDE1Mn0.phPO0WG3tW4n6aC23hiHR0Gi4tGQau1wuu84Vtrvh54'
);

console.log('🔍 Testing database connection...\n');

const { data: products, error } = await supabase
  .from('products')
  .select('id, title, category, price_rwf')
  .limit(5);

if (error) {
  console.error('❌ Error:', error);
} else {
  console.log(`✅ Successfully fetched ${products.length} products\n`);
  products.forEach((p, i) => {
    console.log(`${i + 1}. ${p.title} - ${p.category}`);
  });
}

const { count } = await supabase
  .from('products')
  .select('*', { count: 'exact', head: true });

console.log(`\n📊 Total: ${count} products in database`);
