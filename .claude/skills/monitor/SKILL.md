---
name: monitor
description: Inner loop for the Monitor station. How to read a website health result, what reaches Chief's inbox, and what stays quiet. Use when triaging a Monitor result, a "needs attention" decision, or a change to Monitor's checks.
---

# Monitor triage

Monitor checks the homepage of every site in `connections.js` on page open and on refresh. The endpoint is `api/monitor/run.js`. It is an availability check only, never a login, database, or GPS check. Never present it as more than that.

## Statuses and what they mean

| Status | Cause | Action |
|---|---|---|
| Online | HTTP 2xx | Nothing. Resolves any open "needs attention" item for that site. |
| HTTP error | 4xx or 5xx from the site's own host | Escalate. Include the HTTP code in the title. |
| Timeout | No response in 10 s | Escalate only if it repeats on the next check. One timeout is noise. |
| Unreachable | DNS or TLS failure | Escalate immediately. Usually a domain or certificate problem. |
| Redirect | 3xx that leaves the site's own host | Escalate as low priority. The site may be fine but the registry URL is stale. |

## What reaches Chief

Chief sees short cards. One line of title, one or two lines of detail, then the action. Write for someone scanning on a phone.

- **Title**: site name plus the problem. "EM Riders needs attention" is the current pattern. Prefer "EM Riders · HTTP 503".
- **Detail**: status, HTTP code, response time, and the one thing to check first. No speculation about root cause unless the status makes it certain.
- **Never** duplicate an open item. One pending card per site, updated in place. A later Online result resolves it.
- **Never** fabricate uptime percentages, incident durations, or "last seen" times that the check did not produce.

## What stays quiet

- A single Timeout on one check.
- Response times under 5 s, however they vary.
- A Redirect that stays on the same host, including www to apex.

## When Chief pushes back

"Request changes" or "Reject" on a Monitor card, with a note, is the signal that this file is wrong. Common fixes belong here, not in the endpoint:

- Chief rejects repeated Timeout cards for one site: raise the repeat threshold for that site, or note that the host is slow by design.
- Chief marks a Redirect as reviewed every time: update the URL in `connections.js` and stop escalating it.
- Chief asks for more detail: add the field to the detail line, never a new card.

Changes to this file go through a pull request. See `.claude/skills/improve-skills/SKILL.md`.
