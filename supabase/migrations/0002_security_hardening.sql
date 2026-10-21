-- ─────────────────────────────────────────────────────────────────────────────
-- E-PAY  |  Migration 0002 — Security hardening
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Unique constraint on blockchain_transactions (chain_id, tx_hash) ───────
-- Already present in 0001, but add a partial index for faster lookups.
create index if not exists btx_hash_confirmed_idx
  on blockchain_transactions(chain_id, tx_hash)
  where status = 'CONFIRMED';

-- ── 2. Prevent a single tx_hash from crediting more than one invoice ──────────
-- Enforce at the DB level — in-memory Set in JS is insufficient across restarts.
alter table invoices
  add column if not exists credited_tx_hash text;

create unique index if not exists invoices_credited_tx_unique
  on invoices(credited_tx_hash)
  where credited_tx_hash is not null;

-- ── 3. Atomic purchase intent status transitions via UPDATE … WHERE ───────────
-- (No migration needed — enforced in application logic with optimistic lock.)

-- ── 4. Add idempotency_key index ──────────────────────────────────────────────
create index if not exists purchase_intents_idempotency_idx
  on purchase_intents(idempotency_key);

-- ── 5. Rate-limit tracking table (used when Supabase is live) ────────────────
create table if not exists rate_limit_buckets (
  key          text not null,
  window_start timestamptz not null default now(),
  count        int not null default 1,
  primary key (key)
);

-- Allow server-side only (service role)
alter table rate_limit_buckets enable row level security;
create policy "rate_limit_none" on rate_limit_buckets
  for all using (false);

-- ── 6. Webhook deduplication — provider_events already has unique(provider, external_ref, event_type)
-- Add processed_at for audit trail
alter table provider_events
  add column if not exists processed_at timestamptz;

-- ── 7. Admin role — enforce via DB function, not just UI ─────────────────────
-- Returns true if the calling JWT belongs to an admin profile.
create or replace function is_admin()
returns boolean
language sql security definer
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ── 8. Restrict admin-visible tables to admin role ────────────────────────────
-- audit_logs: admins can read
create policy "audit_logs_admin_read" on audit_logs
  for select using (is_admin());

-- provider_events: admins can read
create policy "provider_events_admin_read" on provider_events
  for select using (is_admin());

-- fulfillment_jobs: admins can read
create policy "fulfillment_jobs_admin_read" on fulfillment_jobs
  for select using (is_admin());

-- ── 9. Invoice: payer read for OPEN invoices (already in 0001 as public_read) ─
-- Ensure PAID invoices are NOT publicly readable after payment.
-- (The existing policy "invoices_public_read" only selects OPEN | PAYMENT_PENDING — correct.)

-- ── 10. Prevent profiles.role elevation by users ─────────────────────────────
-- Users can UPDATE their own profile but NOT change the role column.
drop policy if exists "profiles_self" on profiles;

create policy "profiles_self_read" on profiles
  for select using (auth.uid() = id);

create policy "profiles_self_update" on profiles
  for update using (auth.uid() = id)
  with check (
    auth.uid() = id
    -- Disallow role changes: the new role must equal the existing role
    and role = (select role from profiles where id = auth.uid())
  );

create policy "profiles_self_insert" on profiles
  for insert with check (auth.uid() = id);
