# Target User Definition: AUTOPILOT Plugin

## Persona 1: Solo Developer "Alex"

**Role:** Full-stack developer at a startup or indie hacker building products independently
**Demographics:** 25-40 years old, experienced in 2+ programming languages, uses AI coding tools daily

**Goals:**
- Ship features faster without sacrificing code quality
- Maintain context across multi-file feature implementations in single sessions
- Delegate repetitive coding cycles (test → lint → fix → commit) to automation
- Experiment with multiple AI models for different tasks without context loss

**Frustrations:**
- Session quality decays from excellent to unusable within 20-30 minutes
- Manually re-explaining project architecture every time a session restarts
- Breaking complex features into tiny prompts because the agent "forgets" earlier context
- Switching between Claude for planning and GPT-4 for coding requires manual effort

**Behavioral Patterns:** Uses VS Code with opencode CLI, prefers keyboard-driven workflows, reads documentation before adopting tools, active in developer communities.

**Tech Savviness:** Expert — comfortable with CLI tools, plugin configuration, and debugging agent behavior.

**Quote:** "I want to describe a feature once and have the AI build it end-to-end while I review."

---

## Persona 2: Team Lead "Jordan"

**Role:** Engineering team lead at a mid-size company (20-100 engineers)
**Demographics:** 30-50 years old, manages 3-8 engineers, reviews all PRs

**Goals:**
- Standardize AI-assisted code quality across the team
- Reduce review cycle time by catching issues before PR submission
- Ensure consistent coding patterns and best practices in AI-generated code
- Track what work was done autonomously vs. manually

**Frustrations:**
- Team members get inconsistent results from AI tools depending on prompt quality
- No visibility into how much AI-generated code needs human rework
- Onboarding new engineers requires teaching them prompt engineering alongside codebase
- Cannot trust AI to handle multi-step tasks without human babysitting

**Behavioral Patterns:** Reviews code in GitHub/GitLab, sets team coding standards, evaluates tools for team adoption.

**Tech Savviness:** Intermediate-Expert — codes regularly but prioritizes management workflow integration.

**Quote:** "I need my team's AI tools to produce consistent, reviewable work without everyone reinventing their own workflow."

---

## Persona 3: CI/CD Pipeline Operator "Sam"

**Role:** DevOps/platform engineer setting up automated development pipelines
**Demographics:** 28-45 years old, maintains CI/CD infrastructure, scripts automation

**Goals:**
- Automate code generation as part of the development pipeline
- Reliably trigger AI coding tasks from PR comments or issue assignments
- Integrate AI-generated code with existing quality gates (linters, tests, security scans)
- Log and audit all AI-generated changes for compliance

**Frustrations:**
- Current AI tools are designed for interactive use, not headless automation
- No API or CLI contract for triggering multi-step coding workflows
- Cannot enforce quality gates between AI planning and code generation stages
- Lack of state persistence means each pipeline invocation starts from scratch

**Behavioral Patterns:** Writes YAML/TOML configs, maintains GitHub Actions/GitLab CI, scripts automation with Python/bash.

**Tech Savviness:** Expert — deep understanding of CI/CD, containerization, and API-driven automation.

**Quote:** "I want to trigger 'fix this bug' from a GitHub issue and have the bot return a PR with passing tests."
