---
description: Create or update the project constitution from interactive or provided principle inputs, ensuring all dependent templates stay in sync.
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Pre-Execution Checks

**Check for extension hooks (before constitution update)**:
- Check if `.specify/extensions.yml` exists in the project root.
- If it exists, read it and look for entries under the `hooks.before_constitution` key
- Process hooks based on their `optional` flag (same logic as speckit.specify).
- If no hooks are registered or `.specify/extensions.yml` does not exist, skip silently

## Outline

You are updating the project constitution at `.specify/memory/constitution.md`. This file is a TEMPLATE containing placeholder tokens in square brackets (e.g. `[PROJECT_NAME]`, `[PRINCIPLE_1_NAME]`). Your job is to (a) collect/derive concrete values, (b) fill the template precisely, and (c) propagate any amendments across dependent artifacts.

**Note**: If `.specify/memory/constitution.md` does not exist yet, it should have been initialized from `.specify/templates/constitution-template.md` during project setup. If it's missing, copy the template first.

Follow this execution flow:

1. Load the existing constitution at `.specify/memory/constitution.md`.
   - Identify every placeholder token of the form `[ALL_CAPS_IDENTIFIER]`.
   - **IMPORTANT**: The user might require less or more principles than the ones used in the template. If a number is specified, respect that.

2. Collect/derive values for placeholders:
   - If user input supplies a value, use it.
   - Otherwise infer from existing repo context (README, docs, prior constitution versions).
   - For governance dates: `RATIFICATION_DATE` is the original adoption date; `LAST_AMENDED_DATE` is today if changes are made.
   - `CONSTITUTION_VERSION` must increment according to semantic versioning rules:
     - MAJOR: Backward incompatible governance/principle removals or redefinitions.
     - MINOR: New principle/section added or materially expanded guidance.
     - PATCH: Clarifications, wording, typo fixes.

3. Draft the updated constitution content:
   - Replace every placeholder with concrete text (no bracketed tokens left).
   - Ensure each Principle section has: succinct name line, paragraph capturing non-negotiable rules, explicit rationale.
   - Ensure Governance section lists amendment procedure, versioning policy, and compliance review.

4. Consistency propagation checklist:
   - Read `.specify/templates/plan-template.md` — ensure Constitution Check aligns with updated principles.
   - Read `.specify/templates/spec-template.md` — update if constitution adds/removes mandatory sections.
   - Read `.specify/templates/tasks-template.md` — ensure task categorization reflects new/removed principle-driven task types.
   - Read command files in `.specify/templates/commands/*.md` to verify no outdated references.

5. Produce a Sync Impact Report (prepend as HTML comment at top of constitution file after update):
   - Version change: old → new
   - List of modified principles
   - Added and removed sections
   - Templates requiring updates (✅ updated / ⚠ pending)
   - Follow-up TODOs for any deferred placeholders

6. Validation before final output:
   - No remaining unexplained bracket tokens.
   - Version line matches report.
   - Dates in ISO format YYYY-MM-DD.
   - Principles are declarative and free of vague language.

7. Write the completed constitution back to `.specify/memory/constitution.md` (overwrite).

8. Output a final summary:
   - New version and bump rationale.
   - Files flagged for manual follow-up.
   - Suggested commit message.

Formatting & Style Requirements:
- Use Markdown headings exactly as in the template.
- Keep a single blank line between sections.
- Avoid trailing whitespace.

If critical info missing (e.g., ratification date truly unknown), insert `TODO(<FIELD_NAME>): explanation` and include in the Sync Impact Report.

## Post-Execution Checks

**Check for extension hooks (after constitution update)**:
Check if `.specify/extensions.yml` exists in the project root for `hooks.after_constitution` and process accordingly.
