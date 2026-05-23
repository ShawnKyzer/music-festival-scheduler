---
description: Initialize a Git repository with an initial commit if one does not already exist.
---

# Initialize Git Repository

Initialize a Git repository in the current project directory if one does not already exist.

## Execution

Run the appropriate script from the project root:

- **Bash**: `.specify/extensions/git/scripts/bash/initialize-repo.sh`

If the extension scripts are not found, fall back to:
- `git init && git add . && git commit -m "Initial commit from Specify template"`

The script handles all checks internally:
- Skips if Git is not available
- Skips if already inside a Git repository
- Runs `git init`, `git add .`, and `git commit` with an initial commit message

## Customization

Replace the script to add project-specific Git initialization steps:
- Custom `.gitignore` templates
- Default branch naming (`git config init.defaultBranch`)
- Git LFS setup
- Git hooks installation
- Commit signing configuration

## Output

On success:
- `✓ Git repository initialized`

## Graceful Degradation

If Git is not installed:
- Warn the user
- Skip repository initialization
- The project continues to function without Git

If `git init`, `git add .`, or `git commit` fails:
- Surface the error to the user
- Stop this command rather than continuing with a partially initialized repository
