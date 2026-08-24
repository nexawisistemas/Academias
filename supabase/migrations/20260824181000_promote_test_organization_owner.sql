begin;

do $$
declare
  v_owner_count integer;
  v_owner_profile_id uuid;
begin
  select count(distinct m.profile_id), min(m.profile_id::text)::uuid
  into v_owner_count, v_owner_profile_id
  from public.organizations o
  join public.organization_memberships m
    on m.organization_id = o.id and m.status = 'active'
  join public.membership_roles mr on mr.membership_id = m.id
  join public.roles r on r.id = mr.role_id and r.code = 'owner'
  where o.slug = 'teste';

  if v_owner_count <> 1 or v_owner_profile_id is null then
    raise exception 'A organização teste precisa ter exatamente um proprietário ativo.';
  end if;

  update public.profiles
  set platform_role = 'super_admin'
  where id = v_owner_profile_id;
end;
$$;

commit;
