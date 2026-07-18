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
