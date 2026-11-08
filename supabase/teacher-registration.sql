-- 기존 데이터는 유지합니다. schema.sql 적용 후 이 파일을 실행하세요.
begin;

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('user', 'admin', 'owner'));

drop policy if exists "admins_can_insert_school_items" on public.school_items;
create policy "admins_can_insert_school_items" on public.school_items for insert to authenticated
  with check (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'owner')));

drop policy if exists "admins_can_update_school_items" on public.school_items;
create policy "admins_can_update_school_items" on public.school_items for update to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'owner')))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'owner')));

drop policy if exists "admins_can_delete_school_items" on public.school_items;
create policy "admins_can_delete_school_items" on public.school_items for delete to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'owner')));

create or replace function public.pending_teacher_accounts()
returns table (id uuid, email text, created_at timestamptz)
language plpgsql security definer set search_path = ''
as $$
begin
  if not exists (select 1 from public.profiles where profiles.id = auth.uid() and role = 'owner') then
    raise exception '대표 관리자 권한이 필요합니다.' using errcode = '42501';
  end if;

  return query
    select p.id, u.email::text, p.created_at
    from public.profiles p
    join auth.users u on u.id = p.id
    where p.role = 'user' and u.email_confirmed_at is not null
    order by p.created_at, p.id;
end;
$$;

create or replace function public.approve_teacher_account(account_id uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if not exists (select 1 from public.profiles where profiles.id = auth.uid() and role = 'owner') then
    raise exception '대표 관리자 권한이 필요합니다.' using errcode = '42501';
  end if;

  update public.profiles p set role = 'admin'
    where p.id = account_id and p.role = 'user'
      and exists (select 1 from auth.users u where u.id = p.id and u.email_confirmed_at is not null);
  if not found then
    raise exception '승인할 수 없는 계정입니다.';
  end if;
end;
$$;

revoke all on function public.pending_teacher_accounts() from public, anon, authenticated;
revoke all on function public.approve_teacher_account(uuid) from public, anon, authenticated;
grant execute on function public.pending_teacher_accounts() to authenticated;
grant execute on function public.approve_teacher_account(uuid) to authenticated;

commit;
