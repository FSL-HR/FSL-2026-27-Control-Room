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
