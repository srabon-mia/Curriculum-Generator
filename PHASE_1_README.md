# Phase 1 — Setup Instructions

## What's in here
- `app/` — the Next.js project (App Router, TypeScript, Tailwind, Supabase client)
- `supabase/migrations/` — SQL migrations defining the schema + RLS policies
- `seed_curriculum.json`, `domain_scorelist.json` — Phase 0 outputs, used by `app/scripts/seed.ts`
- `PHASE_0_SCOPE.md` — the locked scope doc from Phase 0

## One-time setup

### 1. Create a Supabase project
Go to supabase.com, create a new project (free tier is fine for this).

### 2. Run the migrations
In the Supabase dashboard: SQL Editor -> paste the contents of
`supabase/migrations/0001_init.sql`, run it. Then do the same for
`0002_rls.sql`. (These are plain SQL files -- if you later install the
Supabase CLI, `supabase db push` will run them automatically instead.)

### 3. Make yourself an admin
The RLS policies check an `admins` table. After you've signed up a user
through Supabase Auth (you'll do this once auth UI exists in Phase 2 --
for now you can create one manually via Authentication -> Users -> Add User
in the dashboard), insert your user ID into the admins table:

```sql
insert into admins (user_id) values ('your-user-uuid-here');
```

### 4. Configure environment variables
```
cd app
cp .env.local.example .env.local
```
Fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from
Project Settings -> API in the Supabase dashboard. Also grab the
`service_role` key for `SUPABASE_SERVICE_ROLE_KEY` (needed only for the
seed script, never exposed to the browser).

### 5. Install dependencies
```
cd app
npm install
```

### 6. Run the seed script
This loads the Phase 0 curriculum (10 topics, 104 major understandings)
and domain scorelist into your database:
```
npm run seed
```
Safe to re-run any time you edit the source JSON files -- it upserts
rather than duplicating.

### 7. Run locally
```
npm run dev
```
Visit http://localhost:3000 -- you'll see the default Next.js placeholder
page for now. The real public-facing curriculum viewer is Phase 3.

### 8. Deploy to Vercel (do this now, not later)
- Push this to a GitHub repo
- Import it in Vercel
- Add the same environment variables from `.env.local` in Vercel's
  project settings (Environment Variables) -- do NOT add
  `SUPABASE_SERVICE_ROLE_KEY` unless a server-side route actually needs
  it at runtime; the seed script is meant to be run locally/manually,
  not as part of the deployed app
- Deploy

You should now have a live (empty) URL. That's the Phase 1 deliverable:
a deployed, connected, schema-backed app with zero user-facing features
yet.

## What's verified working
- TypeScript compiles clean (`npx tsc --noEmit`)
- Production build succeeds (`npm run build`)
- API routes are registered: `/api/curricula`, `/api/nodes`, `/api/resources`
- Auth session refresh via `proxy.ts` (Next.js 16's renamed middleware)
- RLS policies enforce: published-only public reads, admin-only writes,
  per-user progress isolation

## What's NOT built yet (later phases)
- Any actual UI beyond the Next.js default page (Phase 2: admin builder,
  Phase 3: public viewer)
- Login/signup screens (Phase 6, though the auth *plumbing* is ready now)
- AI curriculum-matching or resource-discovery calls (Phase 4/5)

## A note on the API routes
`/api/curricula`, `/api/nodes`, `/api/resources` are deliberately thin --
they exist so Phase 2's admin UI has something to call, and so you can
sanity-check the schema with `curl` right now if you want:

```bash
# After deploying or running locally + logging in as admin:
curl -X POST http://localhost:3000/api/curricula \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","subject":"chemistry","source_type":"adapted"}'
```
(This will fail with an RLS error until you're authenticated as an admin
in the request -- that's the policy working correctly, not a bug.)
