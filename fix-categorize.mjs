import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env.local') });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// Smart categorization keywords (comprehensive - order matters!)
const CATEGORY_KEYWORDS = {
  'Shoes': ['shoe', 'shoes', 'sneaker', 'sneakers', 'boot', 'boots', 'heel', 'heels', 'sandal', 'sandals', 'adidas', 'nike', 'slipper', 'loafer', 'footwear', 'award', 'new balance', 'running shoe', 'trainer', 'trainers'],
  'Fashion': ['fashion', 'clothing', 'apparel', 'wear', 'dress', 'dresses', 'shirt', 't-shirt', 'tshirt', 'pant', 'pants', 'pantaloon', 'trouser', 'jumper', 'hoodie', 'hoodies', 'sweater', 'jacket', 'coat', 'jeans', 'skirt', 'blouse', 'top', 'polo', 'legging', 'short', 'shorts'],
  'Phones': ['phone', 'smartphone', 'iphone', 'android', 'mobile', 'cell', 'samsung'],
  'Computers': ['computer', 'pc', 'desktop', 'monitor', 'keyboard', 'mouse'],
  'Laptops': ['laptop', 'notebook', 'macbook', 'chromebook'],
  'Electronics': ['electronic', 'electronics', 'gadget', 'camera', 'optics', 'charger', 'adapter', 'cable'],
  'Kitchen': ['kitchen', 'cookware', 'utensil', 'pot', 'pan', 'appliance', 'blender'],
  'Home': ['home', 'decor', 'bedding', 'household', 'wallpaper', 'furniture', 'lamp', 'cushion', 'pillow', 'curtain'],
  'Bags': ['bag', 'bags', 'backpack', 'handbag', 'purse', 'luggage', 'suitcase', 'tote'],
  'Jewelry': ['jewelry', 'jewellery', 'necklace', 'bracelet', 'earring', 'ring', 'chain', 'pendant', 'watch'],
  'Beauty': ['beauty', 'cosmetic', 'makeup', 'skincare', 'lotion', 'cream', 'perfume', 'fragrance', 'lipstick'],
  'Health': ['health', 'wellness', 'supplement', 'vitamin', 'fitness'],
  'Sports': ['sport', 'sports', 'gym', 'workout', 'athletic', 'exercise'],
  'Toys': ['toy', 'toys', 'kids', 'children', 'baby', 'doll', 'puzzle'],
  'Books': ['book', 'books', 'stationery', 'pen', 'pencil'],
  'Gaming': ['game', 'games', 'gaming', 'console', 'playstation', 'xbox', 'nintendo']
};

function smartCategorize(productTitle) {
  const title = productTitle.toLowerCase();
  
  // Check each category's keywords (order matters - more specific first)
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (title.includes(keyword)) {
        return category;
      }
    }
  }
  
  return 'Other';
}

async function main() {
  console.log('🤖 Starting Smart Product Categorization...\n');
  
  // Fetch all products (using title field)
  const { data: products, error } = await supabase
    .from('products')
    .select('id, title, category');
    
  if (error) {
    console.error('❌ Error fetching products:', error);
    return;
  }
  
  console.log(`📦 Found ${products.length} products\n`);
  
  const updates = [];
  
  for (const product of products) {
    const newCategory = smartCategorize(product.title);
    
    if (newCategory !== product.category) {
      updates.push({
        id: product.id,
        title: product.title,
        oldCategory: product.category || 'NULL',
        newCategory
      });
    }
  }
  
  console.log(`📊 Categorization Summary:`);
  console.log(`   ✅ Products to update: ${updates.length}`);
  console.log(`   ⏭️  Products unchanged: ${products.length - updates.length}`);
  
  if (updates.length > 0) {
    console.log(`\n🔄 Sample Updates (first 15):`);
    updates.slice(0, 15).forEach((u, i) => {
      console.log(`${i+1}. "${u.title.substring(0, 50)}"`);
      console.log(`   ${u.oldCategory} → ${u.newCategory}\n`);
    });
    
    console.log(`💾 Updating database...`);
    
    let successCount = 0;
    for (const update of updates) {
      const { error: updateError } = await supabase
        .from('products')
        .update({ category: update.newCategory })
        .eq('id', update.id);
        
      if (updateError) {
        console.error(`❌ Error updating "${update.title}":`, updateError.message);
      } else {
        successCount++;
      }
    }
    
    console.log(`\n✅ Successfully updated ${successCount}/${updates.length} products`);
    
    // Show final category distribution
    const { data: finalProducts } = await supabase.from('products').select('category');
    const categoryCounts = {};
    finalProducts.forEach(p => {
      const cat = p.category || 'Other';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });
    
    console.log(`\n📂 Final Category Distribution:`);
    Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([cat, count]) => {
        console.log(`   ${cat.padEnd(15)} : ${count} products`);
      });
  } else {
    console.log('\n✅ All products already properly categorized!');
  }
}

main();
