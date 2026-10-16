-- Chief's decisions, shared across devices and readable by the skill-improvement loop.
-- Written only by the Arena's server endpoint (service role). No browser or signed-in
-- account can read or change this table directly; the board's owner rules do not apply here.

create table if not exists public.arena_decisions (
  id uuid primary key,
  key text not null check (length(key) between 1 and 120),
  agent text not null check (agent in ('chief', 'scout', 'flow', 'pulse', 'forge', 'monitor')),
  kind text not null check (kind in ('issue', 'review', 'approval')),
  title text not null check (length(title) between 1 and 140),
  detail text not null default '' check (length(detail) <= 2000),
  status text not null check (status in ('pending', 'approved', 'changes requested', 'rejected', 'reviewed', 'resolved')),
  note text not null default '' check (length(note) <= 500),
  created_at timestamptz not null,
  decided_at timestamptz,
  updated_at timestamptz not null default now()
);
alter table public.arena_decisions enable row level security;
revoke all on public.arena_decisions from anon, authenticated;

create index if not exists arena_decisions_agent_created on public.arena_decisions (agent, created_at desc);
create index if not exists arena_decisions_status on public.arena_decisions (status);

drop trigger if exists arena_decisions_touch on public.arena_decisions;
create trigger arena_decisions_touch
  before update on public.arena_decisions
  for each row execute function private.arena_touch();
