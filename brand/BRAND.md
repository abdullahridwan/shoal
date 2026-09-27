# Shoal brand kit

![Brand sheet](brand-sheet.png)

## Idea

A shoal is a group of fish moving together. Shoal keeps many coding agents moving together in one calm window, and quietly tells you which one needs you. The brand should feel like a well-made instrument: warm, quiet, precise, and confident enough not to shout.

## Color

One accent. Everything else is warm neutrals.

| Name | Hex | Use |
|---|---|---|
| Stone | `#F3F1EC` | App background (light) |
| Paper | `#FBFAF7` | Surfaces, terminal (light) |
| Ink | `#1B1A17` | Text, marks |
| Ink 2 | `#6B675F` | Secondary text |
| Ink 3 | `#A39F95` | Hints, metadata |
| Clay | `#C96442` | The accent: needs-you state, emphasis, cursor |
| Sage | `#3F9B6A` | Working state only |
| Gold | `#DEBE82` | Aurora gradient only |
| Night | `#131312` | App background (dark) |
| Ember | `#1C1B19` | Surfaces (dark) |
| Bone | `#EFECE4` | Text (dark) |
| Clay, dark | `#D97757` | Accent (dark) |

Rules: clay is used sparingly, never as a large fill behind text in the UI. Sage and gold exist only to signal "working" and in the aurora. No pure black or pure white.

## Type

| Role | Typeface | Notes |
|---|---|---|
| Display, wordmark | Instrument Serif | Tight tracking (-0.02 to -0.035em). Italic in clay for the emphasized half of a headline. |
| Interface | Inter | Weight 400 and 500 only. Sentence case. |
| Terminal, paths, data | JetBrains Mono (SF Mono in the app's terminal) | |

All three are open source (OFL).

## Signature elements

- **Aurora**: soft, heavily blurred gold, sage and clay light that drifts across the top of the panel while an agent works, and breathes clay when one needs you.
- **Blur crossfade**: things arrive and leave through a slight blur, never a hard cut or a bounce.
- **Status dots**: a sage dot with a slow spinning ring (working), a clay dot with a soft ping (needs you), a hollow ring (exited).
- **Motion easing**: `cubic-bezier(0.22, 1, 0.36, 1)`. Calm ease-out, no overshoot.

## Voice

Calm, plain and specific. Say what it does. Sentence case, no exclamation marks, no hype words ("seamless", "unlock", "supercharge").

Lines in use:
- All your agents, in one window.
- Know which one needs you.
- Every coding agent, one calm window.

## Logo brief

The current bar-shaped mark is a placeholder. What a new mark should do:

- **Work at 16px** (favicon, dock at small sizes) and at 1024px (app icon).
- **One idea, not a picture.** Candidate ideas: many-as-one (several small forms reading as a single shape), a quiet nod to a terminal prompt or cursor, or a pure typographic "S" in Instrument Serif italic.
- **Two colors at most**: Ink or Bone plus Clay. The clay should mark one small, meaningful part (the lead, the cursor, the one that needs you).
- **App icon**: macOS squircle on Ink (`#1B1A17`) or Stone (`#F3F1EC`), optionally with a faint clay glow. No gradients on the mark itself.
- **Avoid**: literal fish, waves, robots, sparkles, chat bubbles, anything that reads as childish or playful.
- **Wordmark**: "Shoal" set in Instrument Serif, regular, tight tracking. The mark sits to its left at cap height.
