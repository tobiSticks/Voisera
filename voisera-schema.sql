-- ============================================================
-- VOISERA — Database schema
-- ACE Startup Academy 2026 · MVP
--
-- Run this once in the Supabase SQL Editor.
-- Keep this file in the repo. It IS the contract between the
-- extraction pipeline (writes) and the dashboard (reads).
-- ============================================================


-- ------------------------------------------------------------
-- 1. BUSINESSES
--    One row per trader. Created by the pipeline on first message.
-- ------------------------------------------------------------

create table if not exists businesses (
  id                uuid primary key default gen_random_uuid(),
  telegram_user_id  bigint unique not null,
  name              text,
  phone             text,
  created_at        timestamptz not null default now()
);

comment on column businesses.telegram_user_id is
  'How an incoming message is matched to a business. No login step for the trader.';


-- ------------------------------------------------------------
-- 2. TRANSACTIONS
--    The core table. Pipeline inserts, dashboard reads.
--    CHECK constraints are deliberate: a bad LLM value should
--    fail loudly on Day 2, not corrupt totals silently.
-- ------------------------------------------------------------

create table if not exists transactions (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references businesses(id) on delete cascade,
  type         text not null check (type in ('sale', 'expense')),
  item         text,
  amount       numeric(14,2) not null check (amount >= 0),
  category     text,
  raw_text     text,
  source       text not null default 'voice' check (source in ('voice', 'photo', 'text')),
  confidence   numeric(3,2) check (confidence between 0 and 1),
  created_at   timestamptz not null default now()
);

comment on column transactions.amount is
  'NAIRA. Not kobo. No currency conversion anywhere in the pipeline.';
comment on column transactions.raw_text is
  'Original transcript. Always store it, even on confident extractions — it is what lets a bad record be corrected instead of lost.';

-- Indexes — the dashboard filters by business and orders by time constantly.
create index if not exists idx_transactions_business_created
  on transactions (business_id, created_at desc);

create index if not exists idx_transactions_category
  on transactions (business_id, category);


-- ------------------------------------------------------------
-- 3. DAILY SUMMARIES (view, not a stored table)
--    Aggregation lives in Postgres, not in the dashboard.
-- ------------------------------------------------------------

create or replace view daily_summaries as
select
  business_id,
  (created_at at time zone 'Africa/Lagos')::date        as date,
  sum(amount) filter (where type = 'sale')              as total_sales,
  sum(amount) filter (where type = 'expense')           as total_expenses,
  coalesce(sum(amount) filter (where type = 'sale'), 0)
    - coalesce(sum(amount) filter (where type = 'expense'), 0) as profit,
  count(*)                                              as transaction_count
from transactions
group by business_id, (created_at at time zone 'Africa/Lagos')::date;

-- Note the WAT timezone cast: without it, "today" rolls over at 1am
-- Lagos time and the demo shows the wrong daily total.


-- ------------------------------------------------------------
-- 4. SCORES (Phase 2 — stub, intentionally unpopulated)
--    Exists so the roadmap is architected for, not just claimed.
-- ------------------------------------------------------------

create table if not exists scores (
  business_id  uuid primary key references businesses(id) on delete cascade,
  score        integer check (score between 0 and 100),
  factors      jsonb,
  computed_at  timestamptz default now()
);


-- ------------------------------------------------------------
-- 5. REALTIME
--    NOT enabled by default. Without this the dashboard
--    subscription fires nothing and looks broken.
-- ------------------------------------------------------------

alter publication supabase_realtime add table transactions;


-- ------------------------------------------------------------
-- 6. ROW LEVEL SECURITY
--
--    MVP has no dashboard auth. With RLS on and no policy,
--    reads via the anon key return an EMPTY ARRAY WITH NO ERROR
--    — indistinguishable from a broken query. Hours lost to this.
--
--    Option A (below): RLS on, permissive policies. Honest about
--    the fact that it is wide open, easy to tighten later.
--
--    DO NOT ship this to real users. Add Supabase Auth and
--    scope policies to auth.uid() before anyone real signs up.
-- ------------------------------------------------------------

alter table businesses   enable row level security;
alter table transactions enable row level security;
alter table scores       enable row level security;

create policy "demo_open_read_businesses"   on businesses   for select using (true);
create policy "demo_open_write_businesses"  on businesses   for insert with check (true);

create policy "demo_open_read_transactions"  on transactions for select using (true);
create policy "demo_open_write_transactions" on transactions for insert with check (true);
create policy "demo_open_update_transactions" on transactions for update using (true);

create policy "demo_open_read_scores" on scores for select using (true);


-- ============================================================
-- SEED DATA
--
-- Lets the dashboard be built and demoed with zero dependency
-- on the extraction pipeline. Safe to re-run after a DB wipe.
-- ============================================================

insert into businesses (id, telegram_user_id, name, phone)
values ('11111111-1111-1111-1111-111111111111', 999000001, 'Amaka Provisions', '+2348000000001')
on conflict (telegram_user_id) do nothing;

