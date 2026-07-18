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
