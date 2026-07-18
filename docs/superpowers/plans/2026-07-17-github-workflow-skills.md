# GitHub Workflow Skills Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Introduce a safe, reviewable branch + PR workflow for the Control-Room site, backed by five focused Claude Code skills plus human-readable repo docs, issue/PR templates, and a lightweight CI checks workflow.

**Architecture:** Five single-purpose skills live in `.claude/skills/`; a `control-room-workflow` master skill ties them together and references the others by name. Human teammates get the same process via `CONTRIBUTING.md`, GitHub issue/PR templates, and a `checks.yml` CI workflow that runs HTML-validity and broken-link checks on every PR.

**Tech Stack:** Markdown (skills, docs, templates), GitHub Actions YAML, `html-validate` (via npx) and `lychee` (GitHub Action) for automated checks. No build step; `index.html` is a single static file.

## Global Constraints

- Scope is the `FSL-HR/FSL-2026-27-Control-Room` repo only.
- Everything committed must be human-readable (audience = Claude **and** teammates).
- Never push directly to `main`; all changes go through a branch + PR. This work is done on branch `Testbranch`.
- The repo is **public** — no secrets or sensitive personal data in any committed file.
- Automated testing is **lean**: CI runs HTML-validity + broken-link checks only. "No console errors on load" is a manual checklist item, not CI.
- Skill files use the path `.claude/skills/<skill-name>/SKILL.md` with YAML frontmatter containing `name` and `description` (the description starts with "Use when …" so it triggers correctly).
- Do not change `index.html`'s functionality anywhere in this plan.
- Commit after each task. Commit messages end with the `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>` trailer.

---

### Task 1: CI checks workflow + remove stray `chelsitest`

**Files:**
- Create: `.github/workflows/checks.yml`
- Create: `.htmlvalidate.json`
- Delete: `.github/workflows/chelsitest`

**Interfaces:**
- Produces: a CI workflow named `Checks` that runs on `pull_request` to `main` and on `workflow_dispatch`, with two jobs — `html-validate` and `link-check`. Later tasks (`testing-control-room` skill, PR template, CONTRIBUTING) reference this workflow by the name **`checks.yml`** and the two job names.

- [ ] **Step 1: Create the html-validate config**

Create `.htmlvalidate.json` with a lenient baseline (the recommended preset, with a couple of rules relaxed that commonly trip up hand-authored single-file pages). Tune further in Step 5 against real output.

```json
{
  "extends": ["html-validate:recommended"],
  "rules": {
    "no-inline-style": "off",
    "prefer-button": "off",
    "no-trailing-whitespace": "off",
    "void-style": "off"
  }
}
```

- [ ] **Step 2: Create the CI workflow**

Create `.github/workflows/checks.yml`:

```yaml
name: Checks

on:
  pull_request:
    branches: ["main"]
  workflow_dispatch:

permissions:
  contents: read

jobs:
  html-validate:
    name: HTML validity
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
      - name: Validate index.html
        run: npx --yes html-validate index.html

  link-check:
    name: Broken links
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Check links in index.html
        uses: lycheeverse/lychee-action@v2
        with:
          args: "--verbose --no-progress index.html"
          fail: true
```

- [ ] **Step 3: Delete the stray workflow file**

```bash
git rm .github/workflows/chelsitest
```

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/checks.yml .htmlvalidate.json
git commit -m "ci: add HTML-validity + link checks, remove stray chelsitest workflow"
```

- [ ] **Step 5: Verify in CI and tune until green**

The reliable verification path is CI (local runs need Node/lychee installed). This is validated end-to-end in Task 9 when the PR is opened. If `html-validate` reports errors against the current `index.html`, relax the specific offending rules in `.htmlvalidate.json` (set them to `"off"` or `"warn"`) and re-push until the `Checks` workflow passes. The goal is a green baseline on the *current* file, not rewriting `index.html`.

Expected (once tuned): both `HTML validity` and `Broken links` jobs pass on the PR.

---

### Task 2: Issue templates + PR template

**Files:**
- Create: `.github/ISSUE_TEMPLATE/bug_report.md`
- Create: `.github/ISSUE_TEMPLATE/feature_request.md`
- Create: `.github/PULL_REQUEST_TEMPLATE.md`

**Interfaces:**
- Produces: two issue templates that appear in GitHub's "New issue" chooser, and a PR template that pre-fills new PRs. The `writing-issues` skill (Task 6) and CONTRIBUTING (Task 8) reference these by name.

- [ ] **Step 1: Create the bug report template**

Create `.github/ISSUE_TEMPLATE/bug_report.md`:

```markdown
---
name: Bug report
about: Something on the Control-Room site is broken or wrong
title: "[Bug] "
labels: bug
---

