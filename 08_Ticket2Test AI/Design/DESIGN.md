# Design System Specification: The Logical Architect

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Logical Architect."** 

In the world of QA and development, clarity is paramount, but clarity does not have to be clinical or "out-of-the-box." This system moves away from the rigid, boxed-in layout of traditional enterprise tools and moves toward a high-end editorial experience. We achieve this through **intentional asymmetry**—offsetting data panels against generous white space—and **tonal depth**. 

Instead of a flat grid, we treat the interface as a spatial environment. We use overlapping surfaces and high-contrast typography to guide the eye through complex test logic. This is not just a tool; it is a high-performance environment for technical precision.

---

## 2. Colors & Surface Philosophy
The palette is rooted in deep slates and professional blues, designed to feel authoritative and integrated with the Jira ecosystem while maintaining a distinct, premium identity.

### The "No-Line" Rule
To achieve a signature look, designers are **prohibited from using 1px solid borders** to section off the UI. Separation of concerns must be achieved through:
- **Background Color Shifts:** Use `surface_container_low` against `surface` to define a sidebar.
- **Tonal Transitions:** A `surface_container` section sitting on a `surface_bright` base.

### Surface Hierarchy & Nesting
Think of the UI as physical layers of fine paper or frosted glass.
- **Base Level:** `surface` (#f9f9ff)
- **Nested Content:** Use `surface_container` (#e8edff) for the main workspace.
- **Elevated Logic:** Use `surface_container_highest` (#d7e2ff) for active test case drafting or code snippets.

### The "Glass & Gradient" Rule
Standard flat buttons are insufficient for a premium experience. 
- **CTAs:** Use a subtle linear gradient from `primary` (#003d9b) to `primary_container` (#0052cc) at a 135-degree angle. This adds "visual soul" and depth.
- **Floating Overlays:** Use `surface_container_lowest` (#ffffff) with a 70% opacity and a 12px `backdrop-filter: blur()`.

---

## 3. Typography: The Editorial Edge
We utilize **Inter** as our functional backbone, but we apply it with editorial intentionality.

- **Display Scales:** Use `display-md` (2.75rem) for high-level project stats. It should feel bold and unapologetic.
- **Data Headers:** `title-sm` (1rem) in `on_surface_variant` (#434654) should be used for metadata labels, providing a clear contrast against the data itself.
- **Technical Readouts:** Use `label-md` (0.75rem) for connection strings or Jira issue keys. The reduced size conveys a "developer-focused" density without sacrificing legibility.
- **Hierarchy through Weight:** Use `Medium` (500) for interactive elements and `Regular` (400) for descriptive text. Avoid `Bold` (700) except for high-level Headlines.

---

## 4. Elevation & Depth
Depth is conveyed through **Tonal Layering**, not structural lines.

- **The Layering Principle:** Place a `surface_container_lowest` card on a `surface_container_low` section. This creates a soft, natural "lift" that mimics ambient light.
- **Ambient Shadows:** For floating elements like modals or dropdowns, use a shadow with a 24px blur and 4% opacity. The shadow color must be a tinted version of `on_surface` (#041b3c), never pure black.
- **The "Ghost Border" Fallback:** If a border is required for accessibility in input fields, use the `outline_variant` (#c3c6d6) at 20% opacity. 100% opaque borders are forbidden.

---

## 5. Components & Interaction Patterns

### Connection Status Indicators
Avoid simple dots. Use a **Status Pill**:
- **Connected:** `secondary_container` background with `on_secondary_container` text. Apply a subtle pulse animation to the background color.
- **Disconnected/Error:** `error_container` with a `Ghost Border` of `error`.

### Masked Inputs (API Keys/Tokens)
- **Resting:** Use `surface_container_highest`. Text should be represented by `on_surface_variant` glyphs (•).
- **Focus State:** Transition the background to `surface_container_lowest` and apply a `primary` ghost border (20% opacity).

### Loading States
Do not use spinning wheels. Use **Linear Shimmers**:
- Apply a gradient shimmer moving across `surface_container_highest`. The motion should be slow and ease-in-out to maintain a "calm" atmosphere.

### Information Cards
- **Rule:** No divider lines.
- **Separation:** Use vertical white space (1.5rem to 2rem) and `title-sm` headers to separate data chunks. 
- **Interactivity:** On hover, the card should shift from `surface_container_low` to `surface_container_highest` with a 200ms transition.

### Buttons
- **Primary:** `primary` gradient, `on_primary` text, `md` (0.375rem) corner radius.
- **Secondary:** Transparent background, `primary` text, and a `Ghost Border` that only appears on hover.

---

## 6. Do's and Don'ts

### Do
- **Do** embrace negative space. If a screen feels "empty," it likely means the data is breathing.
- **Do** use `tertiary` (#7b2600) for "destructive but necessary" actions, like deleting a test run, to provide a sophisticated warning tone.
- **Do** align technical data (like timestamps) to the right to create a clean vertical axis against left-aligned titles.

### Don't
- **Don't** use 100% opaque lines to separate list items. Use a 12px gap instead.
- **Don't** use standard "Jira Blue" for everything. Reserve our `primary` blue for intentional actions and `secondary` for supportive branding.
- **Don't** use `xl` corner radii (0.75rem) for everything. Keep it to `md` (0.375rem) for a sharper, more professional "developer" feel. Use `full` only for status tags.