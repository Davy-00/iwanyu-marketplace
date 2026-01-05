-- Marketplace schema (minimal production-ready baseline)

create extension if not exists "pgcrypto";

-- Profiles (role lives here)
create table if not exists public.profiles (
	id uuid primary key references auth.users(id) on delete cascade,
	email text,
	full_name text,
	avatar_url text,
	role text not null default 'buyer' check (role in ('buyer','seller','admin')),
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
	insert into public.profiles (id, email, full_name, avatar_url)
	values (
		new.id,
		new.email,
		coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
		coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture')
	)
	on conflict (id) do update
		set email = excluded.email,
				full_name = excluded.full_name,
				avatar_url = excluded.avatar_url,
				updated_at = now();
	return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.is_admin(uid uuid)
returns boolean
language sql
stable
as $$
	select exists (
		select 1 from public.profiles p where p.id = uid and p.role = 'admin'
	);
$$;

-- Vendors (stores)
create table if not exists public.vendors (
	id text primary key,
	name text not null,
	location text,
	verified boolean not null default false,
	owner_user_id uuid references auth.users(id) on delete cascade,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

-- Products
create table if not exists public.products (
	id text primary key,
	vendor_id text not null references public.vendors(id) on delete cascade,
	title text not null,
	description text,
	category text,
	price_rwf integer not null check (price_rwf >= 0),
	image_url text,
	image_public_id text,
	in_stock boolean not null default true,
	free_shipping boolean not null default false,
	rating real not null default 0,
	review_count integer not null default 0,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

-- Orders (buyer-facing)
create table if not exists public.orders (
	id text primary key,
	buyer_user_id uuid not null references auth.users(id) on delete restrict,
	buyer_email text,
	shipping_address text not null,
	status text not null default 'Placed' check (status in ('Placed','Processing','Shipped','Delivered','Cancelled')),
	total_rwf integer not null check (total_rwf >= 0),
	payment jsonb not null,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

-- Order items (seller fulfillment happens here)
create table if not exists public.order_items (
	order_id text not null references public.orders(id) on delete cascade,
	product_id text not null references public.products(id) on delete restrict,
	vendor_id text not null references public.vendors(id) on delete restrict,
	title text not null,
	price_rwf integer not null check (price_rwf >= 0),
	quantity integer not null check (quantity > 0),
	image_url text,
	status text not null default 'Placed' check (status in ('Placed','Processing','Shipped','Delivered','Cancelled')),
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	primary key (order_id, product_id)
);

-- Payments (Flutterwave, etc.)
create table if not exists public.payments (
	id text primary key,
	order_id text not null references public.orders(id) on delete cascade,
	provider text not null default 'flutterwave',
	status text not null,
	amount_rwf integer not null check (amount_rwf >= 0),
	currency text not null default 'RWF',
	tx_ref text not null unique,
	flw_transaction_id bigint,
	raw jsonb,
	created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.vendors enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;

-- Profiles policies
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
for select using (auth.uid() = id or public.is_admin(auth.uid()));

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
for update using (auth.uid() = id or public.is_admin(auth.uid()))
with check (auth.uid() = id or public.is_admin(auth.uid()));

-- Vendors policies
drop policy if exists "vendors_select_all" on public.vendors;
create policy "vendors_select_all" on public.vendors
for select using (true);

drop policy if exists "vendors_insert_owner" on public.vendors;
create policy "vendors_insert_owner" on public.vendors
for insert with check (
	public.is_admin(auth.uid())
	or owner_user_id = auth.uid()
	or (owner_user_id is null and public.is_admin(auth.uid()))
);

drop policy if exists "vendors_update_owner" on public.vendors;
create policy "vendors_update_owner" on public.vendors
for update using (auth.uid() = owner_user_id or public.is_admin(auth.uid()))
with check (auth.uid() = owner_user_id or public.is_admin(auth.uid()));

-- Products policies
drop policy if exists "products_select_all" on public.products;
create policy "products_select_all" on public.products
for select using (true);

drop policy if exists "products_insert_owner" on public.products;
create policy "products_insert_owner" on public.products
for insert with check (
	public.is_admin(auth.uid())
	or exists (
		select 1 from public.vendors v
		where v.id = vendor_id and v.owner_user_id = auth.uid()
	)
);

drop policy if exists "products_update_owner" on public.products;
create policy "products_update_owner" on public.products
for update using (
	public.is_admin(auth.uid())
	or exists (
		select 1 from public.vendors v
		where v.id = vendor_id and v.owner_user_id = auth.uid()
	)
)
with check (
	public.is_admin(auth.uid())
	or exists (
		select 1 from public.vendors v
		where v.id = vendor_id and v.owner_user_id = auth.uid()
	)
);

drop policy if exists "products_delete_owner" on public.products;
create policy "products_delete_owner" on public.products
for delete using (
	public.is_admin(auth.uid())
	or exists (
		select 1 from public.vendors v
		where v.id = vendor_id and v.owner_user_id = auth.uid()
	)
);

-- Orders policies
drop policy if exists "orders_select_buyer" on public.orders;
create policy "orders_select_buyer" on public.orders
for select using (auth.uid() = buyer_user_id or public.is_admin(auth.uid()));

drop policy if exists "orders_insert_buyer" on public.orders;
create policy "orders_insert_buyer" on public.orders
for insert with check (auth.uid() = buyer_user_id or public.is_admin(auth.uid()));

-- Sellers should not freely update orders; use item-level updates instead.
drop policy if exists "orders_update_admin" on public.orders;
create policy "orders_update_admin" on public.orders
for update using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

-- Order items policies
drop policy if exists "order_items_select_buyer_or_seller" on public.order_items;
create policy "order_items_select_buyer_or_seller" on public.order_items
for select using (
	public.is_admin(auth.uid())
	or exists (select 1 from public.orders o where o.id = order_id and o.buyer_user_id = auth.uid())
	or exists (select 1 from public.vendors v where v.id = vendor_id and v.owner_user_id = auth.uid())
);

drop policy if exists "order_items_insert_buyer" on public.order_items;
create policy "order_items_insert_buyer" on public.order_items
for insert with check (
	public.is_admin(auth.uid())
	or exists (select 1 from public.orders o where o.id = order_id and o.buyer_user_id = auth.uid())
);

drop policy if exists "order_items_update_seller" on public.order_items;
create policy "order_items_update_seller" on public.order_items
for update using (
	public.is_admin(auth.uid())
	or exists (select 1 from public.vendors v where v.id = vendor_id and v.owner_user_id = auth.uid())
)
with check (
	public.is_admin(auth.uid())
	or exists (select 1 from public.vendors v where v.id = vendor_id and v.owner_user_id = auth.uid())
);

-- Payments policies (read-only for buyer/admin; writes happen via server-side verification)
drop policy if exists "payments_select_buyer_or_admin" on public.payments;
create policy "payments_select_buyer_or_admin" on public.payments
for select using (
	public.is_admin(auth.uid())
	or exists (select 1 from public.orders o where o.id = order_id and o.buyer_user_id = auth.uid())
);

