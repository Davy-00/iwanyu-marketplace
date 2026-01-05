-- Vendor applications, vendor notifications, and product media

-- Vendor applications (admin approves/rejects)
create table if not exists public.vendor_applications (
	id text primary key,
	owner_user_id uuid not null references auth.users(id) on delete cascade,
	store_name text not null,
	location text,
	status text not null default 'pending' check (status in ('pending','approved','rejected')),
	vendor_id text references public.vendors(id) on delete set null,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

alter table public.vendor_applications enable row level security;

drop policy if exists "vendor_applications_select_own_or_admin" on public.vendor_applications;
create policy "vendor_applications_select_own_or_admin" on public.vendor_applications
for select using (
	public.is_admin(auth.uid())
	or owner_user_id = auth.uid()
);

drop policy if exists "vendor_applications_insert_own" on public.vendor_applications;
create policy "vendor_applications_insert_own" on public.vendor_applications
for insert with check (owner_user_id = auth.uid());

drop policy if exists "vendor_applications_update_admin" on public.vendor_applications;
create policy "vendor_applications_update_admin" on public.vendor_applications
for update using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

-- Vendor notifications (admin -> vendor)
create table if not exists public.vendor_notifications (
	id uuid primary key default gen_random_uuid(),
	vendor_id text not null references public.vendors(id) on delete cascade,
	product_id text references public.products(id) on delete set null,
	type text not null,
	title text not null,
	message text not null,
	created_by uuid references auth.users(id) on delete set null,
	created_at timestamptz not null default now(),
	read_at timestamptz
);

alter table public.vendor_notifications enable row level security;

drop policy if exists "vendor_notifications_select_vendor_or_admin" on public.vendor_notifications;
create policy "vendor_notifications_select_vendor_or_admin" on public.vendor_notifications
for select using (
	public.is_admin(auth.uid())
	or exists (
		select 1 from public.vendors v
		where v.id = vendor_id and v.owner_user_id = auth.uid()
	)
);

drop policy if exists "vendor_notifications_insert_admin" on public.vendor_notifications;
create policy "vendor_notifications_insert_admin" on public.vendor_notifications
for insert with check (public.is_admin(auth.uid()));

drop policy if exists "vendor_notifications_update_vendor_or_admin" on public.vendor_notifications;
create policy "vendor_notifications_update_vendor_or_admin" on public.vendor_notifications
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

-- Product media (multiple images/videos)
create table if not exists public.product_media (
	id uuid primary key default gen_random_uuid(),
	product_id text not null references public.products(id) on delete cascade,
	vendor_id text not null references public.vendors(id) on delete cascade,
	kind text not null check (kind in ('image','video')),
	url text not null,
	public_id text,
	position integer not null default 0,
	created_at timestamptz not null default now()
);

alter table public.product_media enable row level security;

-- Public can read media for storefront display
drop policy if exists "product_media_select_all" on public.product_media;
create policy "product_media_select_all" on public.product_media
for select using (true);

drop policy if exists "product_media_insert_owner_or_admin" on public.product_media;
create policy "product_media_insert_owner_or_admin" on public.product_media
for insert with check (
	public.is_admin(auth.uid())
	or exists (
		select 1 from public.vendors v
		where v.id = vendor_id and v.owner_user_id = auth.uid()
	)
);

drop policy if exists "product_media_delete_owner_or_admin" on public.product_media;
create policy "product_media_delete_owner_or_admin" on public.product_media
for delete using (
	public.is_admin(auth.uid())
	or exists (
		select 1 from public.vendors v
		where v.id = vendor_id and v.owner_user_id = auth.uid()
	)
);

-- Simple discounts (optional)
alter table public.products
	add column if not exists discount_percentage integer not null default 0
	check (discount_percentage >= 0 and discount_percentage <= 100);
