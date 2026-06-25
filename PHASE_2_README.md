# Phase 2 — Admin Curriculum Builder

Builds on Phase 1 (same setup steps apply — see PHASE_1_README.md if you
haven't already run migrations + seed).

## What's new

### `/admin`
Lists your curricula. After `npm run seed`, you should see one entry:
"NYS Regents Physical Setting/Chemistry (legacy 10-topic Core Curriculum)",
status `draft`.

### `/admin/curriculum/[id]`
The actual builder. Click into the curriculum from `/admin` to get here.

- **Left rail**: all 10 topics, expandable to show their major understandings
  (e.g. under "Atomic Concepts" you'll see I.1 through I.13, each with its
  NYSED code like `3.1a`). Each topic shows a small bar + percentage
  reflecting its real exam weight from the seed data.
- **Right pane**: click a topic OR a specific major understanding to select
  it. The detail pane shows its content plus a resource list and an
  "+ Add resource" form scoped to whatever's selected.
- **Adding a resource**: paste a URL, title, pick a type, and — important —
  pick the license status honestly. Embedding is only ever enabled when
  license is "CC / open licensed" AND the domain is in your scorelist;
  everything else defaults to link-only, matching the policy from Phase 0.
  New resources always land as `draft` — they don't show anywhere public
  until approved.
- **Approve / Reject**: draft resources show these buttons. Approving is
  what would eventually make a resource visible on Phase 3's public page
  (RLS already enforces "only approved resources are publicly readable" —
  you set that up in 0002_rls.sql).

## Required: you must be logged in as an admin
Same as Phase 1 — the `admins` table gates all writes via RLS. If you
haven't done step 3 from PHASE_1_README.md (inserting your user_id into
`admins`), you'll see RLS errors when trying to add/approve resources, even
though the page loads fine for reading.

If you don't have a login UI yet (that's Phase 6), the fastest way to test
locally is to manually create + confirm a user in the Supabase dashboard
(Authentication -> Users), then use that account's session. A quick way to
get a session locally without building login UI yet: use the Supabase
JS client's `signInWithOtp` via the dashboard's "Send magic link," or just
test the read-only tree view first (no auth needed for that, since RLS
allows admins to read everything, but published-curricula reads are also
allowed for anyone — your curriculum is still `draft` though, so even
reads will currently require an admin session until you flip status to
`published`).

## Try this first
1. `npm run dev`, visit `/admin`, click into the chemistry curriculum
2. Click "Atomic Concepts" — confirm all 13 major understandings show with
   correct NYSED codes (3.1a, 3.1b, etc.)
3. Select one major understanding (e.g. I.10, the flame-test/excited-state
   one) and add a real resource — try Mr. Ting's site or RegentsPrep,
   marked `link_only` since neither has a stated open license
4. Confirm it shows up as a draft card, then click Approve, confirm the
   badge updates

## What's NOT in Phase 2
- No bulk-import of resources (that's Phase 5's automated discovery)
- No drag-to-reorder for nodes (NYSED's order_index from the seed is used
  as-is; reordering can be added if you want custom sequencing before
  Phase 3, just say so)
- No edit-in-place for existing resources (only add/approve/reject) —
  editing would currently mean delete + re-add
- Curriculum `status` (draft/published) isn't toggleable from the UI yet —
  that's a one-line Supabase dashboard edit for now (`update curricula set
  status = 'published' where id = '...'`), proper UI for it can come in
  Phase 6 alongside auth
