-- =============================================================
-- Autom8 — Supabase Database Schema
-- Run this in the Supabase SQL Editor or via supabase db push
-- =============================================================

-- ---------------------------------------------------------------
-- 0. Extensions
-- ---------------------------------------------------------------
create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------
-- 1. profiles
--    Auto-created when a new auth.users record is inserted.
-- ---------------------------------------------------------------
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  full_name    text,
  avatar_url   text,
  created_at   timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can delete their own profile"
  on public.profiles for delete
  using (auth.uid() = id);

-- Trigger: auto-create a profiles row + starter subscription on new signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  );

  insert into public.subscriptions (user_id, plan, status, reply_limit)
  values (new.id, 'starter', 'trialing', 250);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------
-- 2. brand_profiles
-- ---------------------------------------------------------------
create table if not exists public.brand_profiles (
  id                 uuid primary key default uuid_generate_v4(),
  user_id            uuid not null references public.profiles(id) on delete cascade,
  business_name      text not null,
  industry           text,
  website_url        text,
  description        text,
  tone               text[] default '{}',
  tone_notes         text,
  cta_keywords       text[] default '{}',
  escalation_rules   text,
  emoji_allowed      boolean not null default true,
  formality_level    integer not null default 50
    check (formality_level >= 0 and formality_level <= 100),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  constraint brand_profiles_user_id_unique unique(user_id)
);

create index if not exists brand_profiles_user_id_idx on public.brand_profiles(user_id);

alter table public.brand_profiles enable row level security;

create policy "Users can view their own brand profile"
  on public.brand_profiles for select
  using (auth.uid() = user_id);

create policy "Users can insert their own brand profile"
  on public.brand_profiles for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own brand profile"
  on public.brand_profiles for update
  using (auth.uid() = user_id);

create policy "Users can delete their own brand profile"
  on public.brand_profiles for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------
-- 3. services (line items for brand profile)
-- ---------------------------------------------------------------
create table if not exists public.services (
  id             uuid primary key default uuid_generate_v4(),
  brand_id       uuid not null references public.brand_profiles(id) on delete cascade,
  service_name   text not null,
  price_range    text,
  sort_order     integer not null default 0
);

create index if not exists services_brand_id_idx on public.services(brand_id);

alter table public.services enable row level security;

create policy "Users can view their own services"
  on public.services for select
  using (
    auth.uid() = (
      select user_id from public.brand_profiles where id = brand_id
    )
  );

create policy "Users can insert their own services"
  on public.services for insert
  with check (
    auth.uid() = (
      select user_id from public.brand_profiles where id = brand_id
    )
  );

create policy "Users can update their own services"
  on public.services for update
  using (
    auth.uid() = (
      select user_id from public.brand_profiles where id = brand_id
    )
  );

create policy "Users can delete their own services"
  on public.services for delete
  using (
    auth.uid() = (
      select user_id from public.brand_profiles where id = brand_id
    )
  );

-- ---------------------------------------------------------------
-- 4. social_accounts
-- ---------------------------------------------------------------
create table if not exists public.social_accounts (
  id                      uuid primary key default uuid_generate_v4(),
  user_id                 uuid not null references public.profiles(id) on delete cascade,
  platform                text not null check (platform in ('instagram', 'facebook')),
  external_account_id     text,
  access_token_encrypted  text,
  connected_at            timestamptz,
  status                  text not null default 'pending'
    check (status in ('pending', 'active', 'expired', 'disconnected'))
);

create index if not exists social_accounts_user_id_idx on public.social_accounts(user_id);
create index if not exists social_accounts_status_idx on public.social_accounts(status);

alter table public.social_accounts enable row level security;

create policy "Users can view their own social accounts"
  on public.social_accounts for select
  using (auth.uid() = user_id);

create policy "Users can insert their own social accounts"
  on public.social_accounts for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own social accounts"
  on public.social_accounts for update
  using (auth.uid() = user_id);

create policy "Users can delete their own social accounts"
  on public.social_accounts for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------
-- 5. comments (inbound Instagram/Facebook comments)
-- ---------------------------------------------------------------
create table if not exists public.comments (
  id                    uuid primary key default uuid_generate_v4(),
  social_account_id     uuid not null references public.social_accounts(id) on delete cascade,
  external_comment_id   text unique,
  commenter_username    text,
  comment_text          text not null,
  post_url              text,
  received_at           timestamptz not null default now()
);

create index if not exists comments_social_account_id_idx on public.comments(social_account_id);

alter table public.comments enable row level security;

create policy "Users can view their own comments"
  on public.comments for select
  using (
    auth.uid() = (
      select user_id from public.social_accounts where id = social_account_id
    )
  );

create policy "Users can insert their own comments"
  on public.comments for insert
  with check (
    auth.uid() = (
      select user_id from public.social_accounts where id = social_account_id
    )
  );

create policy "Users can update their own comments"
  on public.comments for update
  using (
    auth.uid() = (
      select user_id from public.social_accounts where id = social_account_id
    )
  );

create policy "Users can delete their own comments"
  on public.comments for delete
  using (
    auth.uid() = (
      select user_id from public.social_accounts where id = social_account_id
    )
  );