## What happened
<!-- Describe the problem in one or two sentences. -->

## What you expected
<!-- What should have happened instead? -->

## Steps to reproduce
1.
2.
3.

## Screenshot
<!-- Drag an image in if it helps show the problem. -->

## Where
<!-- Which part of the page? e.g. sidebar, week list, a specific button. -->
```

- [ ] **Step 2: Create the feature request template**

Create `.github/ISSUE_TEMPLATE/feature_request.md`:

```markdown
---
name: Feature request
about: Suggest a change or addition to the Control-Room site
title: "[Feature] "
labels: enhancement
---

## What & why
<!-- What do you want to add or change, and why is it useful? -->

## Where in the UI
<!-- Which part of the page does this affect? -->

## What "done" looks like
<!-- How will we know this is finished and working? -->
```

- [ ] **Step 3: Create the PR template**

Create `.github/PULL_REQUEST_TEMPLATE.md`:

```markdown
## Summary
<!-- What does this PR change, in one or two sentences? -->

## Linked issue
Closes #

## Security checklist
- [ ] No secrets, passwords, API keys, or tokens added
- [ ] No sensitive personal data added (repo is public)
- [ ] Any user input is handled safely (no unescaped `innerHTML`)
- [ ] Any new external script/CDN is trusted and version-pinned

## Testing checklist
- [ ] `Checks` workflow passes (HTML validity + links)
- [ ] Page loads and looks right
- [ ] Sidebar nav, week list, and key buttons work
- [ ] Browser console is clean (F12, no JavaScript errors)
```

- [ ] **Step 4: Commit**

```bash
git add .github/ISSUE_TEMPLATE/ .github/PULL_REQUEST_TEMPLATE.md
git commit -m "docs: add issue templates and PR template"
```

- [ ] **Step 5: Verify frontmatter**

Confirm each issue template's YAML frontmatter has `name` and `about` keys and is enclosed in `---` fences. Full render is verified on GitHub in Task 9 (templates appear in the New Issue chooser; PR body pre-fills).

---

### Task 3: `code-standards` skill

**Files:**
- Create: `.claude/skills/code-standards/SKILL.md`

**Interfaces:**
- Produces: skill named `code-standards`, referenced by `control-room-workflow` (Task 7) at the "make the change" step.

- [ ] **Step 1: Write the skill**

Create `.claude/skills/code-standards/SKILL.md` with this frontmatter and content:

```markdown
---
name: code-standards
description: Use when editing index.html or any code in the Control-Room repo — enforces well-commented, consistent code.
---

# Code Standards (Control-Room)

Control-Room is a single static `index.html` with inline CSS and JavaScript. Keep edits consistent with what's already there.

## Comments
- Put a short comment above each major section (CSS block, JS function, HTML region) explaining **why** it exists, not just what it does.
- The file already uses banner comments like `/* SIDEBAR */` and `/* HERO / DASH */`. Match that style.
- Comment anything non-obvious: a magic number, a workaround, an ordering dependency.

## Naming & style
- Follow the existing black / red / white theme variables (`--blk`, `--red`, `--wht`, etc.). Reuse variables instead of hard-coding colors.
- Match the existing indentation and formatting in the surrounding code.
- Use clear, descriptive names for new CSS classes and JS functions/variables.

## Hygiene
- Remove dead code and commented-out blocks you're replacing — don't leave them behind.
- Keep changes focused; don't reformat unrelated regions.
- Don't add a build step or external dependency without discussing it first.
```

- [ ] **Step 2: Commit**

```bash
git add .claude/skills/code-standards/SKILL.md
git commit -m "feat: add code-standards skill"
```

- [ ] **Step 3: Verify**

Confirm the file has valid `---` frontmatter with `name: code-standards` and a `description:` starting with "Use when". Confirm the body covers comments, naming/style, and hygiene.

---

### Task 4: `security-check` skill

**Files:**
- Create: `.claude/skills/security-check/SKILL.md`

**Interfaces:**
- Produces: skill named `security-check`, referenced by `control-room-workflow` (Task 7) before any push, and by the PR template's security checklist.

- [ ] **Step 1: Write the skill**

Create `.claude/skills/security-check/SKILL.md`:

```markdown
---
name: security-check
description: Use when about to commit or push changes to the Control-Room repo — verifies four security guards before anything leaves the machine.
---

# Security Check (Control-Room)

The repo is **public**. Run all four checks against the diff before committing or pushing. If any check fails, STOP, surface the exact content to the user, and do not commit it.

## 1. No secrets
Scan the diff for passwords, API keys, tokens, access keys, connection strings, or credentials. Look for patterns like `key=`, `token=`, `password`, `secret`, long random strings, `AKIA…`, `ghp_…`.

