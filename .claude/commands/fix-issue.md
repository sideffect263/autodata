---
description: Apply the fix for a single issue ID from docs/v2-review/04-fix-playbook.md, validate it, and commit. Usage — /fix-issue W1.1
argument-hint: <issue-id> e.g. W1.1
---

You are about to fix issue `$ARGUMENTS` from the playbook at
`docs/v2-review/04-fix-playbook.md`.

Follow this routine, in order, without asking for confirmation between steps unless
the playbook entry's risk tier is 🟡 or 🔴:

## 1. Load the playbook entry
Read `docs/v2-review/04-fix-playbook.md` and extract the entry for issue
`$ARGUMENTS`. Use it as the source of truth for:
- the exact files to edit
- the test plan
- the exit criteria
- the risk tier

If the entry doesn't exist, stop and tell the user.

## 2. Branch hygiene
Confirm the working tree is clean (`git status`). If not, stop and report.
Confirm we're on a branch named `claude/fix-$ARGUMENTS-*` (create one if not, off the
current branch).

## 3. Apply the fix
- For 🟢 (autorun) tier: apply directly.
- For 🟡 (reviewable) tier: apply, then pause and show the diff before committing.
- For 🔴 (collaborative) tier: do NOT apply. Output the proposed diff and stop.

When applying, prefer the smallest patch that satisfies the exit criteria. Do not
introduce unrelated cleanup.

## 4. Run the test plan
Run the commands listed under "Test plan" in the playbook entry. If any fail,
diagnose, fix, and re-run. Do not proceed if a test fails.

If the playbook says "no automated test possible — eyeball it", say so explicitly and
ask the user to verify.

## 5. Commit
For 🟢 and 🟡 tiers (after user approval for 🟡):
```
git add <files>
git commit -m "fix($ARGUMENTS): <one-line summary from playbook>"
```

Do NOT push. Pushes are batched at the end of the run.

## 6. Update the playbook
In `docs/v2-review/04-fix-playbook.md`, change the entry's status line from
`status: pending` to `status: done @ <commit-sha>`.

## 7. Report
Output a 3–5 line summary:
- which files changed
- what the test plan said
- the commit SHA
- what the next dependency-eligible issue is (read playbook §"Dependency graph")

Stop. Do not chain into the next issue automatically — the user or a wrapper script
controls progression.