-- ---------------------------------------------------------------
-- 6. ai_replies
-- ---------------------------------------------------------------
create table if not exists public.ai_replies (
  id                uuid primary key default uuid_generate_v4(),
  comment_id        uuid not null references public.comments(id) on delete cascade,
  draft_text        text not null,
  edited_text       text,
  status            text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'posted')),
  reviewed_by       uuid references auth.users(id),
  reviewed_at       timestamptz,
  rejection_reason  text,
  created_at        timestamptz not null default now()
);

create index if not exists ai_replies_comment_id_idx on public.ai_replies(comment_id);
create index if not exists ai_replies_status_idx on public.ai_replies(status);

alter table public.ai_replies enable row level security;

-- RLS via the comment → social_account → user chain
create policy "Users can view their own ai_replies"
  on public.ai_replies for select
  using (
    auth.uid() = (
      select sa.user_id
      from public.comments c
      join public.social_accounts sa on sa.id = c.social_account_id
      where c.id = comment_id
    )
  );

create policy "Users can insert their own ai_replies"
  on public.ai_replies for insert
  with check (
    auth.uid() = (
      select sa.user_id
      from public.comments c
      join public.social_accounts sa on sa.id = c.social_account_id
      where c.id = comment_id
    )
  );

create policy "Users can update their own ai_replies"
  on public.ai_replies for update
  using (
    auth.uid() = (
      select sa.user_id
      from public.comments c
      join public.social_accounts sa on sa.id = c.social_account_id
      where c.id = comment_id
    )
  );

create policy "Users can delete their own ai_replies"
  on public.ai_replies for delete
  using (
    auth.uid() = (
      select sa.user_id
      from public.comments c
      join public.social_accounts sa on sa.id = c.social_account_id
      where c.id = comment_id
    )
  );

-- ---------------------------------------------------------------
-- 7. usage_events
-- ---------------------------------------------------------------
create table if not exists public.usage_events (
  id                    uuid primary key default uuid_generate_v4(),
  user_id               uuid not null references public.profiles(id) on delete cascade,
  event_type            text not null
    check (event_type in ('reply_generated', 'reply_posted')),
  occurred_at           timestamptz not null default now(),
  billing_period_start  date not null
);

create index if not exists usage_events_user_id_idx on public.usage_events(user_id);
create index if not exists usage_events_billing_period_idx
  on public.usage_events(user_id, billing_period_start);

alter table public.usage_events enable row level security;

create policy "Users can view their own usage events"
  on public.usage_events for select
  using (auth.uid() = user_id);

create policy "Users can insert their own usage events"
  on public.usage_events for insert
  with check (auth.uid() = user_id);

-- usage_events are append-only; no update/delete policies

-- ---------------------------------------------------------------
-- 8. subscriptions
-- ---------------------------------------------------------------
create table if not exists public.subscriptions (
  id                       uuid primary key default uuid_generate_v4(),
  user_id                  uuid not null references public.profiles(id) on delete cascade,
  stripe_customer_id       text unique,
  stripe_subscription_id   text unique,
  plan                     text not null default 'starter'
    check (plan in ('starter', 'growth', 'scale')),
  status                   text not null default 'trialing'
    check (status in ('active', 'trialing', 'past_due', 'cancelled', 'incomplete')),
  current_period_start     timestamptz,
  current_period_end       timestamptz,
  reply_limit              integer not null default 250,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create index if not exists subscriptions_user_id_idx on public.subscriptions(user_id);
create index if not exists subscriptions_status_idx on public.subscriptions(status);
create index if not exists subscriptions_stripe_customer_idx
  on public.subscriptions(stripe_customer_id);

alter table public.subscriptions enable row level security;

create policy "Users can view their own subscription"
  on public.subscriptions for select
  using (auth.uid() = user_id);

create policy "Users can insert their own subscription"
  on public.subscriptions for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own subscription"
  on public.subscriptions for update
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------
-- 9. user_preferences
-- ---------------------------------------------------------------
create table if not exists public.user_preferences (
  id                  uuid primary key default uuid_generate_v4(),
  user_id             uuid not null unique references public.profiles(id) on delete cascade,
  weekly_digest       boolean not null default true,
  reply_reminders     boolean not null default true,
  usage_alerts        boolean not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists user_preferences_user_id_idx on public.user_preferences(user_id);

alter table public.user_preferences enable row level security;

create policy "Users can view their own preferences"
  on public.user_preferences for select
  using (auth.uid() = user_id);

create policy "Users can insert their own preferences"
  on public.user_preferences for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own preferences"
  on public.user_preferences for update
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------
-- 10. waitlist_entries (Instagram connection waitlist)
-- ---------------------------------------------------------------
create table if not exists public.waitlist_entries (
  id          uuid primary key default uuid_generate_v4(),
  email       text not null,
  source      text,
  created_at  timestamptz not null default now()
);

-- No RLS needed — public inserts are intentional; reads restricted to service role.
alter table public.waitlist_entries enable row level security;

create policy "Anyone can join the waitlist"
  on public.waitlist_entries for insert
  with check (true);

-- ---------------------------------------------------------------
-- 11. updated_at trigger helper
-- ---------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_brand_profiles_updated_at
  before update on public.brand_profiles
  for each row execute procedure public.set_updated_at();

create trigger set_subscriptions_updated_at
  before update on public.subscriptions
  for each row execute procedure public.set_updated_at();

create trigger set_user_preferences_updated_at
  before update on public.user_preferences
  for each row execute procedure public.set_updated_at();
