---
name: model-economy
description: Route tasks to the cheapest Codex model that can do them well, to save tokens. Use this skill at the START of every task and whenever you are about to do something mechanical or low-risk, such as searching/grepping the repo, reading or summarizing files, explaining a function, formatting, renaming, adding comments or docstrings, writing commit messages, generating boilerplate, writing simple tests, or summarizing logs and diffs. Also use when the user mentions saving tokens, reducing cost, "modelo mais barato", "economizar tokens", "tarefa leve", "Terra", "Luna", or delegating to a smaller model.
---

# Model Economy

Goal: spend the strongest model's tokens only where its reasoning is needed.

## Available models

| Tier | Model | Role |
|------|-------|------|
| Top | **Luna 6.0** | Main model. Plans, decides, solves hard problems, reviews delegated work. Never delegate to it; it is the one running this skill. |
| Mid | **Luna 5.6** | MEDIUM tasks: scoped coding with a clear spec. |
| Low | **Terra 5.6** | LIGHT tasks: mechanical, read-heavy, low-risk work. |

Model IDs and settings live in `scripts/models.env`. Edit that file if the CLI names differ.

## Step 1 — Classify the task (before acting)

When in doubt between two tiers, pick the higher one.

| Tier | Typical work | Runs on |
|------|--------------|---------|
| **LIGHT** | grep/find, list files or symbols, read and summarize a file/log/diff, explain a snippet, rename, format, comments/docstrings, commit messages, boilerplate, format conversions, quick repo questions | **Terra 5.6** |
| **MEDIUM** | single-file fix with known cause, unit tests for existing code, small scoped refactor, simple scripts, translating a clear spec into code | **Luna 5.6**, then Luna 6.0 reviews the diff |
| **HEAVY** | architecture, cross-module changes, debugging with unknown cause, concurrency, security, migrations, performance, ambiguous requirements, final review | **Luna 6.0** (do it yourself, do NOT delegate) |

Details and examples: `references/routing-table.md`. Read it only if the tier is unclear.

## Step 2 — Delegate LIGHT and MEDIUM work

Preferred order:

1. **Native subagent or per-task model**, if this Codex session supports it: use Terra 5.6 for LIGHT, Luna 5.6 for MEDIUM.
2. **Script** `scripts/delegate.sh`:

```bash
# LIGHT -> Terra 5.6, read-only (default)
scripts/delegate.sh -t light "Summarize what src/auth/session.ts does in 5 bullets."

# LIGHT with edits (scoped, mechanical)
scripts/delegate.sh -t light -w "Add JSDoc to exported functions in src/utils/date.ts. Do not change logic."

# MEDIUM -> Luna 5.6 with edits
scripts/delegate.sh -t medium -w "Write unit tests for parseConfig() in src/config.ts using the existing test style."
```

Flags: `-t light|medium` picks the model (default `light`); `-w` allows workspace writes (default is read-only).

3. **Fallback**: if delegation is unavailable, say once, in one line, which model would suit the task and suggest `/model`. Then continue and do not repeat the suggestion.

## Step 3 — Write delegation prompts that save tokens

The delegate has no memory of this conversation, so the prompt must be self-contained but short:

- Goal in 1–2 sentences.
- File paths, not file contents.
- Output format plus a length cap ("max 10 bullets", "return only the diff").
- Constraints ("do not modify files", "only touch X").
- Never paste large logs; point to the file.
- Batch related LIGHT tasks into one call.

## Step 4 — Verify proportionally

- LIGHT read-only results: use directly; spot-check one claim if it drives a decision.
- Delegated edits (LIGHT or MEDIUM): run `git diff`, review, and run the relevant tests or linters.
- MEDIUM edits get a closer review than LIGHT ones.
- If a delegate's result is wrong or incomplete, retry at most once, with a clearer prompt. Escalation ladder: Terra 5.6 -> Luna 5.6 -> do it yourself on Luna 6.0.

## Rules

- Never delegate: secrets/credentials, destructive commands (`rm -rf`, force push, DB drops), security-sensitive code, or the final answer to the user.
- Do not delegate tiny tasks (under ~2 tool calls) or tasks whose content is already in your context.
- Never run delegates with full-access sandbox.
- Keep your own messages short. At most one line like "Delegating search to Terra 5.6."
