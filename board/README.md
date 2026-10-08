# MY Arena board (`/board`)

`index.html` in this folder is a private project board: apps, sites, workflows and tasks, each with stage, tech stack, links, to-dos and notes. It is one self-contained page. `vendor/supabase.js` is a bundled copy of supabase-js (MIT).

It sits beside the Agent Arena operations room and shares nothing with it: no files, no API routes, no data. The operations room is the site root. This board is everything under `/board`.

## Where the data lives

The page holds no data. Everything is stored in a separate Supabase project and is readable only after sign-in:

- `public.arena_items` holds one row per board item, and the `arena-thumbs` bucket holds thumbnails. Row level security limits both to accounts listed in `public.arena_owners`.
- `../supabase/migrations/0001_arena_board.sql` creates all of it. The owner's email is added by hand afterwards and stays out of this repository.
- The Supabase URL and publishable key go in the `SUPA` object near the top of the script in `index.html`. Both are public values. The database rules are what protect the data, so never put a secret or service role key in this file.

## Public portfolio: what an interviewer sees

`portfolio.json` in this folder is a read-only snapshot of the projects picked for presenting. It opens for anyone, with no sign-in and no local data, at:

- `/board/?present` — the whole portfolio. Arrow keys move between projects, Escape closes one.
- `/board/?present&p=<id>` — straight to one project. The Copy link button in a project's panel gives this address; the address bar also updates as you move.
- `/board/` on a device that has no board of its own also shows the portfolio, so a borrowed laptop or a projector never shows an empty page. `/board/?edit` skips that and opens the editable board.

To publish or update it: on your own board, mark projects **Show when presenting**, then **Backup → Download the public portfolio** and commit the file as `board/portfolio.json`. It carries names, one-liners, talking points, stage, tech stack and links only. To-dos, notes, people and file locations are never exported, and the page ignores them if they appear in the file.

Thumbnails are plain images in `thumbs/<id>.jpg`. `npm run screenshots` captures one for each project from its first link (needs `npm install` once, which brings in Playwright). A project with no image shows no thumbnail.

The six public websites from `../connections.js` are already in the file as a starting point. Each has an empty talking point and tech stack: fill those in on the board and export again, because empty sections are hidden in the public view.

## Current mode: device only, no sign-in

`SUPA` is empty for now, so the page runs with no sign-in and no database. Everything is kept in the browser's own storage on that device, and nothing is sent anywhere. Each device has its own copy.

**Backup** (under the intro) downloads the whole board as one JSON file and restores from one. That file is how the board moves between devices, and the only copy if the browser's data is cleared. Backup files hold private notes, so keep them out of this repository.

Once `SUPA` is filled in, the sign-in screen and the shared database take over, and a backup file can be restored into it.

## Supabase setting to change by hand

Under **Authentication > URL Configuration**, set the Site URL to the deployed `/board` address and add it to the redirect list. Confirmation and password reset emails link back there.
