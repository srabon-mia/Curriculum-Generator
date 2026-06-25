-- 0002_rls.sql
-- Row Level Security policies.
-- Principle: published content is publicly readable; drafts/admin actions
-- require auth; progress is strictly scoped to the owning user.
--
-- NOTE: this defines an `is_admin` check against a simple allowlist table
-- rather than Supabase custom claims, since this is a single-admin (Shafiq)
-- tool for v1 -- simplest thing that works. Can graduate to role-based
-- claims later if more curators are added.

create table admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

create or replace function is_admin()
returns boolean as $$
  select exists (
    select 1 from admins where user_id = auth.uid()
  );
$$ language sql stable security definer;

-- ============================================================
-- CURRICULA
-- ============================================================
alter table curricula enable row level security;

create policy "Published curricula are publicly readable"
  on curricula for select
  using (status = 'published' or is_admin());

create policy "Only admins can write curricula"
  on curricula for all
  using (is_admin())
  with check (is_admin());

-- ============================================================
-- NODES / MAJOR_UNDERSTANDINGS
-- Readable if the parent curriculum is published (or caller is admin).
-- ============================================================
alter table nodes enable row level security;

create policy "Nodes readable if curriculum published"
  on nodes for select
  using (
    is_admin() or exists (
      select 1 from curricula c
      where c.id = nodes.curriculum_id and c.status = 'published'
    )
  );

create policy "Only admins can write nodes"
  on nodes for all
  using (is_admin())
  with check (is_admin());

alter table major_understandings enable row level security;

create policy "Major understandings readable if curriculum published"
  on major_understandings for select
  using (
    is_admin() or exists (
      select 1 from nodes n
      join curricula c on c.id = n.curriculum_id
      where n.id = major_understandings.node_id and c.status = 'published'
    )
  );

create policy "Only admins can write major understandings"
  on major_understandings for all
  using (is_admin())
  with check (is_admin());

-- ============================================================
-- RESOURCES
-- Only APPROVED resources are publicly visible. Draft/rejected
-- are admin-only -- this is the review-queue enforcement at the
-- database level, not just app logic.
-- ============================================================
alter table resources enable row level security;

create policy "Approved resources are publicly readable"
  on resources for select
  using (status = 'approved' or is_admin());

create policy "Only admins can write resources"
  on resources for all
  using (is_admin())
  with check (is_admin());

-- ============================================================
-- DOMAIN_SCORES: admin-only in both directions. Not meant to be
-- public API surface -- it's internal ranking infrastructure.
-- ============================================================
alter table domain_scores enable row level security;

create policy "Only admins can read domain scores"
  on domain_scores for select
  using (is_admin());

create policy "Only admins can write domain scores"
  on domain_scores for all
  using (is_admin())
  with check (is_admin());

-- ============================================================
-- PROGRESS: strictly per-user. A user can only see/write their own rows.
-- ============================================================
alter table progress enable row level security;

create policy "Users can read their own progress"
  on progress for select
  using (auth.uid() = user_id);

create policy "Users can write their own progress"
  on progress for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own progress"
  on progress for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- ADMINS table itself: only readable by admins (avoid leaking
-- who the admins are to arbitrary authenticated users).
-- ============================================================
alter table admins enable row level security;

create policy "Only admins can read the admin list"
  on admins for select
  using (is_admin());
