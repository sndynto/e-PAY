-- ─────────────────────────────────────────────────────────────────────────────
-- E-PAY  |  Migration 0001 — Initial schema
-- All monetary IDR values stored as integer minor units (1 IDR = 1 unit).
-- All USDC values stored as integer base units (1 USDC = 1_000_000 units, 6 dec).
-- ─────────────────────────────────────────────────────────────────────────────

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ─── profiles ────────────────────────────────────────────────────────────────
create table profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  full_name     text,
  phone         text,
  kyc_status    text not null default 'unverified'
                  check (kyc_status in ('unverified','pending','verified','rejected')),
  role          text not null default 'customer'
                  check (role in ('customer','merchant','admin')),
  onboarding_done boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ─── wallets ─────────────────────────────────────────────────────────────────
create table wallets (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references profiles(id) on delete cascade,
  address       text not null,
  chain_id      bigint not null,
  label         text,
  is_primary    boolean not null default false,
  verified_at   timestamptz,
  created_at    timestamptz not null default now(),
  unique (user_id, address, chain_id)
);

-- ─── purchase_quotes ─────────────────────────────────────────────────────────
create table purchase_quotes (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references profiles(id) on delete cascade,
  idr_amount      bigint not null check (idr_amount > 0),
  usdc_amount     bigint not null check (usdc_amount > 0),   -- 6-decimal integer
  fee_idr         bigint not null default 0,
  exchange_rate   numeric(20,8) not null,                    -- IDR per 1 USDC
  provider        text not null,
  provider_ref    text,
  expires_at      timestamptz not null,
  used            boolean not null default false,
  created_at      timestamptz not null default now()
);

