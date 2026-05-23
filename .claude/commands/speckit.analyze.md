---
description: Perform a non-destructive cross-artifact consistency and quality analysis across spec.md, plan.md, and tasks.md after task generation.
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Pre-Execution Checks

**Check for extension hooks (before analysis)**:
- Check if `.specify/extensions.yml` exists in the project root.
- If it exists, read it and look for entries under the `hooks.before_analyze` key
- Process hooks based on their `optional` flag (same logic as speckit.specify).
- If no hooks are registered or `.specify/extensions.yml` does not exist, skip silently

## Goal

Identify inconsistencies, duplications, ambiguities, and underspecified items across the three core artifacts (`spec.md`, `plan.md`, `tasks.md`) before implementation. This command MUST run only after `/speckit.tasks` has successfully produced a complete `tasks.md`.

## Operating Constraints

**STRICTLY READ-ONLY**: Do **not** modify any files. Output a structured analysis report. Offer an optional remediation plan (user must explicitly approve before any follow-up editing commands would be invoked manually).

**Constitution Authority**: The project constitution (`.specify/memory/constitution.md`) is **non-negotiable** within this analysis scope. Constitution conflicts are automatically CRITICAL and require adjustment of the spec, plan, or tasks.

## Execution Steps

### 1. Initialize Analysis Context

Run `.specify/scripts/bash/check-prerequisites.sh --json --require-tasks --include-tasks` once from repo root and parse JSON for FEATURE_DIR and AVAILABLE_DOCS. Derive absolute paths:

- SPEC = FEATURE_DIR/spec.md
- PLAN = FEATURE_DIR/plan.md
- TASKS = FEATURE_DIR/tasks.md

Abort with an error message if any required file is missing (instruct the user to run missing prerequisite command).

### 2. Load Artifacts (Progressive Disclosure)

Load only the minimal necessary context from each artifact:

**From spec.md:** Overview/Context, Functional Requirements, Success Criteria, User Stories, Edge Cases

**From plan.md:** Architecture/stack choices, Data Model references, Phases, Technical constraints

**From tasks.md:** Task IDs, Descriptions, Phase grouping, Parallel markers [P], Referenced file paths

**From constitution:** Load `.specify/memory/constitution.md` for principle validation

### 3. Build Semantic Models

Create internal representations for requirements inventory, user story/action inventory, task coverage mapping, and constitution rule set.

### 4. Detection Passes

Focus on high-signal findings. Limit to 50 findings total.

#### A. Duplication Detection
- Identify near-duplicate requirements

#### B. Ambiguity Detection
- Flag vague adjectives lacking measurable criteria
- Flag unresolved placeholders (TODO, TKTK, ???)

#### C. Underspecification
- Requirements with verbs but missing object or measurable outcome
- Tasks referencing files or components not defined in spec/plan

#### D. Constitution Alignment
- Any requirement or plan element conflicting with a MUST principle

#### E. Coverage Gaps
- Requirements with zero associated tasks
- Tasks with no mapped requirement/story

#### F. Inconsistency
- Terminology drift (same concept named differently across files)
- Data entities referenced in plan but absent in spec (or vice versa)
- Task ordering contradictions

### 5. Severity Assignment

- **CRITICAL**: Violates constitution MUST, missing core spec artifact, or requirement with zero coverage
- **HIGH**: Duplicate or conflicting requirement, ambiguous security/performance attribute
- **MEDIUM**: Terminology drift, missing non-functional task coverage
- **LOW**: Style/wording improvements, minor redundancy

### 6. Produce Compact Analysis Report

Output a Markdown report with findings table, coverage summary table, constitution alignment issues, unmapped tasks, and metrics.

### 7. Provide Next Actions

At end of report, output a concise Next Actions block with command suggestions.

### 8. Offer Remediation

Ask the user: "Would you like me to suggest concrete remediation edits for the top N issues?" (Do NOT apply them automatically.)

### 9. Check for extension hooks

After reporting, check if `.specify/extensions.yml` exists in the project root for `hooks.after_analyze`.

## Operating Principles

- **NEVER modify files** (this is read-only analysis)
- **NEVER hallucinate missing sections** (if absent, report them accurately)
- **Prioritize constitution violations** (these are always CRITICAL)
- **Report zero issues gracefully** (emit success report with coverage statistics)

## Context

$ARGUMENTS
