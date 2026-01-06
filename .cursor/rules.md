# Cursor Rules – Project Guidelines

## 1. General Principles
- Produce **production-ready code** only.
- Prefer **clarity over cleverness**.
- Minimize changes: **do not refactor unrelated code**.
- Keep solutions **simple and explicit**.
- No speculative features or abstractions.

---

## 2. Code Style & Quality
- Follow existing **project conventions** (naming, structure, formatting).
- Respect linters and formatters already in place.
- Use **descriptive variable and function names**.
- Functions should be **small and single-purpose**.
- Avoid magic numbers; extract constants when relevant.

---

## 3. Architecture & Boundaries
- Do **not mix responsibilities**:
  - Controllers / handlers: orchestration only
  - Services: business logic
  - Repositories / clients: I/O and external systems
- Do not introduce new layers without explicit approval.
- Do not move files or rename public APIs unless asked.

---

## 4. Dependencies
- **Do not add new dependencies** without explicit approval.
- Prefer native language features over external libraries.
- Never upgrade dependency versions unless requested.

---

## 5. Error Handling
- Handle errors explicitly.
- Do not swallow exceptions.
- Prefer meaningful error messages.
- Never expose sensitive information (tokens, secrets, PII).

---

## 6. Performance & Security
- Avoid unnecessary computations or allocations.
- Be mindful of async / blocking calls.
- Assume inputs are untrusted unless specified otherwise.
- Validate external data at boundaries.

---

## 7. Tests
- If tests exist:
  - Keep them passing.
  - Update or add tests when behavior changes.
- If no tests exist:
  - Do not introduce a test framework unless requested.
- Do not mock unnecessarily.

---

## 8. Documentation & Comments
- Comment **why**, not **what**.
- Update existing documentation when behavior changes.
- Do not add verbose comments for obvious code.
- Do not create any documentation files (.md, etc.) unless requested.

---

## 9. Git & Diff Hygiene
- Keep diffs **small and readable**.
- Avoid large rewrites.
- Do not reformat files unless needed.
- Prefer incremental improvements.

---

## 10. Explicit Constraints
- Do NOT:
  - Invent requirements
  - Change business rules
  - Rename domain concepts
  - Introduce breaking changes
- If something is ambiguous, **ask before assuming**.

---

## 11. Default Behavior
When in doubt:
1. Ask a clarification question  
2. Or choose the **least risky, most conservative** solution

