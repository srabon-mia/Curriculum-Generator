-- 0001_init.sql
-- Phase 1: core schema for the curriculum curation engine.
-- Run via Supabase SQL editor or `supabase db push`.

-- ============================================================
-- CURRICULA: top-level container (e.g. "NYS Regents Chemistry")
-- ============================================================
create table curricula (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subject text not null,
  source_type text not null check (source_type in ('adapted', 'ai_organized')),
  source_attribution text,          -- e.g. "NYSED Physical Setting/Chemistry Core Curriculum"
  source_url text,
  notes text,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- NODES: top-level topics within a curriculum (e.g. "Atomic Concepts")
-- Self-referential parent_node_id allows nesting later if needed,
-- but v1 only uses one level (the 10 NYSED topics).
-- ============================================================
create table nodes (
  id uuid primary key default gen_random_uuid(),
  curriculum_id uuid not null references curricula(id) on delete cascade,
  parent_node_id uuid references nodes(id) on delete cascade,
  external_key text,                -- e.g. "topic-1" from seed JSON, for idempotent re-import
  title text not null,
  order_index int not null,
  claim_statement text,             -- only used by claims-based curricula (kept nullable/generic)
  exam_weight_pct text,             -- e.g. "30-40%", nullable -- not all curricula have this
  created_at timestamptz not null default now(),
  unique (curriculum_id, external_key)
);

create index idx_nodes_curriculum on nodes(curriculum_id);
create index idx_nodes_parent on nodes(parent_node_id);

-- ============================================================
-- MAJOR_UNDERSTANDINGS: the fine-grained sub-points within a node
-- (e.g. "3.1a" under Atomic Concepts). This is the real
-- resource-attachment granularity -- 104 of these in the seed data,
-- vs. only 10 top-level nodes.
-- ============================================================
create table major_understandings (
  id uuid primary key default gen_random_uuid(),
  node_id uuid not null references nodes(id) on delete cascade,
  external_key text,                -- e.g. "I.1" from seed JSON
  code text,                        -- e.g. "3.1a" -- NYSED's official cross-reference code
  description text not null,
  order_index int not null,
  created_at timestamptz not null default now(),
  unique (node_id, external_key)
);

create index idx_mu_node on major_understandings(node_id);

-- ============================================================
-- DOMAIN_SCORES: the reputation scorelist (NOT a hard whitelist).
-- Loaded from domain_scorelist.json. Read at ingestion/ranking time,
-- not duplicated onto every resource row.
-- ============================================================
create table domain_scores (
  domain text primary key,
  score smallint not null check (score between 1 and 5),
  category text,
  notes text,
  updated_at timestamptz not null default now()
);

-- ============================================================
-- RESOURCES: the actual curated links/embeds attached to a node
-- or major_understanding. Attaching at EITHER level is allowed --
-- some resources (a full textbook) suit a whole topic; others
-- (one practice problem) suit a single major understanding.
-- ============================================================
create table resources (
  id uuid primary key default gen_random_uuid(),
  node_id uuid references nodes(id) on delete cascade,
  major_understanding_id uuid references major_understandings(id) on delete cascade,
  url text not null,
  title text not null,
  source_domain text,               -- denormalized for fast lookup; FK-like reference to domain_scores.domain
  resource_type text not null check (
    resource_type in ('video', 'text', 'textbook', 'problem_set', 'reference_tool', 'practice_exam', 'other')
  ),
  license_status text not null default 'link_only' check (
    license_status in ('cc_open', 'link_only', 'unknown_review_needed')
  ),
  embed_allowed boolean not null default false,
  content_type_verified boolean not null default false,  -- did the Phase 5 LLM classifier confirm this is real content, not SEO filler?
  ai_note text,                     -- the one-sentence "why this resource, why now" annotation
  status text not null default 'draft' check (status in ('draft', 'approved', 'rejected')),
  added_by uuid references auth.users(id),
  created_at timestamptz not null default now(),

  -- a resource must attach to a node OR a major_understanding, not be orphaned
  constraint resource_has_target check (node_id is not null or major_understanding_id is not null)
);

create index idx_resources_node on resources(node_id);
create index idx_resources_mu on resources(major_understanding_id);
create index idx_resources_status on resources(status);
create index idx_resources_domain on resources(source_domain);

-- ============================================================
-- PROGRESS: per-user completion tracking
-- ============================================================
create table progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  node_id uuid references nodes(id) on delete cascade,
  major_understanding_id uuid references major_understandings(id) on delete cascade,
  status text not null default 'not_started' check (
    status in ('not_started', 'in_progress', 'completed')
  ),
  completed_at timestamptz,
  created_at timestamptz not null default now(),

  constraint progress_has_target check (node_id is not null or major_understanding_id is not null),
  unique (user_id, node_id, major_understanding_id)
);

create index idx_progress_user on progress(user_id);

-- ============================================================
-- updated_at trigger helper (used by curricula for now)
-- ============================================================
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_curricula_updated_at
  before update on curricula
  for each row execute function set_updated_at();
