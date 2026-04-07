# Design System Document: The Precision Study Environment

This design system is a bespoke framework crafted for a high-end SQL certification experience. It moves beyond the "standard SaaS" aesthetic to deliver an editorial, focused environment that balances the utilitarian logic of **Linear** with the flexible canvas of **Notion**.

The goal is to transform the rigorous process of SQL mastery into a premium, confidence-building journey through intentional whitespace, tonal layering, and geometric precision.

---

## 1. Creative North Star: "The Logical Curator"

The system is built on the concept of **The Logical Curator**. SQL is about structure, relationships, and clarity; the UI must reflect this.

- **Intentional Asymmetry:** We break the rigid center-aligned grid. Use wide left margins for typography and compact right-aligned action zones to create an editorial feel.
- **Content is King:** Every element—from the code block to the difficulty badge—is designed to recede until interacted with, ensuring the SQL queries and database schemas remain the primary focal point.
- **Sophisticated Utility:** We use premium details—like indigo accents and monospaced data cells—to make the tool feel like a professional IDE rather than a generic quiz app.

---

## 2. Color & Tonal Architecture

We prioritize a "Light Mode Only" experience that mimics high-quality stationery.

### The "No-Line" Rule

Traditional 1px borders are often visual noise. In this system, boundaries are primarily defined by **Background Color Shifts**. Use `surface-container-low` (#f3f3f3) sections against a `surface` (#f9f9f9) background to denote hierarchy. Only use borders for specific code-related containers where structural definition is required for readability.

### Surface Hierarchy & Nesting

Instead of a flat plane, treat the UI as stacked sheets of fine paper:

- **Base Layer:** `surface` (#f9f9f9) – The page foundation.
- **Mid Layer:** `surface-container-lowest` (#ffffff) – Used for primary cards and content areas.
- **Top Layer:** `surface-container-high` (#e8e8e8) – Used for active states, hover effects, or nested utility panels.

### Signature Textures

- **The Indigo Pulse:** For primary CTAs and progress indicators, use a subtle gradient from `primary` (#3525cd) to `primary-container` (#4f46e5). This adds "soul" and depth to an otherwise flat layout.
- **Glassmorphism:** Use `surface-container-lowest` with a 80% opacity and `backdrop-blur: 12px` for mobile bottom sheets and desktop sidebar transitions to maintain a sense of spatial awareness.

---

## 3. Typography: Editorial Authority

We utilize **Pretendard** for its exceptional readability in Korean/English mixed environments and **JetBrains Mono** for technical precision.

| Role            | Font           | Size     | Weight | Tracking | Usage                            |
| :-------------- | :------------- | :------- | :----- | :------- | :------------------------------- |
| **Display-MD**  | Manrope        | 2.75rem  | 700    | -0.02em  | Hero headers, score summaries    |
| **Headline-SM** | Manrope        | 1.5rem   | 600    | -0.01em  | Question titles, section headers |
| **Title-MD**    | Pretendard     | 1.125rem | 600    | 0        | Sub-headers, card titles         |
| **Body-LG**     | Pretendard     | 1rem     | 400    | 0        | Main question text, descriptions |
| **Label-MD**    | Pretendard     | 0.75rem  | 500    | +0.02em  | Captions, secondary UI labels    |
| **Code-SM**     | JetBrains Mono | 0.875rem | 400    | 0        | SQL Queries, Table data          |

---

## 4. Elevation & Depth: Tonal Layering

We eschew traditional shadows in favor of **Tonal Lift**.

- **The Layering Principle:** Place a `#FFFFFF` card on a `#F9F9F9` background. The subtle 4% difference in luminosity creates a clean, sophisticated lift.
- **Ambient Shadows:** Only for floating elements (Toasts, Modals). Use a highly diffused shadow: `0 12px 40px rgba(17, 24, 39, 0.06)`. The tint is derived from the `on-surface` color, not pure black.
- **The Ghost Border:** For code blocks and inputs, use the `outline-variant` token at 15% opacity. It provides a "hint" of a container without breaking the minimalism.

---

## 5. Components

### Buttons & Interaction

- **Primary:** 44px height, Indigo solid (#4F46E5). Use a slight horizontal inner-glow (1px white top border at 10% opacity) for a premium tactile feel.
- **Compact ("실행"):** 32px height, `surface-container-highest` background with `on-surface` text. Monospaced font for the label to signify "Command execution."
- **Pill Filters:** Fully rounded (999px), `surface-container-low` background. On selection, transition to `primary` with white text.

### SQL-Specific Components

- **Code Block:** Background `#F3F4F6`, 4px solid `primary` (#4F46E5) left border. Use `JetBrains Mono` with a 1.6 line-height for maximum legibility. No shadows.
- **Data Table:** Zebra striping using `surface-container-low` (#f3f3f3). Row height 36px. Cells must use monospaced fonts to ensure vertical alignment of numerical data. Forbid vertical divider lines; use whitespace to separate columns.
- **Difficulty Stars:** Instead of organic stars, use geometric polygons (rhombus or squares) in `primary` to maintain the "SQL/Logic" aesthetic.

### Feedback & Notifications

- **Semantic Cards:** 4px left border (Success #22C55E / Error #EF4444). Use `surface-container-lowest` (#FFFFFF) for the card body to ensure the semantic color "pops" against the background.
- **Toasts:** Positioned bottom-center. Dark gray `#1F2937` with `backdrop-blur`. This high-contrast element signals a break from the light-themed study flow.

---

## 6. Do's and Don'ts

### Do

- **Do** use `body-lg` (16px) for the main question text to reduce eye strain.
- **Do** allow for generous margins (32px+) between content modules.
- **Do** use monospaced numbers for all "Statistics" and "Progress" views.
- **Do** nest a `#FFFFFF` card inside a `#FAFAFA` section for a premium "Paper-on-Desk" effect.

### Don't

- **Don't** use 100% black text. Use `primary-text` (#111827) for a softer, more intentional feel.
- **Don't** use standard 1px `#CCCCCC` borders. Use background tonal shifts or "Ghost Borders" (15% opacity) only.
- **Don't** use drop shadows on cards. Let the background color define the container.
- **Don't** use rounded corners smaller than 8px for main containers; keep the "soft-geometric" vibe consistent. 12px is the system standard.
