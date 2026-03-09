# PRD Generation Prompt

> Copy this prompt into Claude/ChatGPT. Replace all `[PLACEHOLDERS]`.
> This is a 2-step process: Analysis first, then PRD generation.

---

## STEP 1: Analysis (Paste This First)

```
You are a senior product manager + backend architect for a CRM SaaS platform.

## Product Context (Pre-filled)
- **Product:** CRM SaaS with dynamic object types
- **Surfaces:** Admin (`/admin/*`) and Client (`/crm-object*`, `/auth2/*`, etc.)
- **Tenancy:** Multi-tenant via `companyId` (Client surface is company-scoped)
- **Static Pages:** Admin pages like Companies, Properties, Templates, Admins
- **Dynamic Pages:** Client CRM object pages (Contacts, Deals, custom objects via `objectTypeId`)

---

**Feature:** [FEATURE_NAME]
**Surface:** [admin | client | both]
**Page Type:** [static pages | dynamic object pages | both]

### Context
[Paste 2-5 sentences describing the feature. What problem does it solve? Who uses it?]

### Current Behavior
[What happens today? Why is it painful?]

### Desired Behavior
[What should happen after this ships?]

### MVP Constraints (Known)
[List any decisions already made - e.g., "presets are per-user only", "no sharing in v1"]

### Out of Scope (v1)
[List what you explicitly will NOT build]

---

**TASK — PHASE 1 ONLY:**
1. Summarize the feature in your own words (2-3 sentences).
2. List 5-8 key decisions we must lock before writing the PRD.
3. List 5-8 edge cases and risks.
4. Ask 3-8 high-impact clarifying questions.

**STOP and wait for my answers before proceeding.**
```

---

## STEP 2: Generate PRD (Paste After Answering Questions)

```
Now write the full PRD for [FEATURE_NAME].

**Output file:** `feature-docs/[feature-slug]/PRD-[feature-slug].md`

**Required sections:**

1. **Goal / Problem Statement**
   - What problem are we solving?
   - Why does this matter?
   - Success metrics (if applicable)

2. **Users & Roles**
   - Who uses this feature?
   - What permissions/access do they have?

3. **User Stories** (minimum 6)
   - Cover all surfaces (admin/client)
   - Cover all user types
   - Include edge cases
   - Format: "As a [role], I want to [action] so that [benefit]"

4. **In Scope (MVP)**
   - Bullet list of what WILL be built
   - Be specific

5. **Out of Scope**
   - Bullet list of what will NOT be built
   - Explain why (deferred, separate feature, etc.)

6. **UX Flow**
   - Screens involved
   - UI states (empty, loading, error, success, modified, etc.)
   - State diagram if helpful (ASCII or mermaid)
   - User interactions and transitions

7. **Acceptance Criteria**
   - Testable checkbox list
   - Grouped by area (Creation, Application, Management, Edge Cases, etc.)
   - Each criterion must be verifiable

8. **Non-Functional Requirements**
   - Security (auth, tenant isolation, RBAC)
   - Performance (latency targets, limits)
   - Logging/Audit (what to track)

9. **Analytics / Telemetry**
   - Events to track
   - Properties to include
   - Purpose of each event

10. **Key Decisions Summary**
    - Table format: | Decision | Choice |
    - Document all major decisions made

**Rules:**
- NO endpoints, DB schema, DTOs, or implementation details
- Product requirements and UX behavior ONLY
- Use tables and diagrams where they add clarity
- Acceptance criteria must be testable (not vague like "should work well")

**My answers to your questions:**
[PASTE YOUR ANSWERS HERE]
```

---

## Tips for Better PRDs

1. **Be Specific:** Instead of "users can manage presets", say "users can create, rename, delete, and set a default preset"

2. **Cover Edge Cases:** What happens when data is deleted? When fields change? When limits are exceeded?

3. **Think Multi-Tenant:** Always consider tenant isolation - can one company ever see another's data?

4. **Consider Both Surfaces:** If the feature works on admin AND client, document both explicitly

5. **Define "Done":** Acceptance criteria should answer "how do we know this is complete?"