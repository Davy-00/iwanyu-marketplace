#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

console.log('🔍 Testing Live Site Database Connection...\n');

// These are the exact same environment variables as in .env.production.local
const SUPABASE_URL = 'https://iakxtffxaevszuouapih.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlha3h0ZmZ4YWV2c3p1b3VhcGloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2MTgxNTIsImV4cCI6MjA4MzE5NDE1Mn0.phPO0WG3tW4n6aC23hiHR0Gi4tGQau1wuu84Vtrvh54';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testConnection() {
  try {
    console.log('🔗 Environment Variables:');
    console.log('   URL:', SUPABASE_URL);
    console.log('   Key:', SUPABASE_ANON_KEY.substring(0, 20) + '...\n');

    // Test 1: Basic connection
    console.log('📊 Test 1: Database Connection');
    const { data: healthCheck, error: healthError } = await supabase
      .from('products')
      .select('count', { count: 'exact', head: true });
    
    if (healthError) {
      console.log('   ❌ Connection failed:', healthError.message);
      return false;
    }
    console.log(`   ✅ Connected successfully! Found ${healthCheck} products\n`);

    // Test 2: Products query (same as live site)
    console.log('📦 Test 2: Products Query (Live Site Logic)');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select(`
        id, name, price, category, image_url, vendor_id, status, 
        featured, created_at, description,
        vendors!vendor_id(id, name, location, verified, status)
      `)
      .eq('status', 'approved')
      .limit(10);
    
    if (productsError) {
      console.log('   ❌ Products query failed:', productsError.message);
      return false;
    }
    console.log(`   ✅ Products loaded: ${products.length} items`);
    console.log(`   📋 Sample: ${products[0]?.name} - ${products[0]?.category}\n`);

    // Test 3: Vendors query (with corrected schema)
    console.log('👥 Test 3: Vendors Query (Fixed Schema)');
    const { data: vendors, error: vendorsError } = await supabase
      .from('vendors')
      .select('id, name, location, verified, owner_user_id, status')
      .neq('status', 'revoked');
    
    if (vendorsError) {
      console.log('   ❌ Vendors query failed:', vendorsError.message);
      return false;
    }
    console.log(`   ✅ Vendors loaded: ${vendors.length} active vendors`);
    console.log(`   📋 Sample: ${vendors[0]?.name} - ${vendors[0]?.status}\n`);

    // Test 4: Categories check
    console.log('📂 Test 4: Categories Analysis');
    const { data: categoryData, error: categoryError } = await supabase
      .from('products')
      .select('category')
      .eq('status', 'approved');
    
    if (categoryError) {
      console.log('   ❌ Categories query failed:', categoryError.message);
      return false;
    }

    const categories = [...new Set(categoryData.map(p => p.category))];
    console.log(`   ✅ Categories found: ${categories.length}`);
    console.log(`   📋 List: ${categories.join(', ')}\n`);

    console.log('🎯 CONCLUSION: Database is fully connected and working!');
    console.log('   Live site should be displaying all data correctly.');
    
    return true;
  } catch (error) {
    console.log('💥 Unexpected error:', error.message);
    return false;
  }
}

testConnection();