## 2. No sensitive personal data
Because the site is public, flag any private personal data before it's committed: home addresses, personal phone numbers, personal email addresses, government IDs, dates of birth, bank details. Names and public role titles are fine; contact and identity details are not.

## 3. Safe user input (XSS)
If the page reads any user input, confirm the inline JavaScript doesn't inject it unsafely — no `innerHTML`/`insertAdjacentHTML`/`document.write` with unescaped user-controlled values. Prefer `textContent` or proper escaping.

## 4. Vet external code
List any external `<script src>`, stylesheet, or CDN the page loads. Confirm each is a trusted source and pinned to a specific version (not a floating `@latest`). Flag anything unfamiliar.

## Output
Report each of the four checks as pass/fail with a one-line reason. Only proceed to commit when all four pass.
```

- [ ] **Step 2: Commit**

```bash
git add .claude/skills/security-check/SKILL.md
git commit -m "feat: add security-check skill"
```

- [ ] **Step 3: Verify**

Confirm valid frontmatter (`name: security-check`, description starting "Use when") and that the body contains all four numbered guards plus an output section.

---

### Task 5: `testing-control-room` skill

**Files:**
- Create: `.claude/skills/testing-control-room/SKILL.md`

**Interfaces:**
- Consumes: the `checks.yml` workflow and job names from Task 1.
- Produces: skill named `testing-control-room`, referenced by `control-room-workflow` (Task 7) at the "test" step.

- [ ] **Step 1: Write the skill**

Create `.claude/skills/testing-control-room/SKILL.md`:

```markdown
---
name: testing-control-room
description: Use when verifying a change to the Control-Room site before opening or merging a PR — runs the automated checks and the manual smoke checklist.
---

# Testing Control-Room

Two layers: automated checks (also enforced in CI) and a manual smoke checklist.

## Automated checks
These run automatically in the `Checks` workflow (`.github/workflows/checks.yml`) on every PR. To run them locally (optional, needs Node):
- HTML validity: `npx --yes html-validate index.html`
- Broken links: install `lychee` and run `lychee index.html`, or rely on the CI `Broken links` job.

A PR must have a green `Checks` run before it can merge.

## Manual smoke checklist
Open the page (locally or the deploy preview) and confirm:
- [ ] Page loads and looks right (no broken layout).
- [ ] Sidebar navigation switches between views.
- [ ] The week list works.
- [ ] Key buttons respond as expected.
- [ ] No obvious layout breakage at desktop and narrow widths.
- [ ] Browser console is clean — open DevTools (F12), reload, confirm no JavaScript errors.

Record the checklist result in the PR's testing section.
```

- [ ] **Step 2: Commit**

```bash
git add .claude/skills/testing-control-room/SKILL.md
git commit -m "feat: add testing-control-room skill"
```

- [ ] **Step 3: Verify**

Confirm valid frontmatter and that the body references `checks.yml`, lists both automated checks, and includes the manual smoke checklist with the console-error item.

---

### Task 6: `writing-issues` skill

**Files:**
- Create: `.claude/skills/writing-issues/SKILL.md`

**Interfaces:**
- Consumes: the issue templates from Task 2.
- Produces: skill named `writing-issues`, referenced by `control-room-workflow` (Task 7) at the "start from an issue" step.

- [ ] **Step 1: Write the skill**

Create `.claude/skills/writing-issues/SKILL.md`:

```markdown
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
```

- [ ] **Step 2: Commit**

```bash
git add .claude/skills/writing-issues/SKILL.md
git commit -m "feat: add writing-issues skill"
```

- [ ] **Step 3: Verify**

Confirm valid frontmatter and that the body names both templates, gives writing guidance, and shows the `gh issue create` command plus the `Closes #` convention.

---

### Task 7: `control-room-workflow` master skill

**Files:**
- Create: `.claude/skills/control-room-workflow/SKILL.md`

**Interfaces:**
- Consumes: the four skills from Tasks 3–6 (`code-standards`, `security-check`, `testing-control-room`, `writing-issues`) by name.
- Produces: skill named `control-room-workflow` — the entry point for any change to the repo.

- [ ] **Step 1: Write the skill**

Create `.claude/skills/control-room-workflow/SKILL.md`:

```markdown
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
```

- [ ] **Step 2: Commit**

```bash
git add .claude/skills/control-room-workflow/SKILL.md
git commit -m "feat: add control-room-workflow master skill"
```

- [ ] **Step 3: Verify**

Confirm valid frontmatter and that the body lists all 8 steps in order and references `writing-issues`, `code-standards`, `security-check`, and `testing-control-room` by their exact skill names.

