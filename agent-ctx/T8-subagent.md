# T8 — Redesign ClientChat.tsx (A.6 spec)

## Task
Redesign ClientChat.tsx as an inline bottom sheet per A.6 CHAT CLIENTE-REPARTIDOR spec.

## Changes Made
- **File**: `/home/z/my-project/src/components/client/ClientChat.tsx` — complete visual redesign

## Key Design Decisions

### Layout
- Full-screen bottom sheet overlay with `fixed inset-0 z-50` and slide-up spring animation (`damping: 30, stiffness: 320`)
- Top corners rounded with `var(--lf-sheet-radius)` (28px)
- Backdrop uses `bg-black/50 backdrop-blur-sm`

### Header (Glassmorphism)
- Uses `var(--lf-glass-bg)`, `var(--lf-glass-border)`, `var(--lf-glass-blur)` for frosted glass effect
- Avatar: 36x36 (`w-9 h-9`) with driver initials
- Driver name: Syne font (`font-family: 'Syne', sans-serif`)
- Green dot (7px) + "En línea" text
- Phone button + Close button (36x36 each)

### Message Bubbles
- **Repartidor (left)**: `var(--bg-alt)`, border-radius `20px 20px 20px 4px`
- **Cliente (right)**: `var(--primario)`, white text, border-radius `20px 20px 4px 20px`
- **System**: centered 12px muted pill with `var(--bg-alt)` background
- **Timestamps**: centered 11px, JetBrains Mono font
- Animation: slideUp + fadeIn (`opacity: 0→1, y: 16→0`)

### Typing Indicator
- 3 dots bouncing sequentially with `motion.span` + staggered delay (0, 0.18s, 0.36s)
- Uses Framer Motion `animate={{ y: [0, -5, 0] }}` with infinite repeat

### Quick Reply Chips
- Horizontal scroll above input, `scrollbarWidth: 'none'`
- Haptic feedback via `navigator.vibrate(10)` on tap
- Rounded pill style with `var(--border)` outline

### Input Area
- Glassmorphism bottom bar matching header style
- Auto-resize textarea with `max-height: 96px`
- Circular send button (44px) with `var(--primario)` when active, `shadow-primario` glow
- `whileTap={{ scale: 0.9 }}` for tactile feedback
- Safe area bottom padding: `var(--lf-safe-bottom)`

### Preserved Logic
- All store connections (useStore: chatOpen, chatOrderId, chatConversations, sendChatMessage, setChatOpen)
- Deactivation timer logic (30min warning, 60min total)
- Auto-reply simulation (2-3s delay, random replies)
- Read indicators (CheckCheck/Check icons)
- Keyboard handler (Enter to send, Shift+Enter for newline)

## Lint Result
Zero errors (only pre-existing warning in layout.tsx about custom fonts)
