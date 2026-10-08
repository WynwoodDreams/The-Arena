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

## Operations-room layout

The room opens with Chief's inbox closed. The pulsing **Chief inbox** button and Chief station open a modal side drawer with the existing decisions and history. Clicking another station's card, label, or robot opens its work columns. Monitor columns group healthy, issue, offline, and unknown results; other stations show recorded requests, reviews, and decision history. No work is fabricated for unconnected stations.

CSS animates masked robot regions from the existing scene and station lights. Connected stations have ambient motion; running requests have faster motion; unconnected stations and failed connections are dim with slow motion. Scout's Started state still means accepted by n8n, not verified completion. Reduced-motion preferences disable animations.
