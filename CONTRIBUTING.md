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
