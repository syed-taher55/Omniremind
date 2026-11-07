-- Signup failed because handle_new_user compared a variable named slug
-- with the tenants.slug column, and Postgres rejected that as ambiguous.
-- Run this once in the SQL editor, then create the workspace again.

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

grant execute on function public.handle_new_user() to supabase_auth_admin;
