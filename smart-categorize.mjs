import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local
dotenv.config({ path: join(__dirname, '.env.local') });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// Smart categorization keywords
const CATEGORY_KEYWORDS = {
  'Electronics': ['electronic', 'electronics', 'gadget', 'camera', 'optics', 'charger', 'adapter'],
  'Phones': ['phone', 'smartphone', 'iphone', 'android', 'mobile', 'cell'],
  'Computers': ['computer', 'pc', 'desktop', 'monitor', 'keyboard', 'mouse'],
  'Laptops': ['laptop', 'notebook', 'macbook', 'chromebook'],
  'Kitchen': ['kitchen', 'cookware', 'utensil', 'pot', 'pan', 'appliance', 'blender'],
  'Home': ['home', 'decor', 'bedding', 'household', 'wallpaper', 'furniture', 'lamp', 'cushion'],
  'Fashion': ['fashion', 'clothing', 'apparel', 'wear', 'dress', 'shirt', 't-shirt', 'tshirt', 'pant', 'pants', 'pantaloon', 'trouser', 'jumper', 'hoodie', 'hoodies', 'sweater', 'jacket', 'coat', 'jeans', 'skirt', 'blouse', 'top', 'polo'],
  'Shoes': ['shoe', 'shoes', 'sneaker', 'boot', 'boots', 'heel', 'heels', 'sandal', 'sandals', 'adidas', 'nike', 'slipper', 'loafer', 'award'],
  'Bags': ['bag', 'bags', 'backpack', 'handbag', 'purse', 'luggage', 'suitcase', 'tote'],
  'Jewelry': ['jewelry', 'jewellery', 'necklace', 'bracelet', 'earring', 'ring', 'chain', 'pendant'],
  'Beauty': ['beauty', 'cosmetic', 'makeup', 'skincare', 'lotion', 'cream', 'perfume', 'fragrance'],
  'Health': ['health', 'wellness', 'supplement', 'vitamin', 'fitness'],
  'Sports': ['sport', 'sports', 'gym', 'workout', 'athletic', 'exercise'],
  'Toys': ['toy', 'toys', 'kids', 'children', 'baby', 'doll', 'puzzle'],
  'Books': ['book', 'books', 'stationery', 'notebook', 'pen', 'pencil'],
  'Gaming': ['game', 'games', 'gaming', 'console', 'playstation', 'xbox', 'nintendo']
};

function smartCategorize(productName, currentCategory) {
  const name = productName.toLowerCase();
  
  // Check each category's keywords
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (name.includes(keyword)) {
        return category;
      }
    }
  }
  
  // If no match found, keep current or set to Other
  return currentCategory || 'Other';
}

async function main() {
  console.log('🤖 Starting Smart Product Categorization...\n');
  
  // Fetch all products
  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, category');
    
  if (error) {
    console.error('❌ Error fetching products:', error);
    return;
  }
  
  console.log(`📦 Found ${products.length} products\n`);
  
  let updated = 0;
  let unchanged = 0;
  const updates = [];
  
  for (const product of products) {
    const newCategory = smartCategorize(product.name, product.category);
    
    if (newCategory !== product.category) {
      updates.push({
        id: product.id,
        name: product.name,
        oldCategory: product.category || 'NULL',
        newCategory
      });
      updated++;
    } else {
      unchanged++;
    }
  }
  
  console.log(`\n📊 Categorization Summary:`);
  console.log(`   ✅ Products to update: ${updated}`);
  console.log(`   ⏭️  Products unchanged: ${unchanged}`);
  
  if (updates.length > 0) {
    console.log(`\n🔄 Sample Updates (first 10):`);
    updates.slice(0, 10).forEach(u => {
      console.log(`   "${u.name.substring(0, 40)}"`);
      console.log(`   ${u.oldCategory} → ${u.newCategory}\n`);
    });
    
    console.log(`\n💾 Updating database...`);
    
    // Update in batches
    for (const update of updates) {
      const { error: updateError } = await supabase
        .from('products')
        .update({ category: update.newCategory })
        .eq('id', update.id);
        
      if (updateError) {
        console.error(`   ❌ Error updating ${update.name}:`, updateError);
      }
    }
    
    console.log(`\n✅ Done! Updated ${updates.length} products`);
    
    // Show final category distribution
    const { data: finalProducts } = await supabase.from('products').select('category');
    const categoryCounts = {};
    finalProducts.forEach(p => {
      const cat = p.category || 'NULL';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });
    
    console.log(`\n📂 Final Category Distribution:`);
    Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([cat, count]) => {
        console.log(`   ${cat}: ${count} products`);
      });
  }
}

main();
