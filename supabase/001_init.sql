-- OmniRemind schema. Run once in the Supabase SQL editor on a new free project.
-- Then enable Realtime if the publication block warns, and run supabase/cron.sql after deploy.

create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  vertical text not null check (vertical in ('hospital', 'school', 'retail')),
  timezone text not null default 'UTC',
  currency text not null default 'USD',
  created_at timestamptz not null default now()
);

create table public.memberships (
  user_id uuid not null references auth.users (id) on delete cascade,
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'staff')),
  primary key (user_id, tenant_id)
);

create index memberships_tenant_idx on public.memberships (tenant_id, user_id);

create table public.wallets (
  tenant_id uuid primary key references public.tenants (id) on delete cascade,
  balance_credits integer not null default 0 check (balance_credits >= 0),
  credit_cost_per_message integer not null default 1 check (credit_cost_per_message >= 1),
  updated_at timestamptz not null default now()
);

create table public.wallet_ledger (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  delta integer not null,
  reason text not null,
  created_at timestamptz not null default now()
);

create index wallet_ledger_tenant_idx on public.wallet_ledger (tenant_id, created_at desc);

create table public.meta_settings (
  tenant_id uuid primary key references public.tenants (id) on delete cascade,
  phone_number_id text not null default '',
  template_name text not null default 'reminder_notice',
  template_language text not null default 'en',
  updated_at timestamptz not null default now()
);

create unique index meta_settings_phone_uidx
  on public.meta_settings (phone_number_id)
  where phone_number_id <> '';

create table public.meta_secrets (
  tenant_id uuid primary key references public.tenants (id) on delete cascade,
  access_token text not null default '',
  app_secret text not null default ''
);

