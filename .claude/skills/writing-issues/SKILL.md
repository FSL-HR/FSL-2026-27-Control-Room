---
name: writing-issues
description: Use when creating a GitHub issue for the Control-Room repo — writes clear bug reports and feature requests using the repo templates.
---

# Writing Issues (Control-Room)

Meaningful work starts from an issue so there's a clear record of what changed and why. Use the right template.

## Choose the template
- **Bug report** (`bug_report.md`) — something is broken or wrong.
- **Feature request** (`feature_request.md`) — a change or addition.

## Write it well
- **Title:** short and specific. Keep the `[Bug]` / `[Feature]` prefix.
- **Bug:** fill in what happened, what you expected, steps to reproduce, where in the UI, and a screenshot if it helps.
- **Feature:** fill in what & why, where in the UI, and what "done" looks like.
- Be concrete — avoid "it's broken" or "make it better".

## Create it
Use the GitHub CLI, e.g.:
`gh issue create --title "[Bug] Week list doesn't scroll" --body "..." --label bug`

The PR that addresses an issue must reference it with `Closes #<number>`.
