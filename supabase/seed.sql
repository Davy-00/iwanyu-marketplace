-- Seed storefront vendors + products (optional)
-- These rows have NULL owner_user_id (platform-owned).

insert into public.vendors (id, name, location, verified, owner_user_id)
values
  ('v_luanda_01', 'Luanda Market', 'Luanda, Angola', true, null),
  ('v_africa_01', 'Africa Trade Hub', 'Africa', false, null)
on conflict (id) do nothing;

-- Price conversion note: original demo data uses decimal prices.
-- Here we convert to an integer RWF amount by multiplying by 1000.

insert into public.products (
  id,
  vendor_id,
  title,
  description,
  category,
  price_rwf,
  image_url,
  in_stock,
  free_shipping,
  rating,
  review_count
) values
  ('1', 'v_luanda_01', 'Premium Wireless Headphones', 'Experience crystal-clear sound with our premium noise-cancelling wireless headphones.', 'Electronics', 199990, '/placeholder.svg', true, true, 4.8, 3245),
  ('2', 'v_africa_01', 'Ultra-Slim Laptop', 'Powerful performance in an incredibly thin and light design.', 'Electronics', 1299990, '/placeholder.svg', true, true, 4.7, 1876),
  ('3', 'v_luanda_01', 'Smart Home Hub', 'Control all your smart devices from one central hub with voice commands.', 'Smart Home', 129990, '/placeholder.svg', true, true, 4.5, 925),
  ('4', 'v_africa_01', 'Fitness Tracker Watch', 'Monitor your health and fitness goals with precision tracking and smart notifications.', 'Wearables', 79990, '/placeholder.svg', true, false, 4.6, 2134),
  ('5', 'v_luanda_01', 'Designer Desk Lamp', 'Elegant, adjustable LED desk lamp with multiple brightness settings.', 'Home Decor', 49990, '/placeholder.svg', true, true, 4.4, 687),
  ('6', 'v_africa_01', 'Professional Chef Knife Set', 'Premium stainless steel knife set, perfect for professional chefs and home cooking enthusiasts.', 'Kitchen', 189990, '/placeholder.svg', true, true, 4.9, 1253),
  ('7', 'v_luanda_01', 'Wireless Charging Pad', 'Fast wireless charging for all compatible devices with sleek, minimalist design.', 'Electronics', 29990, '/placeholder.svg', true, false, 4.3, 1589),
  ('8', 'v_africa_01', 'Ergonomic Office Chair', 'Premium comfort with adjustable features for all-day support during work hours.', 'Furniture', 249990, '/placeholder.svg', true, true, 4.7, 934)
  
  on conflict (id) do nothing;
