
# 🛠️ Dashboard UI Refactor Prompt

## 🎯 Objective

The current frontend dashboard functions well but visually feels outdated — reminiscent of early 2010s web design. The goal is to **completely refactor** the UI using **Tailwind CSS (v3+) and DaisyUI**, creating a **modern, clean, responsive interface** with a consistent **light theme** across the entire application.

---

## 🎨 Design System & Theme

- Use **Tailwind CSS v3+** and **DaisyUI**
- Enforce light mode only:  
  ```html
  <html data-theme="light">
  ```
- Embrace a **modern, minimalist aesthetic**:
  - Clean, readable typography (prefer `font-sans`, moderate font weights)
  - Ample whitespace and spacing (`gap-*`, `space-y-*`)
  - Subtle shadows (`shadow-md`, `shadow-sm`) for depth
  - Rounded corners (`rounded-xl`) for a soft, friendly feel
  - Light backgrounds with gentle contrasts
- Use DaisyUI default styles where possible (`btn-primary`, `card-bordered`, `input-bordered`)

---

## 📐 Layout Guidelines

- **Persistent left sidebar**: clear navigation with icons + labels
- **Top navigation bar**:
  - App name/branding
  - Notification bell icon
  - User profile dropdown
- **Responsive-first design**:
  - Mobile-optimized first
  - Gracefully scale up for tablet and desktop views
- **Avoid visual clutter**:
  - Prioritize key actions
  - Use modals/dialogs for forms, confirmations, or expanded detail views

---

## 🧩 Component Guidelines

Use and customize the following DaisyUI components where appropriate:

- `card` for content containers and summaries
- `modal` for forms, confirmations, details
- `table` for structured data — must be responsive and readable
- `tabs` for grouped content or workflows
- `progress` for loading indicators, status
- `badge` for labels or statuses
- `alert` for messages and feedback

Additional tips:
- Add `hover`, `focus`, `disabled` states to all interactive elements
- Use [Lucide](https://lucide.dev/) or [Heroicons](https://heroicons.com/) for iconography
- Keep forms minimal — collapse advanced fields under expandable sections if needed

---

## ✅ Deliverables

- Refactor **all pages and components** using Tailwind + DaisyUI
- Ensure all views (create, update, view) are:
  - Clean and intuitive
  - Fully responsive
  - Accessible (basic keyboard + screen reader support)
- Apply consistent:
  - Spacing and layout
  - Font styles and sizes
  - Color palette and visual hierarchy

---

## 🚫 Avoid

- Legacy CSS or inline styles
- Visual clutter or excessive detail
- Overuse of dark colors or high-contrast elements — keep it soft, modern, and light
