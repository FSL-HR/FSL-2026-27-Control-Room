# Design: GitHub Workflow Skills for FSL Control-Room

**Date:** 2026-07-17
**Repo:** FSL-HR/FSL-2026-27-Control-Room
**Status:** Approved design, ready for implementation planning

## Purpose

Introduce a documented, repeatable process for making changes to the Control-Room
site, backed by a small set of Claude Code skills plus human-readable repo files.
Today every change is committed straight to `main` (which auto-deploys the live
site) with a generic "Update index.html" message, no branches, no issues, no
tests, and no review. This design replaces that with a safe, reviewable workflow
that both Claude and human teammates follow.

## Context

- Control-Room is a single static file: `index.html` (~5,300 lines of inline
  HTML/CSS/JS). No build step.
- It auto-deploys to GitHub Pages via `.github/workflows/static.yml` on every push
  to `main`.
- The repo is **public**.
- There is a stray duplicate workflow file `.github/workflows/chelsitest` (a copy
  of `static.yml` with no `.yml` extension, so GitHub ignores it). It will be
  removed as part of this work.

## Decisions (from brainstorming)

| Question | Decision |
|----------|----------|
| Audience | Claude **and** human teammates — everything must be human-readable |
| Scope | Control-Room only for now; committed into the repo |
| Testing | Both: light automated checks **and** a manual smoke-test checklist |
| Test depth | **Lean automated** — CI runs HTML validity + broken-link check; "no console errors on load" lives in the manual checklist |
| Security | Guard all four: no secrets, no sensitive personal data (public repo), safe user input/XSS, vet external code |
| Workflow | **Always branch + PR** — never push directly to `main` |
| Issues | **Structured** — templates for bug/feature; meaningful work starts from an issue; PRs reference the issue |
| Structure | **Focused skills + human docs** (Approach A) |

## Architecture

Files created in the repo:

```
FSL-2026-27-Control-Room/
├── .claude/skills/
│   ├── control-room-workflow/SKILL.md   # master procedure, references the others
│   ├── writing-issues/SKILL.md
│   ├── testing-control-room/SKILL.md
│   ├── security-check/SKILL.md
│   └── code-standards/SKILL.md
├── .github/
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md
│   │   └── feature_request.md
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── workflows/
│       └── checks.yml                    # HTML validity + link check on every PR
├── CONTRIBUTING.md                       # human-readable version of the process
└── docs/superpowers/specs/2026-07-17-github-workflow-skills-design.md  # this file
```

Cleanup: delete `.github/workflows/chelsitest`.

Each skill has a single responsibility, communicates through the shared procedure
(the master workflow references the others by name), and can be read and updated
independently.

## Components

### 1. `control-room-workflow` (master skill)

Triggers when starting any change to Control-Room. Enforces the day-to-day
procedure and points to the other skills at each step:

1. **Start from an issue** — pick or create one (see `writing-issues`).
2. **Branch** off `main` — `fix/<short-desc>` or `feature/<short-desc>`. Never
   edit `main` directly.
3. **Make the change** — following `code-standards`.
4. **Security check** — run `security-check` before pushing anything.
5. **Test** — run `testing-control-room` (automated + manual checklist).
6. **Open a PR** — using the PR template; reference the issue (`Closes #N`).
7. **Review & merge** — PR reviewed, then merged to `main` (auto-deploys).
8. **Confirm** — verify the live site after deploy.

### 2. `writing-issues`

How to write clear issues and which template to use. Bug reports capture what
happened / expected / steps / screenshot. Feature requests capture what & why /
where in the UI / what "done" looks like. Meaningful work starts from an issue so
there is a clear paper trail of what changed and why.

### 3. `testing-control-room`

**Automated (CI, `checks.yml`, runs on every PR; can also be run locally):**
- HTML validity via `html-validate` (run through `npx`, no config to maintain).
- Broken-link check via `lychee`.

**Manual smoke checklist (walked before merging):**
- Page loads and looks right.
- Sidebar nav switches views.
- Week list works.
- Key buttons respond.
- No obvious layout breakage.
- Console is clean (open the page, press F12, confirm no JavaScript errors).

### 4. `security-check`

Run before any push. Verify all four:
1. **No secrets** — scan the diff for passwords, API keys, tokens, credentials.
2. **No sensitive personal data** — repo is public: flag home addresses, phone
   numbers, personal emails, government IDs, dates of birth, etc.
3. **Safe user input (XSS)** — if the page reads input, confirm the inline JS does
   not inject it unsafely (e.g. `innerHTML` with unescaped values).
4. **Vet external code** — list any external scripts/CDNs the page loads; confirm
   each is trusted and version-pinned.

### 5. `code-standards`

Well-commented, consistent code: a comment on each major section/function
explaining *why*, clear naming, keep the existing black/red/white style
conventions, no dead code. Short and practical.

### Human-facing files

- `CONTRIBUTING.md` — the whole process in plain language for teammates.
- `.github/ISSUE_TEMPLATE/bug_report.md`, `feature_request.md`.
- `.github/PULL_REQUEST_TEMPLATE.md` — summary, linked issue, security checklist,
  testing checklist.
- `.github/workflows/checks.yml` — the automated checks on PRs.

## Data flow

A change flows: **issue → branch → edit (code-standards) → security-check →
tests (automated CI + manual) → PR (references issue) → review → merge to `main`
→ auto-deploy → confirm live**. The PR is the gate protecting the live site.

## Error handling / edge cases

- **CI check fails** — PR cannot be merged until HTML validity and link checks
  pass; the author fixes and pushes again.
- **Security guard triggers** — if secrets or personal data are detected in a
  diff, the push/commit is stopped and the content is surfaced to the user, never
  committed.
- **Direct-to-main attempt** — the workflow skill instructs never to commit to
  `main`; recommend enabling GitHub branch protection on `main` as a hard backstop
  (out of scope to configure here, noted as a follow-up).
- **OneDrive/git conflicts** — the repo lives inside OneDrive; if sync conflicts
  appear, moving the working copy outside OneDrive resolves them (noted, not fixed
  here).

## Testing (of this work itself)

- Automated: `checks.yml` runs on the PR that introduces these files and must
  pass against the current `index.html`.
- Manual: confirm each skill triggers appropriately and the templates render on
  GitHub (issue templates appear in the "New issue" chooser; PR template
  pre-fills a new PR).

## Out of scope (YAGNI)

- Applying this to the other two FSL repos (can copy later once proven).
- Full Playwright/headless console-error checking in CI (moved to manual).
- Configuring GitHub branch protection (recommended follow-up, not built here).
- Any change to `index.html`'s functionality.

## Open follow-ups

- Enable branch protection on `main` in GitHub settings (user action).
- Consider copying the setup to Western-CDN-Championships and
  Divisional-Layout-2 once validated.