---

### Task 8: `CONTRIBUTING.md`

**Files:**
- Create: `CONTRIBUTING.md`

**Interfaces:**
- Consumes: all skills (Tasks 3–7), templates (Task 2), and `checks.yml` (Task 1) — summarizes them for humans.

- [ ] **Step 1: Write the doc**

Create `CONTRIBUTING.md` — a plain-language summary of the whole process for human teammates:

```markdown
# Contributing to FSL Control-Room

Control-Room is a single static site (`index.html`) that deploys automatically to
GitHub Pages when changes land on `main`. To keep the live site safe, **all changes
go through a branch and a pull request — never push directly to `main`.**

## The process
1. **Open an issue** describing the change (bug or feature). Use the templates in the
   "New issue" chooser.
2. **Create a branch** off `main`: `fix/<short-description>` or `feature/<short-description>`.
3. **Make your change**, keeping the code well-commented and consistent with the
   existing black/red/white style.
4. **Check security** before pushing: no secrets, no private personal data (the repo
   is public), safe handling of any user input, and only trusted/pinned external code.
5. **Test it:** the `Checks` workflow runs automatically on your PR (HTML validity +
   broken links). Also walk the manual checklist — page loads, nav works, buttons
   respond, and the browser console (F12) is clean.
6. **Open a pull request** using the PR template and link the issue with `Closes #<number>`.
7. **Get it reviewed and merged.** Merging to `main` deploys the site.
8. **Confirm** the live site looks right after deploy.

## Notes
- Claude Code users: the `.claude/skills/` folder automates this process. Start with
  the `control-room-workflow` skill.
- Recommended: enable branch protection on `main` in GitHub settings so direct pushes
  are blocked as a hard backstop.
```

- [ ] **Step 2: Commit**

```bash
git add CONTRIBUTING.md
git commit -m "docs: add CONTRIBUTING guide"
```

- [ ] **Step 3: Verify**

Confirm the doc covers all 8 process steps in plain language and mentions the `.claude/skills/` automation and the branch-protection recommendation.

---

### Task 9: Integration — push, open PR, verify end-to-end

**Files:** none (uses everything from Tasks 1–8).

**Interfaces:**
- Consumes: all prior tasks.

- [ ] **Step 1: Push the branch**

```bash
git push -u origin Testbranch
```
(This is an explicit publish action — confirm with the user before running.)

- [ ] **Step 2: Open the PR**

```bash
gh pr create --base main --head Testbranch \
  --title "Add GitHub workflow skills, docs, and CI checks" \
  --body "Introduces the branch + PR workflow: five focused skills, CONTRIBUTING, issue/PR templates, and a lean CI checks workflow. See docs/superpowers/specs/2026-07-17-github-workflow-skills-design.md."
```

- [ ] **Step 3: Watch the Checks run and tune**

```bash
gh pr checks --watch
```
Expected: `HTML validity` and `Broken links` both pass. If `HTML validity` fails, relax the specific offending rules in `.htmlvalidate.json` (Task 1, Step 5), commit, and push again until green.

- [ ] **Step 4: Verify templates render on GitHub**

Confirm: opening "New issue" on the repo shows the Bug report and Feature request choices; starting a new PR pre-fills the PR template body.

- [ ] **Step 5: Report status to the user**

Summarize: PR URL, Checks status, and confirm the templates render. Do **not** merge — leave the merge decision to the user (it deploys the live site).

---

## Self-Review

**1. Spec coverage:**
- Audience (Claude + humans) → skills + CONTRIBUTING (Tasks 3–8). ✓
- Scope Control-Room only → all files in this repo. ✓
- Lean testing (HTML validity + links in CI; console errors manual) → Task 1 + Task 5. ✓
- Security four guards → Task 4 + PR template (Task 2). ✓
- Branch + PR always → Task 7 + CONTRIBUTING + Task 9. ✓
- Structured issues (templates, work from issue, PR references issue) → Task 2 + Task 6. ✓
- Structure = focused skills + docs (Approach A) → Tasks 3–8. ✓
- Cleanup stray `chelsitest` → Task 1, Step 3. ✓
- Follow-ups (branch protection, other repos) → noted in CONTRIBUTING and spec, out of scope. ✓

**2. Placeholder scan:** No "TBD"/"TODO"/"handle edge cases"; each content file's full text or exact required sections are provided. ✓

**3. Type/name consistency:** Skill names used identically across tasks — `control-room-workflow`, `writing-issues`, `testing-control-room`, `security-check`, `code-standards`. Workflow file referenced consistently as `checks.yml` with job names `HTML validity` / `Broken links`. ✓
