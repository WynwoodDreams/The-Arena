# Agent Arena — Christian's command center

Six stations: Chief (Christian's decisions), Scout (research), Flow (automations), Pulse (social media), Forge (coding and builds), and Monitor (website availability).

## Current connections

- Scout calls the existing server-side `/api/scout/run` n8n integration. `Started` means n8n accepted the request; final workflow results are not synchronized yet.
- Monitor checks BuildersBench, Opportunity Board, Arrest Intelligence, and EM Riders automatically on opening and on refresh. These are homepage availability checks, not internal application, login, database, or GPS checks.
- Flow, Pulse, and Forge are labeled **Not connected**. No simulated runs, costs, successes, or task counts are displayed.

## Chief inbox and history

Website errors and Scout follow-ups create review items. Repeated unresolved website issues are merged; a successful subsequent health check resolves the corresponding issue. Manual approval requests can be added using **Add decision**. Approve, Request changes, Reject, and Mark reviewed record local decisions only; they do not publish, deploy, or execute external jobs.

Run history (latest 100), activity (latest 30), decisions (latest 200), and latest results are saved using browser localStorage. This is browser-specific and is not a shared backend, account login, or cross-device synchronization. Interrupted Scout requests are shown as Unknown and should be checked in n8n before retrying.

## Vercel configuration

Serve `index.html` and the `api/` serverless endpoints. Set `N8N_SCOUT_WEBHOOK_URL` to the published n8n production webhook; optional Header Auth uses `N8N_SCOUT_AUTH_HEADER_NAME` and `N8N_SCOUT_AUTH_HEADER_VALUE`. Redeploy after environment changes. The webhook URL stays server-side.

Opening the dashboard only runs the read-only website check. Scout requires its Run button. Public Scout endpoint access still requires appropriate access controls before sharing broadly because it can start paid workflows.

## Next integration layer

A shared authenticated database and callback/status endpoints are needed for n8n and other tools to send results and approval requests while the Arena is closed, synchronize devices, and resume external work after approval. That layer is not implemented in this version.

## MY Arena board (`/board`)

`board/index.html` is a private project board: apps, sites, workflows and tasks, each with stage, tech stack, links, to-dos and notes. It is one self-contained page. `board/vendor/supabase.js` is a bundled copy of supabase-js (MIT).

The page holds no data. Everything is stored in a separate Supabase project and is readable only after sign-in:

- `public.arena_items` holds one row per board item, and the `arena-thumbs` bucket holds thumbnails. Row level security limits both to accounts listed in `public.arena_owners`.
- `supabase/migrations/0001_arena_board.sql` creates all of it. The owner's email is added by hand afterwards and stays out of this repository.
- The Supabase URL and publishable key go in the `SUPA` object near the top of the script in `board/index.html`. Both are public values. The database rules are what protect the data, so never put a secret or service role key in this file.

Until `SUPA` is filled in, the hosted page shows "This board is not connected to its database yet" and loads nothing. Opened from `localhost`, it runs in a device-only mode for development.

In Supabase, under **Authentication > URL Configuration**, set the Site URL to the deployed `/board` address and add it to the redirect list. Confirmation and password reset emails link back there.

