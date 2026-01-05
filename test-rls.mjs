import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://iakxtffxaevszuouapih.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlha3h0ZmZ4YWV2c3p1b3VhcGloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2MTgxNTIsImV4cCI6MjA4MzE5NDE1Mn0.phPO0WG3tW4n6aC23hiHR0Gi4tGQau1wuu84Vtrvh54'
);

console.log('Testing anonymous read access (simulating browser)...\n');

// Test 1: products table
const { data: products, error: prodError } = await supabase
  .from('products')
  .select('*')
  .limit(1);

console.log('Products table:');
if (prodError) {
  console.log('  ❌ Error:', prodError.message);
  console.log('  Code:', prodError.code);
  console.log('  Details:', prodError.details);
  console.log('  Hint:', prodError.hint);
} else {
  console.log('  ✅ Success -', products?.length || 0, 'products returned');
}

// Test 2: vendors table
const { data: vendors, error: vendError } = await supabase
  .from('vendors')
  .select('*')
  .limit(1);

console.log('\nVendors table:');
if (vendError) {
  console.log('  ❌ Error:', vendError.message);
  console.log('  Code:', vendError.code);
} else {
  console.log('  ✅ Success -', vendors?.length || 0, 'vendors returned');
}
