import { createClient } from '@supabase/supabase-js';

// Test with the corrected URL (no newline)
const supabaseUrl = 'https://iakxtffxaevszuouapih.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlha3h0ZmZ4YWV2c3p1b3VhcGloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2MTgxNTIsImV4cCI6MjA4MzE5NDE1Mn0.phPO0WG3tW4n6aC23hiHR0Gi4tGQau1wuu84Vtrvh54';

console.log('Testing production environment variables...\n');
console.log('Supabase URL:', supabaseUrl);
console.log('URL length:', supabaseUrl.length);
console.log('URL has newline?', supabaseUrl.includes('\n'));

const supabase = createClient(supabaseUrl, supabaseKey);

const { data: products, error, count } = await supabase
  .from('products')
  .select('*', { count: 'exact' })
  .limit(5);

if (error) {
  console.log('\n❌ ERROR:', error.message);
} else {
  console.log('\n✅ SUCCESS!');
  console.log(`Total products: ${count}`);
  console.log('\nFirst 5 products:');
  products.forEach((p, i) => {
    console.log(`${i + 1}. ${p.title} - ${p.price_rwf} RWF`);
  });
}
