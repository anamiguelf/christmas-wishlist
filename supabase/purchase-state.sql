-- Correr uma vez no SQL Editor do Supabase.
-- Estados: disponivel -> reservado (claimed_at) -> comprado (purchased_at).
-- So quem reservou (token guardado no browser) pode cancelar ou marcar como comprado.
-- Estados so visiveis a quem abre o link de convite (#convite-<codigo>); o link normal nao mostra nada.

alter table public.products add column if not exists purchased_at timestamptz;

-- sem policies: so as funcoes security definer leem os tokens
create table if not exists public.claim_tokens (
  product_id uuid primary key references public.products(id) on delete cascade,
  token uuid not null
);
alter table public.claim_tokens enable row level security;

-- codigo do link de convite, gerado uma vez; sem policies
create table if not exists public.guest_access (code text primary key);
alter table public.guest_access enable row level security;
insert into public.guest_access
  select substr(replace(gen_random_uuid()::text, '-', ''), 1, 12)
  where not exists (select 1 from public.guest_access);

-- esconder os estados de leituras diretas a tabela.
-- atencao: colunas novas em products precisam de entrar neste grant
revoke select on public.products from anon, authenticated;
grant select (id, name, image_url, brand, store, price, size, color, description,
  purchase_url, category, is_demo, created_at, updated_at)
  on public.products to anon, authenticated;

create or replace function public.gift_states(p_code text)
returns table (id uuid, claimed_at timestamptz, purchased_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  if not exists (select 1 from guest_access g where g.code = p_code) then raise exception 'invalid invite'; end if;
  return query select p.id, p.claimed_at, p.purchased_at from products p;
end $$;

-- so a admin recebe o codigo, para copiar o link no painel
create or replace function public.guest_code()
returns text language sql stable security definer set search_path = public as $$
  select code from guest_access where is_admin() limit 1
$$;

drop function if exists public.claim_product(uuid, uuid);
create or replace function public.claim_product(p_product_id uuid, p_token uuid, p_code text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from guest_access g where g.code = p_code) then raise exception 'invalid invite'; end if;
  update products set claimed_at = now(), purchased_at = null
    where id = p_product_id and claimed_at is null;
  if not found then raise exception 'already reserved'; end if;
  insert into claim_tokens values (p_product_id, p_token)
    on conflict (product_id) do update set token = excluded.token;
end $$;

create or replace function public.release_product(p_product_id uuid, p_token uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  delete from claim_tokens where product_id = p_product_id and token = p_token;
  if not found then raise exception 'not your reservation'; end if;
  update products set claimed_at = null, purchased_at = null where id = p_product_id;
end $$;

create or replace function public.mark_purchased(p_product_id uuid, p_token uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from claim_tokens where product_id = p_product_id and token = p_token)
    then raise exception 'not your reservation'; end if;
  update products set purchased_at = now() where id = p_product_id;
end $$;

grant execute on function public.claim_product(uuid, uuid, text), public.gift_states(text), public.guest_code(),
  public.release_product(uuid, uuid), public.mark_purchased(uuid, uuid) to anon, authenticated;
