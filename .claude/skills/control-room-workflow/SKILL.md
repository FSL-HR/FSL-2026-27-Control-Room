---
name: control-room-workflow
description: Use when starting any change to the FSL Control-Room repo — the master procedure covering issue, branch, code, security, tests, PR, review, and deploy.
---

# Control-Room Workflow

The full procedure for changing the Control-Room site. `main` auto-deploys to the live GitHub Pages site, so never edit `main` directly — every change goes through a branch and a PR.

## Steps
1. **Start from an issue.** Pick or create one describing the change. See the `writing-issues` skill.
2. **Branch off `main`.** Name it `fix/<short-description>` or `feature/<short-description>`.
3. **Make the change.** Follow the `code-standards` skill (well-commented, consistent).
4. **Security check.** Run the `security-check` skill before pushing anything. All four guards must pass.
5. **Test.** Run the `testing-control-room` skill — automated checks plus the manual smoke checklist.
6. **Open a PR.** Use the PR template. Reference the issue with `Closes #<number>`.
7. **Review & merge.** The PR is reviewed, then merged to `main`, which auto-deploys.
8. **Confirm.** After deploy, verify the live site looks right.

## Rules
- Never commit directly to `main`.
- A PR needs a green `Checks` run and a completed testing + security checklist before merge.
- Keep each PR focused on one issue.

For the human-readable version, see `CONTRIBUTING.md`.
