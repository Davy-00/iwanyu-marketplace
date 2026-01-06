#!/usr/bin/env node

console.log('🧪 TESTING UPDATED LIVE SITE FUNCTIONALITY');
console.log('=========================================\n');

const liveUrl = 'https://www.iwanyu.store';

async function testAllFunctionalities() {
  console.log('📦 1. BUNDLE VERSION CHECK\n');
  
  try {
    const response = await fetch(liveUrl);
    const html = await response.text();
    
    const scriptMatch = html.match(/<script[^>]*src="([^"]*index[^"]*\.js)"[^>]*>/);
    const bundleVersion = scriptMatch ? scriptMatch[1] : 'Not found';
    console.log('Bundle version:', bundleVersion);
    
    const hasCacheBust = html.includes('build-timestamp');
    console.log('Cache busting:', hasCacheBust ? '✅ Active' : '❌ Missing');
    
    const isNewBundle = !bundleVersion.includes('as_rG0hF');
    console.log('Bundle status:', isNewBundle ? '✅ Updated' : '❌ Still old');
    
  } catch (err) {
    console.log('❌ Error:', err.message);
  }
  
  console.log('\n🗄️ 2. DATABASE FUNCTIONALITY\n');
  
  try {
    // Test database directly to confirm it works
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      'https://iakxtffxaevszuouapih.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlha3h0ZmZ4YWV2c3p1b3VhcGloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2MTgxNTIsImV4cCI6MjA4MzE5NDE1Mn0.phPO0WG3tW4n6aC23hiHR0Gi4tGQau1wuu84Vtrvh54'
    );
    
    // Test the fixed schema queries
    const { data: vendors, error: vendorErr } = await supabase
      .from("vendors")
      .select("id, name, location, verified, owner_user_id, status") // Fixed: using status not revoked
      .limit(3);
      
    const { data: products, error: productErr } = await supabase
      .from("products")
      .select("id, title, category, price_rwf")
      .limit(3);
    
    console.log('✅ Vendors query:', vendorErr ? `❌ ${vendorErr.message}` : `✅ ${vendors?.length || 0} vendors loaded`);
    console.log('✅ Products query:', productErr ? `❌ ${productErr.message}` : `✅ ${products?.length || 0} products loaded`);
    
    if (vendors && vendors.length > 0) {
      console.log('   Sample vendor:', { name: vendors[0].name, status: vendors[0].status });
    }
    if (products && products.length > 0) {
      console.log('   Sample product:', { title: products[0].title, category: products[0].category });
    }
    
  } catch (err) {
    console.log('❌ Database test error:', err.message);
  }
  
  console.log('\n🌐 3. WEBSITE FUNCTIONALITY TESTS\n');
  
  // Test key routes
  const routes = ['/', '/login', '/cart', '/sell', '/search'];
  for (const route of routes) {
    try {
      const response = await fetch(`${liveUrl}${route}`);
      console.log(`${route}: ${response.status === 200 ? '✅' : '❌'} ${response.status}`);
    } catch (err) {
      console.log(`${route}: ❌ Error`);
    }
  }
  
  console.log('\n🎨 4. UI COMPONENT TESTS\n');
  
  try {
    const response = await fetch(liveUrl);
    const html = await response.text();
    
    // Test for key components that should be in the HTML
    const tests = [
      { name: 'React Root Div', test: html.includes('<div id="root">'), critical: true },
      { name: 'Iwanyu Branding', test: html.includes('iwanyu') || html.includes('Iwanyu'), critical: true },
      { name: 'Meta Tags', test: html.includes('viewport') && html.includes('description'), critical: false },
      { name: 'Vite Module Script', test: html.includes('type="module"'), critical: true },
      { name: 'CSS Bundle', test: html.includes('.css'), critical: true }
    ];
    
    tests.forEach(({ name, test, critical }) => {
      const status = test ? '✅' : (critical ? '❌' : '⚠️');
      console.log(`${status} ${name}: ${test ? 'Found' : 'Missing'}`);
    });
    
  } catch (err) {
    console.log('❌ UI test error:', err.message);
  }
  
  console.log('\n📱 5. PRODUCTION ENVIRONMENT TEST\n');
  
  try {
    const response = await fetch(liveUrl);
    const html = await response.text();
    
    // Check if this looks like a production build
    const isMinified = html.length < 5000; // Production HTML should be concise
    const hasSourceMaps = html.includes('.map');
    const hasDevTools = html.includes('react-refresh') || html.includes('__vite');
    
    console.log('✅ Minified HTML:', isMinified ? '✅ Yes' : '❌ No');
    console.log('✅ Source Maps:', hasSourceMaps ? '⚠️ Present' : '✅ Removed');
    console.log('✅ Dev Tools:', hasDevTools ? '⚠️ Present' : '✅ Removed');
    
  } catch (err) {
    console.log('❌ Production test error:', err.message);
  }
  
  console.log('\n🎯 FINAL ASSESSMENT\n');
  console.log('=================\n');
  
  console.log('Expected Results After Fix:');
  console.log('✅ Live site serves new JavaScript bundle');
  console.log('✅ Database queries use correct schema (status column)');
  console.log('✅ React app loads and executes properly');
  console.log('✅ Products display in category sections');
  console.log('✅ Search, cart, login functionality works');
  console.log('✅ Environment variables properly configured');
  
  console.log('\n💡 TO VERIFY FUNCTIONALITY:');
  console.log('1. Visit https://www.iwanyu.store');
  console.log('2. Open browser console (F12)');
  console.log('3. Look for: "🚀 iwanyu Marketplace - Version: Production Fix"');
  console.log('4. Check if products load in category sections');
  console.log('5. Test search, cart, and navigation');
  
  console.log('\n🔧 IF STILL ISSUES:');
  console.log('1. Hard refresh: Cmd+Shift+R or Ctrl+Shift+F5');
  console.log('2. Clear all browser data for iwanyu.store');
  console.log('3. Try incognito/private browsing window');
  console.log('4. Wait 2-3 minutes for global CDN propagation');
}

testAllFunctionalities().catch(console.error);