insert into transactions (business_id, type, item, amount, category, raw_text, source, confidence, created_at)
values
  ('11111111-1111-1111-1111-111111111111', 'sale',    'Rice (3 bags)',      12000, 'sales',       'sold three bags of rice, twelve thousand naira',  'voice', 0.95, now() - interval '2 hours'),
  ('11111111-1111-1111-1111-111111111111', 'sale',    'Beans (2 paint)',     6500, 'sales',       'two paint of beans, six thousand five hundred',   'voice', 0.92, now() - interval '4 hours'),
  ('11111111-1111-1111-1111-111111111111', 'sale',    'Groundnut oil',       4200, 'sales',       'sold groundnut oil four thousand two hundred',    'voice', 0.88, now() - interval '5 hours'),
  ('11111111-1111-1111-1111-111111111111', 'expense', 'Rice restock',        8500, 'restocking',  'bought rice restock eight thousand five hundred', 'photo', 0.79, now() - interval '6 hours'),
  ('11111111-1111-1111-1111-111111111111', 'expense', 'Transport to market', 1500, 'transport',   'transport to market one thousand five hundred',   'voice', 0.91, now() - interval '7 hours'),

  ('11111111-1111-1111-1111-111111111111', 'sale',    'Rice (5 bags)',      20000, 'sales',       'five bags of rice twenty thousand',               'voice', 0.94, now() - interval '1 day'),
  ('11111111-1111-1111-1111-111111111111', 'sale',    'Sachet water carton', 1800, 'sales',       'carton of pure water one thousand eight hundred',  'voice', 0.90, now() - interval '1 day'),
  ('11111111-1111-1111-1111-111111111111', 'expense', 'Beans restock',      14000, 'restocking',  'beans restock fourteen thousand',                 'voice', 0.86, now() - interval '1 day'),
  ('11111111-1111-1111-1111-111111111111', 'expense', 'Shop rent (weekly)',  5000, 'rent',        'paid shop rent five thousand',                    'voice', 0.93, now() - interval '1 day'),

  ('11111111-1111-1111-1111-111111111111', 'sale',    'Assorted provisions',15400, 'sales',       'sold provisions fifteen thousand four hundred',    'voice', 0.83, now() - interval '2 days'),
  ('11111111-1111-1111-1111-111111111111', 'sale',    'Tomato paste',        3200, 'sales',       'tomato paste three thousand two hundred',         'voice', 0.89, now() - interval '2 days'),
  ('11111111-1111-1111-1111-111111111111', 'expense', 'Oil restock',         9800, 'restocking',  'oil restock nine thousand eight hundred',         'photo', 0.71, now() - interval '2 days'),

  ('11111111-1111-1111-1111-111111111111', 'sale',    'Rice (2 bags)',       8000, 'sales',       'two bags rice eight thousand',                    'voice', 0.96, now() - interval '3 days'),
  ('11111111-1111-1111-1111-111111111111', 'sale',    'Semovita',            5600, 'sales',       'semovita five thousand six hundred',              'voice', 0.87, now() - interval '3 days'),
  ('11111111-1111-1111-1111-111111111111', 'expense', 'Transport',           1200, 'transport',   'transport one thousand two hundred',              'voice', 0.94, now() - interval '3 days'),

  ('11111111-1111-1111-1111-111111111111', 'sale',    'Provisions mixed',   11200, 'sales',       'mixed provisions eleven thousand two hundred',    'voice', 0.81, now() - interval '4 days'),
  ('11111111-1111-1111-1111-111111111111', 'expense', 'Restock general',    17500, 'restocking',  'general restock seventeen thousand five hundred', 'voice', 0.85, now() - interval '4 days'),
  ('11111111-1111-1111-1111-111111111111', 'expense', 'Airtime / data',       800, 'utilities',   'airtime eight hundred',                           'voice', 0.97, now() - interval '4 days'),

  ('11111111-1111-1111-1111-111111111111', 'sale',    'Rice (4 bags)',      16000, 'sales',       'four bags rice sixteen thousand',                 'voice', 0.93, now() - interval '5 days'),
  ('11111111-1111-1111-1111-111111111111', 'sale',    'Palm oil',            7400, 'sales',       'palm oil seven thousand four hundred',            'voice', 0.90, now() - interval '5 days'),
  ('11111111-1111-1111-1111-111111111111', 'expense', 'Transport to market', 1500, 'transport',   'transport one thousand five hundred',             'voice', 0.92, now() - interval '5 days'),

  ('11111111-1111-1111-1111-111111111111', 'sale',    'Provisions',          9300, 'sales',       'provisions nine thousand three hundred',          'voice', 0.84, now() - interval '6 days'),
  ('11111111-1111-1111-1111-111111111111', 'expense', 'Rice restock',       12000, 'restocking',  'rice restock twelve thousand',                    'photo', 0.68, now() - interval '6 days'),

  ('11111111-1111-1111-1111-111111111111', 'sale',    'Beans (3 paint)',     9750, 'sales',       'three paint beans nine thousand seven fifty',     'voice', 0.91, now() - interval '7 days'),
  ('11111111-1111-1111-1111-111111111111', 'expense', 'Shop rent (weekly)',  5000, 'rent',        'shop rent five thousand',                         'voice', 0.95, now() - interval '7 days');


-- ============================================================
-- VERIFY — run these after applying, before writing any app code
-- ============================================================
-- select count(*) from transactions;                    -- expect 25
-- select * from daily_summaries order by date desc;     -- expect 8 day-rows
-- select tablename from pg_publication_tables
--   where pubname = 'supabase_realtime';                -- expect transactions
