# Hypothesis Validation Experiments: AUTOPILOT Plugin

## Experiment 1: Unattended Agent Autonomy

**Hypothesis:** > If developers can configure an AI agent to iterate autonomously (plan → code → review → test → commit) with a single initial description, then they will ship features 2x faster, because they currently spend 50% of session time on manual iteration scaffolding.

**Success Metrics:**

| Metric | Target | Threshold | Method |
|---|---|---|---|
| Feature completion time | 50% reduction vs. manual multi-step prompting | ≥30% reduction = success | A/B test: 10 developers, 2 features each (1 manual, 1 AUTOPILOT) |
| Code review pass rate | ≥80% first-pass acceptance | ≥60% = acceptable | Track review outcome of AUTOPILOT PRs |
| User opt-in rate for auto-commit | ≥60% of users enable it within 2 weeks | ≥40% = acceptable | Telemetry on auto-commit vs. manual-approve mode |

**Experiment Method:** Build "supervised" mode (user approves each step) with an opt-in "auto" toggle. Recruit 10 beta testers from opencode community. Each tester implements 2 features: one via traditional prompting, one via AUTOPILOT. Compare time-to-PR, code quality scores, and qualitative feedback.

**Timeline:** Prep (1 week: build supervised mode + telemetry) → Execution (2 weeks: beta test) → Analysis (1 week: compile results).

**Pivot Triggers:**
- Persevere if: Feature completion time reduces ≥30% AND auto-commit opt-in ≥40%
- Pivot if: Completion time reduces <30% OR users disable auto-commit within first week — switch to "manual-approve by default" UX
- Investigate if: Code quality is worse than manual — add mandatory code review gate before commit

---

## Experiment 2: Fresh Context vs. Accumulated History

**Hypothesis:** > If AUTOPILOT provides fresh, compressed context at each iteration step (instead of full conversation history), then output quality will be higher, because context window dilution is the primary cause of quality decay.

**Success Metrics:**

| Metric | Target | Threshold | Method |
|---|---|---|---|
| First-pass code quality score | 20% higher with fresh context | ≥10% = confirm hypothesis | A/B test: same feature, two approaches |
| Session length before quality degrades | 2x longer with fresh context | 1.5x = acceptable | Measure quality score every 5 iterations |

**Experiment Method:** Run 2 parallel agents on the same feature request: one using full conversation history, one using summarized/compressed context each iteration. Compare generated code quality (lint errors, test coverage, manual review score).

**Timeline:** Prep (3 days: build context compression module) → Execution (1 week: benchmark on 5 open-source repos with 3 features each) → Analysis (2 days).

**Pivot Triggers:**
- Persevere if: Fresh context scores ≥10% higher on quality
- Pivot if: Accumulated history scores higher — revert to full-history approach but implement context pruning instead
- Investigate if: Results are inconclusive (within ±5%) — run larger sample

---

## Experiment 3: Multi-Model Orchestration Value

**Hypothesis:** > If AUTOPILOT routes planning to Claude and coding to GPT-4 (best model per phase), then users will prefer the combined output over single-model output, because different models have different strengths.

**Success Metrics:**

| Metric | Target | Threshold | Method |
|---|---|---|---|
| User preference score | 70% prefer multi-model | ≥60% = confirm | Blind comparison survey with 15 developers |
| Code quality (lint/test pass) | 15% fewer lint errors | ≥10% = acceptable | Automated comparison on 10 features |

**Experiment Method:** Implement multi-model bridge: Claude 3.5 Sonnet for planning/architecture, GPT-4o for coding, o3-mini for review. Run 10 feature implementations through single-model (Claude only) and multi-model pipeline. Blind-review outputs.

**Timeline:** Prep (1 week: multi-model bridge + routing logic) → Execution (2 weeks: 10 feature implementations × 2 approaches) → Analysis (1 week).

**Pivot Triggers:**
- Persevere if: Multi-model preferred by ≥60%
- Pivot if: Multi-model not preferred — simplify to single-model with optional model override
- Investigate if: Certain feature types benefit more — offer model routing rules per feature type
