# How to Run the Fix Sessions

This file is the operating manual for actually doing the work in
`04-fix-playbook.md`. Read it before starting a long session.

---

## Why a fresh session

Two reasons:

1. **Context size.** This review session has loaded ~10k lines of source plus
   research. A fresh session starts clean and can run longer before context
   compaction kicks in.
2. **Clear hand-off.** A new session reads `01–04` as artefacts, not as a memory.
   It can't drift from the plan because the plan is the input.

You should branch off `origin/v2` for actual fixes (not the dev branch
`claude/check-git-access-Ppl26` where the review docs live). The review docs are
intentionally on the dev branch — they describe v2 from the outside.

---

## What's in place

- **Subagents** at `.claude/agents/`
  - `brain-explorer` — read-only Q&A about the Brain service
  - `viz-explorer` — read-only Q&A about React + 3D code
- **Slash command** `/fix-issue <id>` at `.claude/commands/fix-issue.md`
- **Playbook** at `docs/v2-review/04-fix-playbook.md`

The command and subagents live on the dev branch. When you start the fix branch,
either cherry-pick `.claude/` and `docs/v2-review/` onto it, or merge the dev branch
into the fix branch as a starting point. (Either is fine; both keep the artefacts
visible to Claude.)

---

## Recommended session strategies

### Strategy A — All-nighter, Wave 1 only

Best for the first run. Wave 1 contains only 🟢 issues:
`W4.2 → W4.5 → W2.3 → W3.3 → W3.4 → W3.2 → W1.10 → W1.6 → W1.8 → W4.1 → W2.6 → W5.3`.

That's ~5 hours of focused work for an experienced engineer. An autonomous run
will move slower because it tests as it goes. Reasonable target: **8–10 hours**.

**Kickoff prompt — paste this as the first message in the new session:**

```
You are picking up a planned set of fixes on the autodata v2 codebase.

Context to load (read in this order, do not summarise back):
- docs/v2-review/01-how-it-works.md
- docs/v2-review/02-weak-points-and-fixes.md
- docs/v2-review/04-fix-playbook.md  ← the plan
- .claude/commands/fix-issue.md
- .claude/agents/brain-explorer.md
- .claude/agents/viz-explorer.md

Goals for this session (Wave 1 — 🟢 issues only):
W4.2, W4.5, W2.3, W3.3, W3.4, W3.2, W1.10, W1.6, W1.8, W4.1, W2.6, W5.3

Constraints:
- Branch off origin/v2 as `claude/wave-1` if not already on it.
- One commit per issue. Do not push until the wave is complete.
- For each issue, invoke `/fix-issue <id>`. After it returns, update the playbook
  status line and move to the next id in the order above.
- If any issue fails its test plan twice, stop the wave and report.
- Use `brain-explorer` / `viz-explorer` for code-location questions instead of
  reading large files into the main context.
- Do NOT touch any 🟡 or 🔴 issue. If you find something that requires it, log it
  and skip.
- At the end of the wave, push the branch with `git push -u origin claude/wave-1`
  and report the list of commit SHAs.

Begin with W4.2.
```

### Strategy B — Single 🟡 issue per session

For wave 3+ or any single 🟡 issue. The work is small enough to fit in one focused
sitting and you want to review the diff before commit.

```
Pick up issue <ID> from docs/v2-review/04-fix-playbook.md. Branch off origin/v2 as
`claude/<ID>`. Read the playbook entry, apply the fix, run the test plan, and
present the diff. Wait for my approval before committing. Do not push.
```

### Strategy C — Architectural session (🔴)

For W5.1 (Vite migration), W1.2 (Web Worker), W3.1 (Zustand), W10.1 (DuckDB).
These deserve their own session, not an all-nighter slot.

```
We're doing the <NAME> migration. Read docs/v2-review/02-weak-points-and-fixes.md
§<X.Y> and docs/v2-review/04-fix-playbook.md issue <ID>. Then propose a
step-by-step plan with exit criteria for each step. Wait for my approval before
making any change.
```

---

## Operating tips

**Permissions.** An autonomous run will hit permission prompts on Bash/Edit. Either:
- pre-approve the safe commands by adding them to `.claude/settings.json`
  (`npm`, `git`, `node`), or
- accept that the user has to wake up to a few prompts.

I haven't pre-set those because settings changes are sensitive — let the user
decide.

**Watch for context compaction.** If you see the system reminder about long
conversation, that's fine — the docs are stable enough to reload. Tell the agent to
read the playbook again if needed.

**Commits.** One per issue, prefixed `fix(<ID>):`. Wave-level merge can be a single
PR titled "Wave 1 — quick wins" with the body listing every commit.

**If something feels wrong.** Stop. The all-nighter is opt-in safety, not a mandate.
Better to pause than to ship a regression overnight.

---

## What this is *not* good for

- **Visual regressions.** Without screenshots, you can't tell that the 3D scatter
  still looks right. Wave 4 needs a human at the screen.
- **Feature work.** Doc 03 proposals are not in this playbook on purpose — they're
  green-field, not bug fixes.
- **Reviewing your own architecture.** A session can't be its own design reviewer
  for a 🔴 issue. That's why those need a real conversation.

---

## After the wave: what to expect

A successful Wave 1 yields:
- ~12 commits on `claude/wave-1` with `fix(W*):` subjects
- the playbook updated so each completed issue shows `status: done @ <sha>`
- maybe 1–3 issues skipped with notes (totally normal)
- a tightened CSP, sanitised CSV, instanced-mesh-ready 3D code, fewer dead files,
  no production source maps, mobile-aware caps, deterministic sampling, robust type
  detection, on-demand frame loop, stable preference references

That's a defensible "before / after" diff to show stakeholders.