-- ─── purchase_intents ────────────────────────────────────────────────────────
create table purchase_intents (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references profiles(id) on delete cascade,
  quote_id              uuid not null references purchase_quotes(id),
  wallet_id             uuid references wallets(id),
  recipient_address     text not null,
  idr_amount            bigint not null,
  usdc_amount           bigint not null,
  fee_idr               bigint not null default 0,
  status                text not null default 'CREATED'
                          check (status in (
                            'CREATED','QUOTED','PAYMENT_PENDING','PAYMENT_CONFIRMED',
                            'FULFILLMENT_PENDING','FULFILLMENT_SUBMITTED',
                            'FULFILLMENT_CONFIRMED','COMPLETED',
                            'EXPIRED','PAYMENT_FAILED','FULFILLMENT_FAILED','REQUIRES_REVIEW'
                          )),
  payment_provider      text not null,
  payment_session_id    text,
  payment_session_url   text,
  payment_confirmed_at  timestamptz,
  fulfillment_provider  text,
  fulfillment_tx_hash   text,
  fulfillment_submitted_at timestamptz,
  fulfillment_confirmed_at timestamptz,
  idempotency_key       text unique,
  expires_at            timestamptz,
  error_message         text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- ─── provider_events ─────────────────────────────────────────────────────────
-- Raw inbound webhook / polling events — immutable log for replay protection
create table provider_events (
  id              uuid primary key default gen_random_uuid(),
  provider        text not null,
  event_type      text not null,
  external_ref    text not null,
  payload         jsonb not null,
  intent_id       uuid references purchase_intents(id),
  processed       boolean not null default false,
  created_at      timestamptz not null default now(),
  unique (provider, external_ref, event_type)              -- dedup
);

-- ─── fulfillment_jobs ────────────────────────────────────────────────────────
create table fulfillment_jobs (
  id              uuid primary key default gen_random_uuid(),
  intent_id       uuid not null references purchase_intents(id),
  attempt         int not null default 1,
  status          text not null default 'PENDING'
                    check (status in ('PENDING','SUBMITTED','CONFIRMED','FAILED')),
  tx_hash         text,
  submitted_at    timestamptz,
  confirmed_at    timestamptz,
  error_message   text,
  created_at      timestamptz not null default now()
);

-- ─── merchants ───────────────────────────────────────────────────────────────
create table merchants (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null references profiles(id) on delete cascade,
  name            text not null,
  slug            text unique,
  wallet_address  text not null,
  chain_id        bigint not null default 5042002,
  status          text not null default 'active'
                    check (status in ('active','suspended','pending_review')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ─── invoices ────────────────────────────────────────────────────────────────
create table invoices (
  id                uuid primary key default gen_random_uuid(),
  merchant_id       uuid not null references merchants(id) on delete cascade,
  reference         text,
  description       text not null,
  amount_usdc       bigint not null check (amount_usdc > 0),  -- 6-decimal integer
  recipient_address text not null,
  chain_id          bigint not null default 5042002,
  usdc_contract     text not null,
  status            text not null default 'OPEN'
                      check (status in (
                        'DRAFT','OPEN','PAYMENT_PENDING','PAYMENT_CONFIRMED','PAID',
                        'EXPIRED','CANCELLED','UNDERPAID','OVERPAID','REQUIRES_REVIEW'
                      )),
  payment_tx_hash   text,
  payer_address     text,
  paid_at           timestamptz,
  expires_at        timestamptz,
  memo              text,
  metadata          jsonb,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index invoices_merchant_id_idx on invoices(merchant_id);
create index invoices_status_idx on invoices(status);

-- ─── blockchain_transactions ─────────────────────────────────────────────────
-- Verified onchain transactions (prevents replay / double-credit)
create table blockchain_transactions (
  id              uuid primary key default gen_random_uuid(),
  chain_id        bigint not null,
  tx_hash         text not null,
  block_number    bigint,
  from_address    text not null,
  to_address      text not null,
  token_contract  text not null,
  amount          bigint not null,                          -- 6-decimal integer
  status          text not null default 'PENDING'
                    check (status in ('PENDING','CONFIRMED','FAILED','REPLACED')),
  confirmed_at    timestamptz,
  raw_receipt     jsonb,
  created_at      timestamptz not null default now(),
  unique (chain_id, tx_hash)                               -- replay prevention
);

-- ─── transaction_records ─────────────────────────────────────────────────────
-- User-facing transaction log
create table transaction_records (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references profiles(id) on delete cascade,
  type              text not null
                      check (type in ('buy','send','receive','invoice_paid','invoice_received')),
  status            text not null default 'pending'
                      check (status in ('pending','completed','failed','requires_review')),
  usdc_amount       bigint not null,
  idr_amount        bigint,
  reference_id      uuid,          -- intent_id or invoice_id
  reference_type    text,          -- 'purchase_intent' | 'invoice'
  blockchain_tx_id  uuid references blockchain_transactions(id),
  description       text,
  metadata          jsonb,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index transaction_records_user_id_idx on transaction_records(user_id);
create index transaction_records_created_at_idx on transaction_records(created_at desc);

-- ─── audit_logs ──────────────────────────────────────────────────────────────
create table audit_logs (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references profiles(id),
  action        text not null,
  entity_type   text not null,
  entity_id     uuid,
  old_state     jsonb,
  new_state     jsonb,
  ip_address    inet,
  user_agent    text,
  metadata      jsonb,
  created_at    timestamptz not null default now()
);

create index audit_logs_entity_idx on audit_logs(entity_type, entity_id);
create index audit_logs_user_id_idx on audit_logs(user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────────────────────────────────────

alter table profiles              enable row level security;
alter table wallets               enable row level security;
alter table purchase_quotes       enable row level security;
alter table purchase_intents      enable row level security;
alter table provider_events       enable row level security;
alter table fulfillment_jobs      enable row level security;
alter table merchants             enable row level security;
alter table invoices              enable row level security;
alter table blockchain_transactions enable row level security;
alter table transaction_records   enable row level security;
alter table audit_logs            enable row level security;

-- profiles: users own their own row
create policy "profiles_self" on profiles
  for all using (auth.uid() = id);

-- wallets: users own their own wallets
create policy "wallets_self" on wallets
  for all using (auth.uid() = user_id);

-- purchase_quotes: users own their own quotes
create policy "quotes_self" on purchase_quotes
  for all using (auth.uid() = user_id);

-- purchase_intents: users own their own intents
create policy "intents_self" on purchase_intents
  for all using (auth.uid() = user_id);

-- provider_events: server-side only (service role bypasses RLS)
create policy "provider_events_none" on provider_events
  for all using (false);

-- fulfillment_jobs: server-side only
create policy "fulfillment_jobs_none" on fulfillment_jobs
  for all using (false);

-- merchants: owner sees their merchant
create policy "merchants_self" on merchants
  for all using (auth.uid() = owner_id);

-- invoices: merchant owner can see all invoices for their merchant
create policy "invoices_merchant_owner" on invoices
  for all using (
    exists (
      select 1 from merchants m
      where m.id = invoices.merchant_id
        and m.owner_id = auth.uid()
    )
  );

-- invoices: public read for OPEN/PAYMENT_PENDING invoices (hosted checkout)
create policy "invoices_public_read" on invoices
  for select using (status in ('OPEN','PAYMENT_PENDING'));

-- blockchain_transactions: server-side only (service role)
create policy "blockchain_txs_none" on blockchain_transactions
  for all using (false);

-- transaction_records: users own their records
create policy "tx_records_self" on transaction_records
  for all using (auth.uid() = user_id);

-- audit_logs: server-side only
create policy "audit_logs_none" on audit_logs
  for all using (false);

-- ─────────────────────────────────────────────────────────────────────────────
-- Functions & Triggers
-- ─────────────────────────────────────────────────────────────────────────────

-- Auto-update updated_at
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on profiles
  for each row execute procedure set_updated_at();
create trigger intents_updated_at before update on purchase_intents
  for each row execute procedure set_updated_at();
create trigger merchants_updated_at before update on merchants
  for each row execute procedure set_updated_at();
create trigger invoices_updated_at before update on invoices
  for each row execute procedure set_updated_at();
create trigger tx_records_updated_at before update on transaction_records
  for each row execute procedure set_updated_at();

-- Auto-create profile on sign-up
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