create table public.api_keys (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  name text not null default 'CRM',
  key_prefix text not null,
  key_hash text not null unique,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

create index api_keys_tenant_idx on public.api_keys (tenant_id);

create table public.reminders (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  recipient_name text not null,
  phone_e164 text not null check (phone_e164 ~ '^[0-9]{8,15}$'),
  send_at timestamptz not null,
  template_params jsonb not null default '[]'::jsonb check (jsonb_typeof(template_params) = 'array'),
  status text not null default 'pending' check (
    status in ('pending', 'sending', 'paused', 'sent', 'delivered', 'read', 'failed')
  ),
  wa_message_id text,
  last_error text,
  estimated_value_cents integer not null default 0 check (estimated_value_cents >= 0),
  source text not null default 'manual' check (source in ('manual', 'csv', 'api')),
  external_id text,
  claimed_at timestamptz,
  sent_at timestamptz,
  delivered_at timestamptz,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index reminders_due_idx on public.reminders (send_at) where status = 'pending';
create index reminders_tenant_idx on public.reminders (tenant_id, created_at desc);
create index reminders_tenant_status_idx on public.reminders (tenant_id, status);
create index reminders_wa_idx on public.reminders (tenant_id, wa_message_id);
create unique index reminders_external_uidx
  on public.reminders (tenant_id, external_id)
  where external_id is not null;

alter table public.reminders replica identity full;
alter table public.wallets replica identity full;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  biz text;
  vert text;
  tz text;
  chosen_currency text;
  base_slug text;
  chosen_slug text;
  new_tenant uuid;
begin
  biz := left(coalesce(nullif(btrim(new.raw_user_meta_data ->> 'business_name'), ''), 'Workspace'), 80);
  vert := coalesce(new.raw_user_meta_data ->> 'vertical', 'retail');
  if vert not in ('hospital', 'school', 'retail') then
    vert := 'retail';
  end if;
  tz := coalesce(nullif(btrim(new.raw_user_meta_data ->> 'timezone'), ''), 'UTC');
  if tz !~ '^[A-Za-z0-9_+/-]{1,64}$' then
    tz := 'UTC';
  end if;
  chosen_currency := upper(coalesce(new.raw_user_meta_data ->> 'currency', 'USD'));
  if chosen_currency !~ '^[A-Z]{3}$' then
    chosen_currency := 'USD';
  end if;
  base_slug := left(trim(both '-' from regexp_replace(lower(biz), '[^a-z0-9]+', '-', 'g')), 40);
  if base_slug = '' then
    base_slug := 'workspace';
  end if;
  chosen_slug := base_slug;
  if exists (select 1 from public.tenants t where t.slug = chosen_slug) then
    chosen_slug := base_slug || '-' || substr(replace(new.id::text, '-', ''), 1, 8);
  end if;

  insert into public.tenants (name, slug, vertical, timezone, currency)
  values (biz, chosen_slug, vert, tz, chosen_currency)
  returning id into new_tenant;

  insert into public.memberships (user_id, tenant_id, role)
  values (new.id, new_tenant, 'owner');
  insert into public.wallets (tenant_id) values (new_tenant);
  insert into public.meta_settings (tenant_id) values (new_tenant);
  insert into public.meta_secrets (tenant_id) values (new_tenant);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.reminder_stats()
returns table (status text, n bigint, value_cents bigint)
language sql
stable
security invoker
set search_path = public
as $$
  select r.status, count(*)::bigint, coalesce(sum(r.estimated_value_cents), 0)::bigint
  from public.reminders r
  group by r.status;
$$;

create or replace function public.secret_flags()
returns table (has_token boolean, has_secret boolean)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  tid uuid;
begin
  select m.tenant_id into tid
  from public.memberships m
  where m.user_id = auth.uid()
  limit 1;
  if tid is null then
    return;
  end if;
  return query
  select
    length(s.access_token) > 0,
    length(s.app_secret) > 0
  from public.meta_secrets s
  where s.tenant_id = tid;
end;
$$;

create or replace function public.tenant_dispatch_context(p_tenant uuid)
returns table (
  balance integer,
  cost integer,
  phone_number_id text,
  access_token text,
  template_name text,
  template_language text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    w.balance_credits,
    w.credit_cost_per_message,
    s.phone_number_id,
    coalesce(sec.access_token, ''),
    s.template_name,
    s.template_language
  from public.wallets w
  join public.meta_settings s on s.tenant_id = w.tenant_id
  left join public.meta_secrets sec on sec.tenant_id = w.tenant_id
  where w.tenant_id = p_tenant;
$$;

create or replace function public.claim_due_reminders(p_batch integer)
returns setof public.reminders
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  with due as (
    select r.id
    from public.reminders r
    where r.status = 'pending' and r.send_at <= now()
    order by r.send_at
    limit greatest(1, least(coalesce(p_batch, 8), 20))
    for update skip locked
  )
  update public.reminders reminder
  set status = 'sending', claimed_at = now()
  from due
  where reminder.id = due.id
  returning reminder.*;
end;
$$;

create or replace function public.release_stale_claims()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  released integer;
begin
  update public.reminders
  set status = 'pending', claimed_at = null
  where status = 'sending'
    and claimed_at < now() - interval '5 minutes';
  get diagnostics released = row_count;
  return released;
end;
$$;

create or replace function public.spend_credits(p_tenant uuid, p_amount integer, p_reason text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  new_balance integer;
begin
  if p_amount is null or p_amount <= 0 or p_amount > 1000000 then
    raise exception 'invalid amount';
  end if;
  if p_reason is null or length(btrim(p_reason)) = 0 or length(p_reason) > 80 then
    raise exception 'invalid reason';
  end if;
  update public.wallets
  set balance_credits = balance_credits - p_amount,
      updated_at = now()
  where tenant_id = p_tenant
    and balance_credits >= p_amount
  returning balance_credits into new_balance;
  if not found then
    return -1;
  end if;
  insert into public.wallet_ledger (tenant_id, delta, reason)
  values (p_tenant, -p_amount, p_reason);
  return new_balance;
end;
$$;

create or replace function public.add_credits(
  p_tenant uuid,
  p_amount integer,
  p_reason text,
  p_release boolean
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  new_balance integer;
begin
  if p_amount is null or p_amount <= 0 or p_amount > 1000000 then
    raise exception 'invalid amount';
  end if;
  if p_reason is null or length(btrim(p_reason)) = 0 or length(p_reason) > 80 then
    raise exception 'invalid reason';
  end if;
  update public.wallets
  set balance_credits = balance_credits + p_amount,
      updated_at = now()
  where tenant_id = p_tenant
    and balance_credits <= 2000000000 - p_amount
  returning balance_credits into new_balance;
  if not found then
    raise exception 'wallet missing or full';
  end if;
  insert into public.wallet_ledger (tenant_id, delta, reason)
  values (p_tenant, p_amount, p_reason);
  if coalesce(p_release, false) then
    update public.reminders
    set status = 'pending', last_error = null
    where tenant_id = p_tenant and status = 'paused';
  end if;
  return new_balance;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;
-- Auth inserts the user as supabase_auth_admin, which must be allowed to fire this trigger.
grant execute on function public.handle_new_user() to supabase_auth_admin;
revoke all on function public.reminder_stats() from public;
revoke all on function public.secret_flags() from public;
revoke all on function public.tenant_dispatch_context(uuid) from public, anon, authenticated;
revoke all on function public.claim_due_reminders(integer) from public, anon, authenticated;
revoke all on function public.release_stale_claims() from public, anon, authenticated;
revoke all on function public.spend_credits(uuid, integer, text) from public, anon, authenticated;
revoke all on function public.add_credits(uuid, integer, text, boolean) from public, anon, authenticated;

grant execute on function public.reminder_stats() to authenticated, service_role;
grant execute on function public.secret_flags() to authenticated, service_role;
grant execute on function public.tenant_dispatch_context(uuid) to service_role;
grant execute on function public.claim_due_reminders(integer) to service_role;
grant execute on function public.release_stale_claims() to service_role;
grant execute on function public.spend_credits(uuid, integer, text) to service_role;
grant execute on function public.add_credits(uuid, integer, text, boolean) to service_role;

alter table public.tenants enable row level security;
alter table public.memberships enable row level security;
alter table public.wallets enable row level security;
alter table public.wallet_ledger enable row level security;
alter table public.meta_settings enable row level security;
alter table public.meta_secrets enable row level security;
alter table public.api_keys enable row level security;
alter table public.reminders enable row level security;

revoke all on table public.meta_secrets from anon, authenticated;
grant all on table public.meta_secrets to service_role;

create policy tenants_select on public.tenants
  for select to authenticated
  using (
    exists (
      select 1 from public.memberships m
      where m.tenant_id = tenants.id and m.user_id = auth.uid()
    )
  );

create policy tenants_update on public.tenants
  for update to authenticated
  using (
    exists (
      select 1 from public.memberships m
      where m.tenant_id = tenants.id and m.user_id = auth.uid() and m.role = 'owner'
    )
  )
  with check (
    exists (
      select 1 from public.memberships m
      where m.tenant_id = tenants.id and m.user_id = auth.uid() and m.role = 'owner'
    )
  );

create policy memberships_select on public.memberships
  for select to authenticated
  using (user_id = auth.uid());

create policy wallets_select on public.wallets
  for select to authenticated
  using (
    exists (
      select 1 from public.memberships m
      where m.tenant_id = wallets.tenant_id and m.user_id = auth.uid()
    )
  );

create policy ledger_select on public.wallet_ledger
  for select to authenticated
  using (
    exists (
      select 1 from public.memberships m
      where m.tenant_id = wallet_ledger.tenant_id and m.user_id = auth.uid()
    )
  );

create policy meta_select on public.meta_settings
  for select to authenticated
  using (
    exists (
      select 1 from public.memberships m
      where m.tenant_id = meta_settings.tenant_id and m.user_id = auth.uid()
    )
  );

create policy meta_update on public.meta_settings
  for update to authenticated
  using (
    exists (
      select 1 from public.memberships m
      where m.tenant_id = meta_settings.tenant_id and m.user_id = auth.uid() and m.role = 'owner'
    )
  )
  with check (
    exists (
      select 1 from public.memberships m
      where m.tenant_id = meta_settings.tenant_id and m.user_id = auth.uid() and m.role = 'owner'
    )
  );

create policy reminders_select on public.reminders
  for select to authenticated
  using (
    exists (
      select 1 from public.memberships m
      where m.tenant_id = reminders.tenant_id and m.user_id = auth.uid()
    )
  );

create policy reminders_insert on public.reminders
  for insert to authenticated
  with check (
    status = 'pending'
    and exists (
      select 1 from public.memberships m
      where m.tenant_id = reminders.tenant_id and m.user_id = auth.uid()
    )
  );

create policy reminders_retry on public.reminders
  for update to authenticated
  using (
    status = 'failed'
    and exists (
      select 1 from public.memberships m
      where m.tenant_id = reminders.tenant_id and m.user_id = auth.uid()
    )
  )
  with check (
    status = 'pending'
    and exists (
      select 1 from public.memberships m
      where m.tenant_id = reminders.tenant_id and m.user_id = auth.uid()
    )
  );

create policy api_keys_select on public.api_keys
  for select to authenticated
  using (
    exists (
      select 1 from public.memberships m
      where m.tenant_id = api_keys.tenant_id and m.user_id = auth.uid() and m.role = 'owner'
    )
  );

create policy api_keys_insert on public.api_keys
  for insert to authenticated
  with check (
    revoked_at is null
    and exists (
      select 1 from public.memberships m
      where m.tenant_id = api_keys.tenant_id and m.user_id = auth.uid() and m.role = 'owner'
    )
  );

create policy api_keys_revoke on public.api_keys
  for update to authenticated
  using (
    revoked_at is null
    and exists (
      select 1 from public.memberships m
      where m.tenant_id = api_keys.tenant_id and m.user_id = auth.uid() and m.role = 'owner'
    )
  )
  with check (
    revoked_at is not null
    and exists (
      select 1 from public.memberships m
      where m.tenant_id = api_keys.tenant_id and m.user_id = auth.uid() and m.role = 'owner'
    )
  );

revoke insert, update, delete on table public.wallets from anon, authenticated;
revoke insert, update, delete on table public.wallet_ledger from anon, authenticated;

do $$
begin
  alter publication supabase_realtime add table public.reminders;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.wallets;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;
