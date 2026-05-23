---
description: Generate a custom checklist for the current feature based on user requirements. Checklists are "unit tests for requirements" — they validate quality, clarity, and completeness of the spec, not implementation behavior.
---

## Checklist Purpose: "Unit Tests for English"

**CRITICAL CONCEPT**: Checklists are **UNIT TESTS FOR REQUIREMENTS WRITING** - they validate the quality, clarity, and completeness of requirements in a given domain.

**NOT for verification/testing**:

- ❌ NOT "Verify the button clicks correctly"
- ❌ NOT "Test error handling works"
- ❌ NOT "Confirm the API returns 200"

**FOR requirements quality validation**:

- ✅ "Are visual hierarchy requirements defined for all card types?" (completeness)
- ✅ "Is 'prominent display' quantified with specific sizing/positioning?" (clarity)
- ✅ "Are accessibility requirements defined for keyboard navigation?" (coverage)

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Pre-Execution Checks

**Check for extension hooks (before checklist generation)**:
- Check if `.specify/extensions.yml` exists in the project root.
- If it exists, read it and look for entries under the `hooks.before_checklist` key
- Process hooks based on their `optional` flag (same logic as speckit.specify).
- If no hooks are registered or `.specify/extensions.yml` does not exist, skip silently

## Execution Steps

1. **Setup**: Run `.specify/scripts/bash/check-prerequisites.sh --json` from repo root and parse JSON for FEATURE_DIR and AVAILABLE_DOCS list.

2. **Clarify intent (dynamic)**: Derive up to THREE initial contextual clarifying questions generated from the user's phrasing + extracted signals from spec/plan/tasks. Skip individually if already unambiguous in `$ARGUMENTS`. Ask questions about scope, risk prioritization, depth calibration, audience, and boundary exclusions. Do not exceed five total questions.

3. **Understand user request**: Combine `$ARGUMENTS` + clarifying answers to derive checklist theme, must-have items, and focus areas.

4. **Load feature context**: Read from FEATURE_DIR:
   - spec.md: Feature requirements and scope
   - plan.md (if exists): Technical details, dependencies
   - tasks.md (if exists): Implementation tasks

5. **Generate checklist** - Create "Unit Tests for Requirements":
   - Create `FEATURE_DIR/checklists/` directory if it doesn't exist
   - Generate unique checklist filename based on domain (e.g., `ux.md`, `api.md`, `security.md`)
   - If file does NOT exist: Create new file, number items starting from CHK001
   - If file exists: Append new items, continuing from last CHK ID
   - Never delete or replace existing checklist content

   **CORE PRINCIPLE**: Every checklist item MUST evaluate the REQUIREMENTS THEMSELVES for:
   - **Completeness**: Are all necessary requirements present?
   - **Clarity**: Are requirements unambiguous and specific?
   - **Consistency**: Do requirements align with each other?
   - **Measurability**: Can requirements be objectively verified?
   - **Coverage**: Are all scenarios/edge cases addressed?

   **ITEM STRUCTURE**:
   - Question format asking about requirement quality
   - Focus on what's WRITTEN (or not written) in the spec/plan
   - Include quality dimension in brackets [Completeness/Clarity/Consistency/etc.]
   - Reference spec section `[Spec §X.Y]` when checking existing requirements
   - Use `[Gap]` marker when checking for missing requirements

   **🚫 ABSOLUTELY PROHIBITED**:
   - ❌ Any item starting with "Verify", "Test", "Confirm", "Check" + implementation behavior
   - ❌ References to code execution, user actions, system behavior
   - ❌ "Displays correctly", "works properly", "functions as expected"

   **✅ REQUIRED PATTERNS**:
   - ✅ "Are [requirement type] defined/specified/documented for [scenario]?"
   - ✅ "Is [vague term] quantified/clarified with specific criteria?"
   - ✅ "Can [requirement] be objectively measured/verified?"

6. **Structure Reference**: Use `.specify/templates/checklist-template.md` if available; otherwise use H1 title, purpose/created meta lines, `##` category sections with `- [ ] CHK### <item>` lines.

7. **Report**: Output full path to checklist file, item count, and summary of focus areas, depth level, and any user-specified items incorporated.

## Post-Execution Checks

**Check for extension hooks (after checklist generation)**:
Check if `.specify/extensions.yml` exists in the project root for `hooks.after_checklist` and process accordingly.
