---
name: improve-skills
description: Outer loop. Reads Chief's recent decisions from Supabase, finds where a station's skill is producing cards Chief rejects or changes, and opens a pull request that improves that station's SKILL.md. Use on a weekly schedule or when asked to review how a station is doing.
---

# Improve a station's skill

This loop proposes. Chief merges. Never push to the default branch, never merge, never edit a skill without a pull request.

## Inputs

Decisions live in `public.arena_decisions`. Pull them with the export script from a trusted environment that has the two Supabase variables:

```
node scripts/export-decisions.js --days 7
node scripts/export-decisions.js --days 7 --agent monitor --json
```

The text form groups by station, lists pushback with Chief's notes, and flags keys that repeated three or more times.

## Procedure

1. Run the export for the last 7 days. If there are fewer than 5 decisions for every station, stop and report "not enough signal". Do not open a PR on thin data.
2. Pick one station. Choose the one with the highest share of "changes requested" plus "rejected", ties broken by volume. One station per PR.
3. Read that station's `.claude/skills/<station>/SKILL.md` and the "When Chief pushes back" section.
4. Match each pushback note to a rule in the file. Three outcomes:
   - A rule exists and was not followed: the fix is in the code or workflow that produces the card, not the skill. Report it; do not edit the skill.
   - A rule exists and Chief disagrees with it: change the rule. Quote the notes that motivated the change.
   - No rule covers it: add one, in the same table or list style the file already uses.
5. Repeated keys with no pushback (approved or reviewed every time) are noise candidates. Propose a "stays quiet" rule for them.
6. Keep the diff small. One PR changes one file, under 30 lines, with one idea.

## Pull request

- Branch: `skills/<station>-<yyyy-mm-dd>`.
- Title: `Improve <station> skill: <one idea in six words>`.
- Body, in this order: the verdict in one line, the counts the export printed for that station, the quoted notes, the rule changed. No model names, no session links in the body beyond what the repository already requires.
- Record the PR in Chief's inbox as an approval card with agent `forge` so it shows in the Arena.

## Never

- Merge, or ask for the merge to be automated.
- Change `connections.js`, `workflows.js`, or any endpoint from this loop. Those are separate changes with their own review.
- Lower a rule's bar because Chief approved a run; approval means keep, not loosen.
- Edit two stations in one PR.
