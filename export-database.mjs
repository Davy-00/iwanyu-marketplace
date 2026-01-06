#!/usr/bin/env node

console.log('📊 EXPORTING LIVE DATABASE DATA');
console.log('===============================\n');

import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';

const supabaseUrl = 'https://iakxtffxaevszuouapih.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlha3h0ZmZ4YWV2c3p1b3VhcGloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2MTgxNTIsImV4cCI6MjA4MzE5NDE1Mn0.phPO0WG3tW4n6aC23hiHR0Gi4tGQau1wuu84Vtrvh54';

const supabase = createClient(supabaseUrl, supabaseKey);

async function exportAllData() {
  const exportData = {
    exported_at: new Date().toISOString(),
    database_url: supabaseUrl,
    tables: {}
  };

  try {
    // Export Products
    console.log('📦 Exporting products...');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (productsError) {
      console.log('❌ Products error:', productsError.message);
    } else {
      exportData.tables.products = products;
      console.log(`✅ Exported ${products?.length || 0} products`);
    }

    // Export Vendors
    console.log('🏪 Exporting vendors...');
    const { data: vendors, error: vendorsError } = await supabase
      .from('vendors')
      .select('*')
      .order('created_at', { ascending: false });

    if (vendorsError) {
      console.log('❌ Vendors error:', vendorsError.message);
    } else {
      exportData.tables.vendors = vendors;
      console.log(`✅ Exported ${vendors?.length || 0} vendors`);
    }

    // Export Vendor Applications
    console.log('📋 Exporting vendor applications...');
    const { data: applications, error: appsError } = await supabase
      .from('vendor_applications')
      .select('*')
      .order('created_at', { ascending: false });

    if (appsError) {
      console.log('❌ Vendor applications error:', appsError.message);
    } else {
      exportData.tables.vendor_applications = applications;
      console.log(`✅ Exported ${applications?.length || 0} vendor applications`);
    }

    // Export Users (if accessible)
    console.log('👥 Exporting user profiles...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (profilesError) {
      console.log('⚠️ Profiles not accessible (normal for security):', profilesError.message);
    } else {
      exportData.tables.profiles = profiles;
      console.log(`✅ Exported ${profiles?.length || 0} profiles`);
    }

    // Export Orders (if exists)
    console.log('🛒 Exporting orders...');
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (ordersError) {
      console.log('ℹ️ Orders table:', ordersError.message);
    } else {
      exportData.tables.orders = orders;
      console.log(`✅ Exported ${orders?.length || 0} orders`);
    }

    return exportData;

  } catch (error) {
    console.log('❌ Export error:', error.message);
    return null;
  }
}

async function saveExports(data) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  // Save as JSON
  const jsonFile = `database-export-${timestamp}.json`;
  writeFileSync(jsonFile, JSON.stringify(data, null, 2));
  console.log(`💾 Saved JSON export: ${jsonFile}`);

  // Save as CSV for each table
  for (const [tableName, tableData] of Object.entries(data.tables)) {
    if (tableData && tableData.length > 0) {
      const csvFile = `${tableName}-export-${timestamp}.csv`;
      const headers = Object.keys(tableData[0]);
      const csvContent = [
        headers.join(','),
        ...tableData.map(row => 
          headers.map(header => {
            let value = row[header];
            if (value === null || value === undefined) value = '';
            if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
              value = `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          }).join(',')
        )
      ].join('\n');
      
      writeFileSync(csvFile, csvContent);
      console.log(`💾 Saved CSV export: ${csvFile}`);
    }
  }

  // Generate summary
  console.log('\n📈 EXPORT SUMMARY');
  console.log('================');
  for (const [tableName, tableData] of Object.entries(data.tables)) {
    const count = tableData?.length || 0;
    console.log(`${tableName}: ${count} records`);
  }
  console.log(`\nExported at: ${data.exported_at}`);
  console.log(`Database: ${data.database_url}`);
}

// Run export
exportAllData().then(data => {
  if (data) {
    saveExports(data);
    console.log('\n✅ Database export completed successfully!');
  } else {
    console.log('\n❌ Export failed');
  }
}).catch(console.error);