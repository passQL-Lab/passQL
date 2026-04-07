Design a complete design system for "SQLD Master" — a Korean SQL certification study web application.

This is a responsive web app that runs in browsers and may later be packaged as an Electron desktop app. Design with both contexts in mind: it should feel native-quality in a browser AND work seamlessly as a standalone desktop window. No browser-specific chrome in the designs — treat the content area as the entire viewport.

Responsive breakpoints:

- Mobile: 360–480px (single column, bottom tab navigation)
- Tablet: 768px (single column with more breathing room)
- Desktop/Electron: 1024–1280px (centered content max-width 720px, navigation moves to left sidebar or top bar)

Show the design system components at desktop width (1280px) with a centered 720px content area.

Style: Clean minimalism with geometric accents. No gradients on backgrounds. No glassmorphism on content areas. Light theme.

Colors:

- Background: #FAFAFA (page), #FFFFFF (cards)
- Primary accent: Deep indigo #4F46E5 (buttons, active states, links)
- Accent light: #EEF2FF (badge backgrounds, hover tints)
- Accent medium: #818CF8 (heatmap mid-tone)
- Text: #111827 (primary), #6B7280 (secondary), #9CA3AF (caption)
- Semantic: Success #22C55E, Success light #F0FDF4, Error #EF4444, Error light #FEF2F2, Warning #F59E0B, Warning light #FEF3C7
- Code background: #F3F4F6
- Borders: #E5E7EB

Typography:

- UI font: "Pretendard" for ALL Korean and English UI text (headings, body, buttons, labels, navigation, descriptions)
- Code font: "JetBrains Mono" ONLY for SQL code blocks, schema DDL, execution results table values, errorCode display, and UUID strings
- Scale: 28px h1, 22px h2, 16px body, 14px secondary, 12px caption
- Code: 14px for code blocks
- Line height: 1.6 for body text, 1.5 for code blocks, 1.3 for headings

Components to define (show each in default, hover, active, disabled states):

1. Card — 12px radius, 1px border #E5E7EB, white background, 20px internal padding. No drop shadow.

2. Navigation:
   - Mobile: Fixed bottom tab bar, 56px height, 4 tabs (홈, 문제, 통계, 설정). Icon above label. Active = #4F46E5 fill + indigo text. Inactive = #9CA3AF icon + #6B7280 text.
   - Desktop/Electron: Left sidebar (56px collapsed icons only, 220px expanded with labels). Same 4 sections. Active = #EEF2FF background + #4F46E5 text.

3. Badge: Topic pill (e.g., "JOIN") — rounded-full, #EEF2FF background, #4F46E5 text, 12px font. Difficulty stars — geometric filled/unfilled star shapes.

4. Button:
   - Primary: #4F46E5 solid, white text, 8px radius, 44px height.
   - Secondary: White background, #4F46E5 border, #4F46E5 text.
   - Compact: "실행" button — 32px height, outlined #4F46E5, fits inline next to code blocks.
   - Disabled: #E5E7EB background, #9CA3AF text, no pointer.

5. Code block: JetBrains Mono 14px, #F3F4F6 background, 4px #4F46E5 left border, 16px padding, 8px radius.

6. Data table: Zebra striping (#FAFAFA alternate rows), 36px row height, JetBrains Mono for cell values, Pretendard bold for column headers. Horizontal scroll indicator when overflowing.

7. Error card: #FEF2F2 background, 4px left border #EF4444, ⚠ icon, errorCode in JetBrains Mono bold, errorMessage in Pretendard.

8. Success result card: #F0FDF4 background, 4px left border #22C55E, metadata text in #16A34A.

9. Toast: Fixed bottom center, 8px radius, #1F2937 background, white text, 3s auto-dismiss.

10. Bottom sheet / Dialog: rounded-t-2xl on mobile, centered modal with #111827/50% overlay on desktop. Drag handle bar (40px wide, 4px height, #D1D5DB) at top for mobile. Max-height 80vh.

11. Filter dropdown: Pill-shaped, rounded-full, 1px border #E5E7EB, 40px height, chevron icon. Selected state: #4F46E5 border + #EEF2FF background.

12. Radio button: 20px circle, #D1D5DB border default, #4F46E5 filled with inner white dot when selected.

Mood: Focused premium study tool. Calm, organized, confidence-building. Aesthetic between Notion's clarity and Linear's precision. NOT playful, NOT gamified. Content is king — SQL code and question text must be the most prominent elements.
