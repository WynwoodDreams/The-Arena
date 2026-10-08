# Agent Arena — Christian's command center

Six stations: Chief (Christian's decisions), Scout (research), Flow (automations), Pulse (social media), Forge (coding and builds), and Monitor (website availability).

## Current connections

- Scout calls the existing server-side `/api/scout/run` n8n integration. `Started` means n8n accepted the request; final workflow results are not synchronized yet.
- Monitor checks BuildersBench, Opportunity Board, Arrest Intelligence, EM Riders, MDPD Dashboard, and Miami Environmental Intel automatically on opening and on refresh. These are homepage availability checks, not internal application, login, database, or GPS checks.
- Flow starts Grant Radar through `/api/flow/run`. Its immediate response is shown as **Started**; final results are not synchronized. Pulse is labeled **Not connected**. Forge contains a linked project library; build progress is not connected. No simulated runs, costs, successes, or task counts are displayed.

## Chief inbox and history

Website errors and workflow follow-ups create review items. Repeated unresolved website issues are merged; a successful subsequent health check resolves the corresponding issue. Manual approval requests can be added using **Add decision**. Approve, Request changes, Reject, and Mark reviewed record local decisions only; they do not publish, deploy, or execute external jobs.

Run history (latest 100), activity (latest 30), decisions (latest 200), and latest results are saved using browser localStorage. This is browser-specific and is not a shared backend, account login, or cross-device synchronization. Interrupted workflow requests are shown as Unknown and should be checked in n8n before retrying.

## Vercel configuration

Serve `index.html` and the `api/` serverless endpoints. Set `N8N_SCOUT_WEBHOOK_URL` to the published n8n production webhook; optional Header Auth uses `N8N_SCOUT_AUTH_HEADER_NAME` and `N8N_SCOUT_AUTH_HEADER_VALUE`. Redeploy after environment changes. The webhook URL stays server-side.

Opening the dashboard only runs the read-only website check. Scout and Grant Radar require their Run buttons.

## Endpoint protection

All three endpoints (`lib/guard.js`) accept POST only from the Arena page itself: the request's `Origin` must match the site host, so other sites and plain command-line calls get 403. Monitor results are also reused for two minutes per server instance, so repeated page opens do not re-check every site.

Scout and Grant Radar can start paid work, so they take one more step. Set `ARENA_ACCESS_KEY` on Vercel to any long random string. The first time a station is run, the page asks for that key once and keeps it in that browser. Without the variable, only the origin check applies. `vercel.json` also sets security headers (Content Security Policy, no framing, no sniffing).

## Checks

```
npm test
```

runs the endpoint tests with a mocked n8n and a mocked web, so nothing is called for real.

## Portfolio board

`/board` is a separate, public-facing project board for interviews and presentations. See `board/README.md`.

## Next integration layer

A shared authenticated database and callback/status endpoints are needed for n8n and other tools to send results and approval requests while the Arena is closed, synchronize devices, and resume external work after approval. That layer is not implemented in this version.

## Operations-room layout

The room opens with Chief's inbox closed. The pulsing **Chief inbox** button and Chief station open a modal side drawer with the existing decisions and history. Clicking another station's card, label, or robot opens its work columns. Monitor columns group healthy, issue, offline, and unknown results; other stations show recorded requests, reviews, and decision history. No work is fabricated for unconnected stations.

CSS animates masked robot regions from the existing scene and station lights. Connected stations have ambient motion; running requests have faster motion; unconnected stations and failed connections are dim with slow motion. Scout's Started state still means accepted by n8n, not verified completion. Reduced-motion preferences disable animations.

## Shared project registry

Edit `connections.js` to add public website names, repository links, and live URLs once. Monitor's server endpoint and the browser use this same list; counts are derived from its length. Forge lists entries with repository links as project shortcuts, without claiming live build progress. Secrets and workflow webhooks must remain server-side.

## Grant Radar connection

The production webhook uses POST with Respond Immediately and must be published in n8n. Connect the Webhook trigger directly to Config; keep manual/schedule triggers separately connected to Config rather than routing them through Webhook.

The server supports `N8N_GRANT_RADAR_WEBHOOK_URL`. When omitted, it derives the fixed `/webhook/agent-arena-grant-radar` path on the existing `N8N_SCOUT_WEBHOOK_URL` origin. This reuses the currently configured n8n host without exposing either URL to the browser. Optional Header Auth uses `N8N_GRANT_RADAR_AUTH_HEADER_NAME` and `N8N_GRANT_RADAR_AUTH_HEADER_VALUE`; Scout credentials are not reused for Grant Radar.

Flow stores requests and Chief review items locally. HTTP acceptance does not prove the grant API calls completed. Scheduled runs and the paste-ready grant JSON are not sent back to the Arena until a callback/status integration is added.
