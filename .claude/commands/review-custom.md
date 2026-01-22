---

description: Review critical changes, rerun validations, and update documentation if needed

allowed-tools: Bash(git status:\*), Bash(git diff:\*), Bash(git log:\*)

argument-hint: \[optional focus or notes]

---



\## Context



You are reviewing the project \*\*after recent code changes\*\*.



\### Git context

\- Current status: !`git status`

\- Diff against last commit: !`git diff HEAD`

\- Recent commits: !`git log --oneline -5`



\## Your task



Perform a \*\*post-change critical review\*\* with the following steps:



\### 1. Identify critical files

Determine which changed files are critical, including but not limited to:

\- Backend core logic

\- API routes or controllers

\- Database schemas or migrations

\- Auth, permissions, billing, or financial logic

\- Shared utilities used across the system

\- Config or environment-sensitive files



Explicitly list which files you consider critical and why.



\### 2. Code review

For the critical files:

\- Validate logic correctness

\- Check for regressions, edge cases, and breaking changes

\- Verify consistency with existing architecture and patterns

\- Call out risks or technical debt introduced



Be direct. No politeness padding.



\### 3. Tests and validation

\- Check whether existing tests still cover the modified behavior

\- If tests exist, explain whether they are sufficient

\- If tests are missing or outdated, explicitly say so and describe what should exist



Do NOT invent test results. Reason based on the code and project structure.



\### 4. Documentation review

Check whether changes require updates to:

\- README

\- API docs

\- Inline comments

\- Architectural notes

\- Any `/docs` content



If updates are needed:

\- Specify exactly \*\*what should be updated\*\*

\- If possible, draft the updated documentation text



\### 5. Final summary

End with:

\- ✔ What is OK

\- ⚠ What is risky or incomplete

\- 📄 What documentation was updated or must be updated

\- 🧪 What tests are missing or should be revised



Optional notes from the user:

$ARGUMENTS



