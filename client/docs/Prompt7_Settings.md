Design the Settings screen of "SQLD Master" SQL study web app.

Responsive web app (future Electron). Show desktop (1280px, centered 720px) AND mobile (375px) side by side.

Design system: Pretendard, JetBrains Mono for UUID, minimalist, #4F46E5 accent.

Desktop: Left sidebar (설정 active). Mobile: Bottom tab bar (설정 active).

Intentionally the simplest screen. MVP settings only.

Content — Single white card (12px radius, 1px #E5E7EB border), vertical list of rows:

1. "디바이스 ID" row (16px vertical padding):
   - Label: "디바이스 ID" Pretendard 14px #6B7280
   - Value: "a1b2c3d4-e5f6-7890-abcd-ef1234567890" JetBrains Mono 13px #111827, truncated (first 20 chars + "...")
   - Right: Copy icon button (clipboard icon, 32px square, #9CA3AF, hover #4F46E5)
   - Bottom: 1px #E5E7EB divider

2. "닉네임" row (16px vertical padding):
   - Label: "닉네임" Pretendard 14px #6B7280
   - Value: "용감한 판다" Pretendard 16px bold #111827
   - Right: Refresh icon button (↻, 32px square, #9CA3AF, hover #4F46E5)
   - Bottom: 1px #E5E7EB divider

3. "버전" row (16px vertical padding):
   - Label: "버전" Pretendard 14px #6B7280
   - Value: "1.0.0-MVP" Pretendard 14px #9CA3AF
   - No action button, no divider

Below the card (32px top margin, centered):

- "SQLD Master" Pretendard 13px #D1D5DB
- "Powered by Vite + React" Pretendard 12px #D1D5DB

Ultra-minimal. The restraint IS the design. Korean text throughout.
