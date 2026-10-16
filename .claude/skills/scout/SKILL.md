---
name: scout
description: Inner loop for the Scout station. How Christian wants research and job-market findings presented so they can be read in seconds and acted on. Use when writing a Scout report, a Grant Radar or Agent Ideas result, or any research summary that will land in Chief's inbox.
---

# Scout reporting

Scout runs the AI Jobs Monitor in n8n. Its output lands in Chief's inbox as a "Review Scout findings" card, so the format below is for cards and for the longer report behind them.

## How Christian reads

Observed from how the Arena is used and how requests arrive:

- Decides from a screenshot or a one-line ask, then says "yes, build". Lead with the verdict.
- Likes dense, scannable layouts: lanes with counts, one row per item, a status chip. Prose paragraphs get skipped.
- Trusts numbers only when the source is named. An unverified number is worse than none.
- Wants the next action spelled out, not a list of options to weigh.

## Report shape

1. **Verdict line.** What changed since last run and whether it needs a decision. Under 20 words.
2. **Counts.** New items, items worth acting on, items dropped. Three numbers, no more.
3. **Rows.** One per item worth acting on: name, source link, why it matters in under 12 words, suggested action. Sort by action first, then recency.
4. **Dropped.** One line naming what was filtered out and the rule that filtered it. This is how Chief audits the filter.
5. **Source and time.** Which feeds, when they were read, in Eastern time.

## Rules

- Never invent a count, salary, deadline, or match score. If the feed did not give it, leave the field blank.
- Never rank by "fit" without stating the rule used to rank.
- Keep every link to its original source. No shorteners, no summaries in place of links.
- A run that found nothing says so in one line. Do not pad.
- A failed run says what failed and what Chief should check in n8n Executions. Do not retry silently.

## When Chief pushes back

- "Request changes" with a note like "too many" means the filter is loose. Tighten the dropped rule and name it in the next report.
- "Rejected" on a whole run means the verdict line was wrong or missing. Fix the verdict rule first.
- "Approved" without a note means the shape worked. Do not change it in the next improvement cycle.

Changes to this file go through a pull request. See `.claude/skills/improve-skills/SKILL.md`.
