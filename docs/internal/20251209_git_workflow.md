# Git Workflow
**Date:** 2024-05-22
**Status:** Active

## Overview

A consistent git workflow helps in tracking changes and collaboration.

## Branching Strategy

- **main**: Stable, deployable code.
- **feature/name**: New features.
- **fix/issue**: Bug fixes.
- **refactor/name**: Code improvements without behavior change.

## Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.

Format: `<type>(<scope>): <subject>`

### Types
- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that do not affect the meaning of the code (white-space, formatting, etc)
- **refactor**: A code change that neither fixes a bug nor adds a feature
- **perf**: A code change that improves performance
- **test**: Adding missing tests or correcting existing tests
- **chore**: Changes to the build process or auxiliary tools and libraries such as documentation generation

### Examples
- `feat(combat): add new torpedo launcher`
- `fix(ai): resolve pathfinding loop for klingons`
- `docs(internal): add architecture guidelines`

## Pull Requests
- Keep PRs small and focused.
- Describe what was changed and why.
- Link to relevant issues.
- Ensure CI (tests, lint) passes before merging.
