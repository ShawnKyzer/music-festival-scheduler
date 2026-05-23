---
description: Identify underspecified areas in the current feature spec by asking up to 5 highly targeted clarification questions and encoding answers back into the spec.
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Pre-Execution Checks

**Check for extension hooks (before clarification)**:
- Check if `.specify/extensions.yml` exists in the project root.
- If it exists, read it and look for entries under the `hooks.before_clarify` key
- Process hooks based on their `optional` flag (same logic as speckit.specify).
- If no hooks are registered or `.specify/extensions.yml` does not exist, skip silently

## Outline

Goal: Detect and reduce ambiguity or missing decision points in the active feature specification and record the clarifications directly in the spec file.

Note: This clarification workflow is expected to run (and be completed) BEFORE invoking `/speckit.plan`. If the user explicitly states they are skipping clarification (e.g., exploratory spike), you may proceed, but must warn that downstream rework risk increases.

Execution steps:

1. Run `.specify/scripts/bash/check-prerequisites.sh --json --paths-only` from repo root **once**. Parse minimal JSON payload fields: `FEATURE_DIR`, `FEATURE_SPEC`. If JSON parsing fails, abort and instruct user to re-run `/speckit.specify`.

2. Load the current spec file. Perform a structured ambiguity & coverage scan using this taxonomy. For each category, mark status: Clear / Partial / Missing:

   - Functional Scope & Behavior
   - Domain & Data Model
   - Interaction & UX Flow
   - Non-Functional Quality Attributes (performance, scalability, reliability, observability, security, compliance)
   - Integration & External Dependencies
   - Edge Cases & Failure Handling
   - Constraints & Tradeoffs
   - Terminology & Consistency
   - Completion Signals

3. Generate (internally) a prioritized queue of candidate clarification questions (maximum 5). Each question must be answerable with either a short multiple-choice selection (2–5 options) or a one-word/short-phrase answer (<=5 words). Only include questions whose answers materially impact architecture, data modeling, task decomposition, test design, UX behavior, operational readiness, or compliance validation.

4. Sequential questioning loop (interactive):
    - Present EXACTLY ONE question at a time.
    - For multiple-choice questions: Provide **Recommended** option with reasoning, then render all options as a Markdown table.
    - For short-answer style: Provide **Suggested** answer with brief reasoning.
    - After user answers, validate and record in working memory, then move to next question.
    - Stop when all critical ambiguities resolved, user signals completion, or 5 questions reached.
    - Never reveal future queued questions in advance.

5. Integration after EACH accepted answer (incremental update approach):
    - Maintain in-memory representation of the spec.
    - Ensure a `## Clarifications` section exists (create just after overview section if missing).
    - Under it, create `### Session YYYY-MM-DD` subheading for today.
    - Append bullet: `- Q: <question> → A: <final answer>`
    - Apply clarification to the most appropriate section(s) of the spec immediately.
    - Save the spec file AFTER each integration.

6. Validation (performed after EACH write plus final pass):
   - Clarifications session contains exactly one bullet per accepted answer (no duplicates).
   - Total asked questions ≤ 5.
   - No contradictory earlier statements remain.
   - Markdown structure valid.

7. Write the updated spec back to `FEATURE_SPEC`.

8. Report completion:
   - Number of questions asked & answered.
   - Path to updated spec.
   - Sections touched.
   - Coverage summary table.
   - Suggested next command.

Behavior rules:

- If no meaningful ambiguities found, respond: "No critical ambiguities detected worth formal clarification." and suggest proceeding.
- If spec file missing, instruct user to run `/speckit.specify` first.
- Never exceed 5 total asked questions.
- Respect user early termination signals ("stop", "done", "proceed").

Context for prioritization: $ARGUMENTS

## Post-Execution Checks

**Check for extension hooks (after clarification)**:
Check if `.specify/extensions.yml` exists in the project root for `hooks.after_clarify` and process accordingly.
