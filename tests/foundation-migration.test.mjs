import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";

const migrationUrl = new URL("../supabase/migrations/20260810190000_initial_academias_foundation.sql", import.meta.url);

async function setIdentity(db, userId) {
  await db.exec("reset role");
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [userId]);
  await db.query("select set_config('request.jwt.claim.role', 'authenticated', false)");
  await db.exec("set role authenticated");
}

test("migration cria a fundação e RLS isola organizações", async () => {
  const db = new PGlite();
  await db.waitReady;
  await db.exec(`
    create role anon nologin;
    create role authenticated nologin;
    create role service_role nologin;
    create schema auth;
    create table auth.users (
      id uuid primary key,
      raw_user_meta_data jsonb not null default '{}'::jsonb
    );
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
    $$;
    create function auth.role() returns text language sql stable as $$
      select nullif(current_setting('request.jwt.claim.role', true), '')
    $$;
    grant usage on schema auth to authenticated;
    grant execute on function auth.uid() to authenticated;
    grant execute on function auth.role() to authenticated;
  `);

  const migration = (await readFile(migrationUrl, "utf8")).replace(
    "create extension if not exists pgcrypto;",
    "-- pgcrypto já está disponível no Supabase; PGlite usa gen_random_uuid do core.",
  );
  await db.exec(migration);

  const tableResult = await db.query(`
    select count(*)::int as count
    from information_schema.tables
    where table_schema = 'public'
      and table_name = any(array[
        'organizations','branches','profiles','organization_memberships','roles',
        'permissions','role_permissions','membership_roles','organization_settings',
        'domains','audit_logs'
      ])
  `);
  assert.equal(tableResult.rows[0].count, 11);

  const permissionResult = await db.query("select count(*)::int as count from public.permissions");
  assert.equal(permissionResult.rows[0].count, 18);

  const userOne = "10000000-0000-4000-8000-000000000001";
  const userTwo = "20000000-0000-4000-8000-000000000002";
  await db.query("insert into auth.users (id, raw_user_meta_data) values ($1, $2::jsonb), ($3, $4::jsonb)", [
    userOne, JSON.stringify({ full_name: "Owner Alpha" }),
    userTwo, JSON.stringify({ full_name: "Owner Beta" }),
  ]);

  await setIdentity(db, userOne);
  await db.query("select public.create_organization_with_owner($1,$2,$3,$4,$5,$6,$7)", ["Academia Alpha", "academia-alpha", "Centro", null, null, "Salvador", "BA"]);

  await setIdentity(db, userTwo);
  await db.query("select public.create_organization_with_owner($1,$2,$3,$4,$5,$6,$7)", ["Academia Beta", "academia-beta", "Principal", null, null, "Feira de Santana", "BA"]);

  await setIdentity(db, userOne);
  const visibleOrganizations = await db.query("select slug from public.organizations order by slug");
  assert.deepEqual(visibleOrganizations.rows, [{ slug: "academia-alpha" }]);

  await assert.rejects(
    db.query("update public.profiles set platform_role = 'super_admin' where id = $1", [userOne]),
    /Somente um administrador da plataforma/,
  );

  await db.exec("reset role");
  const auditResult = await db.query("select count(*)::int as count from public.audit_logs where action = 'organization.created'");
  assert.equal(auditResult.rows[0].count, 2);

  await db.close();
});
