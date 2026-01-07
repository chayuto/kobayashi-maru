# Task: Test Coverage Expansion

> **Priority**: P0 - Pre-requisite for Major Refactoring
> **Focus**: Increase line coverage, not comprehensive corner cases
> **Approach**: Quick wins first

## Objective

Deep analysis of codebase and test coverage to find quick wins for increasing line coverage before major refactoring efforts. Focus on line coverage rather than exhaustive edge case testing.

## Pre-Task Requirements

> [!IMPORTANT]
> Before identifying coverage gaps:
> 1. DEEP research the entire codebase methodically
> 2. Run current coverage report: `npx vitest run --coverage`
> 3. Create intermediate analysis documents as needed
> 4. Do NOT rush - spend time understanding existing test patterns

## Reference Documents

The following tasks have already been identified (see individual task files):

| Task | Module | Status |
|------|--------|--------|
| [task-01](./20260107_task-01-behavior-counter-selector-tests.md) | BehaviorCounterSelector | Pending |
| [task-02](./20260107_task-02-ai-mood-engine-tests.md) | AIMoodEngine | Pending |
| [task-03](./20260107_task-03-scoring-curves-expand.md) | ScoringCurves | Pending |
| [task-04](./20260107_task-04-achievement-manager-tests.md) | AchievementManager | Pending |
| [task-05](./20260107_task-05-coverage-analyzer-tests.md) | CoverageAnalyzer | Pending |
| [task-06](./20260107_task-06-threat-analyzer-tests.md) | ThreatAnalyzer | Pending |
| [task-07](./20260107_task-07-action-planner-tests.md) | ActionPlanner | Pending |
| [task-08](./20260107_task-08-action-executor-tests.md) | ActionExecutor | Pending |
| [task-09](./20260107_task-09-approach-corridor-tests.md) | ApproachCorridorAnalyzer | Pending |

See [test-coverage-gaps-report.md](./20260107_test-coverage-gaps-report.md) for full analysis.

## Execution Strategy

### Phase 1: Easy Wins (P1)
Execute tasks 01-03 first:
- Pure functions with deterministic outputs
- Minimal mocking required
- ~680 lines of coverage

### Phase 2: Medium Complexity (P2)
Execute tasks 04-06:
- Some mocking required
- Clear testable interfaces
- ~850 lines of coverage

### Phase 3: Complex Setup (P3)
Execute tasks 07-09:
- World/entity mocking needed
- Higher setup time
- ~670 lines of coverage

## Per-Task Execution Flow

For each task:

1. **Read task document** in `/docs/internal/task-XX-*.md`
2. **Create test file** following documented structure
3. **Run tests** to verify:
   ```bash
   npx vitest run src/__tests__/<TestFile>.test.ts
   ```
4. **Check coverage**:
   ```bash
   npx vitest run --coverage src/__tests__/<TestFile>.test.ts
   ```
5. **Verify full suite**:
   ```bash
   npm test
   ```

## Completion Requirements

> [!CAUTION]
> Before marking complete:

1. All new tests pass
2. Full test suite passes (`npm test`)
3. Lint passes (`npm run lint`)
4. Task completion report generated in `/docs/change_notes/YYYYMMDD_test-coverage-<module>.md`

## Report Template

For each completed task, create: `/docs/change_notes/YYYYMMDD_test-coverage-<module>.md`

```markdown
# Test Coverage: <Module Name>

## Summary
- Test file: `src/__tests__/<File>.test.ts`
- Lines covered: X
- Tests added: Y

## Test Cases
1. Description of test case 1
2. Description of test case 2
...

## Verification
- [ ] npx vitest run: PASS
- [ ] npm run lint: PASS
- [ ] Full suite: PASS

## Coverage Delta
- Before: X%
- After: Y%
```
