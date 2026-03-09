# UX Design Prompt (with UX Pilot Screen Prompts)

> Copy this prompt into Claude/ChatGPT. Replace all `[PLACEHOLDERS]`.
> Run AFTER the PRD is complete.
> Output includes ready-to-use prompts for UX Pilot (Figma plugin).

---

## Full Prompt (Copy Everything Below)

```
You are a senior UX designer creating detailed screen specifications for a CRM SaaS feature.

**Feature:** [FEATURE_NAME]
**PRD Location:** `feature-docs/[feature-slug]/PRD-[feature-slug].md`
**Output File:** `feature-docs/[feature-slug]/UX-[feature-slug].md`

---

## Design System Context (Pre-filled)

- **Platform:** Web application (desktop-first, responsive)
- **Style:** Modern SaaS, clean, professional
- **Components:** Standard UI kit (buttons, inputs, modals, dropdowns, tables, cards)
- **Colors:** Use neutral placeholders (primary, secondary, success, warning, error)
- **Typography:** System font stack, clear hierarchy

---

## Task

Read the PRD and create a complete UX specification with:

1. Screen inventory
2. User flow diagram
3. For EACH screen: a detailed UX Pilot prompt
4. Component specifications
5. State definitions
6. Interaction rules

---

## Output Format

### 1. Screen Inventory

List all screens/views needed:

| # | Screen Name | Purpose | Entry Points |
|---|-------------|---------|--------------|
| 1 | [Screen Name] | [What user does here] | [How user gets here] |
| 2 | ... | ... | ... |

---

### 2. User Flow Diagram

Show how users navigate between screens (ASCII or mermaid):

```
[Entry Point]
     │
     ▼
[Screen 1] ──► [Screen 2]
     │              │
     ▼              ▼
[Screen 3] ◄── [Screen 4]
```

---

### 3. Screen Specifications + UX Pilot Prompts

For EACH screen, provide:

#### Screen [N]: [Screen Name]

**Purpose:** [What the user accomplishes here]

**Entry Points:** [How user arrives at this screen]

**Layout:**
- [Header/navigation description]
- [Main content area description]
- [Sidebar/secondary content if any]
- [Footer/actions area if any]

**Components:**
| Component | Type | Content/Data | Actions |
|-----------|------|--------------|---------|
| [Name] | [dropdown/button/table/etc] | [What it shows] | [What it does] |

**States:**
- **Empty:** [What to show when no data]
- **Loading:** [Loading indicator placement]
- **Populated:** [Normal state with data]
- **Error:** [Error state handling]
- **[Custom State]:** [Feature-specific states like "modified"]

**UX Pilot Prompt:**
```
Create a [screen type] for a CRM SaaS application.

PURPOSE:
[1-2 sentences about what this screen does]

LAYOUT:
- [Layout structure - e.g., "Full-width page with header, main content, and floating action button"]

HEADER:
- [Header elements - breadcrumbs, title, actions]

MAIN CONTENT:
- [Primary content elements with details]
- [Include specific components needed]

COMPONENTS NEEDED:
- [Component 1]: [description and data it shows]
- [Component 2]: [description and data it shows]

STATES TO SHOW:
- [Which state this mockup represents]

ACTIONS:
- [Buttons/links and what they do]

STYLE:
- Modern, clean SaaS aesthetic
- Professional color scheme
- Clear visual hierarchy
- [Any specific style notes]

DATA TO DISPLAY:
- [Sample data to use in the mockup]
```

---

### 4. Component Specifications

For reusable/complex components:

#### Component: [Component Name]

**Used In:** [List of screens using this component]

**Variants:**
| Variant | When Used | Visual Difference |
|---------|-----------|-------------------|
| Default | [condition] | [description] |
| Active | [condition] | [description] |
| Disabled | [condition] | [description] |

**Anatomy:**
- [Part 1]: [description]
- [Part 2]: [description]

**UX Pilot Prompt (Component):**
```
Create a [component type] component for a CRM SaaS.

PURPOSE: [What this component does]

VARIANTS:
1. Default state: [description]
2. Hover state: [description]
3. Active state: [description]
4. Disabled state: [description]

ANATOMY:
- [Element 1]: [position and purpose]
- [Element 2]: [position and purpose]

SIZING:
- Width: [fixed/fluid]
- Height: [dimensions or auto]
- Padding: [spacing]

INTERACTIONS:
- On click: [behavior]
- On hover: [behavior]
```

---

### 5. Interaction Specifications

| Trigger | Action | Result | Feedback |
|---------|--------|--------|----------|
| Click [element] | [action performed] | [UI change] | [toast/animation/redirect] |
| Type in [input] | [validation/search] | [result] | [visual feedback] |
| Hover [element] | [hover effect] | [UI change] | [tooltip/highlight] |

---

### 6. Empty States

For each screen with potential empty state:

| Screen | Empty State Message | CTA | UX Pilot Prompt |
|--------|---------------------|-----|-----------------|
| [Screen] | [Message text] | [Button text] | `Create an empty state card with message "[message]" and CTA button "[button text]"` |

---

### 7. Error States

| Error Type | Where Shown | Message Pattern | Recovery Action |
|------------|-------------|-----------------|-----------------|
| Validation | Inline on field | "[Field] is required" | Highlight field |
| API Error | Toast notification | "Failed to [action]. Try again." | Retry button |
| Not Found | Full screen | "[Entity] not found" | Back button |

---

### 8. Responsive Considerations

| Breakpoint | Layout Changes |
|------------|----------------|
| Desktop (>1024px) | [Full layout] |
| Tablet (768-1024px) | [Modifications] |
| Mobile (<768px) | [Mobile layout] |

---

## Rules

- Generate ONE UX Pilot prompt per screen (copy-paste ready)
- Include sample data in prompts so mockups look realistic
- Consider all states (empty, loading, error, success)
- Keep prompts specific enough to get useful output from UX Pilot
- Reference existing UI patterns from the app where applicable
```

---

## UX Pilot Prompt Tips

**For better results, include:**

1. **Context:** "for a CRM SaaS" or "for a B2B dashboard"
2. **Specifics:** Exact component names, data fields, button labels
3. **Sample Data:** Real-looking names, numbers, dates
4. **Style Hints:** "modern", "minimal", "professional"
5. **Layout Direction:** "sidebar on left", "actions top-right"

**Example UX Pilot Prompt:**

```
Create a filter preset dropdown for a CRM SaaS table page.

PURPOSE:
Allow users to quickly switch between saved filter combinations.

LAYOUT:
- Dropdown button in the table toolbar, aligned left
- Dropdown panel appears below, 280px wide

DROPDOWN BUTTON:
- Shows current preset name or "No Preset"
- Chevron icon on right
- When modified, shows "(modified)" suffix in muted text

DROPDOWN PANEL:
- Section 1: List of saved presets (max 5 visible, scrollable)
  - Each row: preset name, star icon if default, 3-dot menu
  - Default preset has filled star, others have outline star
- Divider
- Section 2: Actions
  - "+ Save Current Filters" with plus icon
  - "Manage Presets" with settings icon

SAMPLE DATA:
- "Hot Leads" (default - starred)
- "Q1 Pipeline"
- "California Contacts"
- "Needs Follow-up"

STATES:
- Default: "No Preset" selected
- Preset applied: Shows preset name
- Modified: Shows "Q1 Pipeline (modified)"

STYLE:
- Modern SaaS aesthetic
- Subtle shadows on dropdown
- Hover states on list items
- Primary color for default star
```
