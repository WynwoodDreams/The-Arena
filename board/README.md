# MY Arena board (`/board`)

`index.html` in this folder is a private project board: apps, sites, workflows and tasks, each with stage, tech stack, links, to-dos and notes. It is one self-contained page. `vendor/supabase.js` is a bundled copy of supabase-js (MIT).

It sits beside the Agent Arena operations room and shares nothing with it: no files, no API routes, no data. The operations room is the site root. This board is everything under `/board`.

## Where the data lives

The page holds no data. Everything is stored in a separate Supabase project and is readable only after sign-in:

- `public.arena_items` holds one row per board item, and the `arena-thumbs` bucket holds thumbnails. Row level security limits both to accounts listed in `public.arena_owners`.
- `../supabase/migrations/0001_arena_board.sql` creates all of it. The owner's email is added by hand afterwards and stays out of this repository.
- The Supabase URL and publishable key go in the `SUPA` object near the top of the script in `index.html`. Both are public values. The database rules are what protect the data, so never put a secret or service role key in this file.

## Current mode: device only, no sign-in

`SUPA` is empty for now, so the page runs with no sign-in and no database. Everything is kept in the browser's own storage on that device, and nothing is sent anywhere. Each device has its own copy.

**Backup** (under the intro) downloads the whole board as one JSON file and restores from one. That file is how the board moves between devices, and the only copy if the browser's data is cleared. Backup files hold private notes, so keep them out of this repository.

Once `SUPA` is filled in, the sign-in screen and the shared database take over, and a backup file can be restored into it.

## Supabase setting to change by hand

Under **Authentication > URL Configuration**, set the Site URL to the deployed `/board` address and add it to the redirect list. Confirmation and password reset emails link back there.
