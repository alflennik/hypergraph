# Hyper Visual — Project Summary

> **Last updated:** 2026-03-27

> **Living document.** This file should be reviewed and updated (if necessary)
> by the AI agent after every use of the **context-loading-strategy** skill.
> Only update when the codebase has changed in ways that make this summary
> inaccurate or incomplete — new files, removed files, renamed modules,
> changed architecture, new dependencies, resolved issues, etc.
> When updating, also bump the "Last updated" date above.

## Project Overview

A browser-based interactive drawing canvas for line segments. Users drag to
draw lines, click (without dragging) to select the nearest line within a pixel
threshold, and press Delete/Backspace to remove the selected line. Selected
lines render in red with a thicker stroke.

- **Tech stack:** Plain HTML5, CSS, and vanilla JavaScript (no frameworks,
  no bundler, no npm dependencies).
- **How to run:** Open `visualPlane.html` in any web browser. No build step.

## Directory Structure

Flat layout — four files at the project root, no subdirectories (other than
`docs/`).

| File | Purpose |
|------|---------|
| `visualPlane.html` | Page shell. Loads CSS and JS, defines the 500x500 canvas (`#plane-1`) and heading. |
| `visualPlane.css` | Styles the canvas border/centering and the centered `#header` heading. |
| `visualPlane.js` | All application logic: state management, drawing, hit-testing, keyboard handling. (174 lines) |
| `README.md` | Single-line title only (`# HYPER GRAPH`). |
| `docs/PROJECT_SUMMARY.md` | This file. |

## Architecture & Data Flow

- **Entry point:** `visualPlane.html` loads the CSS for styling and the JS
  script at the end of `<body>` so the DOM is ready.
- **State:** An in-memory `lines` array stores all drawn segments as
  `{ x1, y1, x2, y2 }` objects. `selectedLineIndex` tracks which line (if
  any) is selected. No persistence, no network calls.
- **Flow:**
  1. `mousedown` — stores the start coordinates, sets `isDrawing = true`.
  2. `mousemove` — while drawing, redraws all lines plus a live preview
     of the in-progress segment.
  3. `mouseup` — if the user dragged, commits the new line to `lines`.
     If the user clicked without dragging, runs hit-test to select/deselect
     the nearest line (within 8px threshold).
  4. `keydown` — Delete/Backspace removes the selected line from `lines`.
  5. `redrawCanvas()` — clears the canvas and redraws all lines from `lines`,
     highlighting the selected line in red with thicker stroke.

## Key Functions (visualPlane.js)

| Function | Description |
|----------|-------------|
| `redrawCanvas()` | Clears canvas, redraws all segments, applies red/thick style to selected line. |
| `distanceToLine(px, py, x1, y1, x2, y2)` | Computes shortest distance from a point to a line segment (clamped projection). Handles degenerate zero-length segments. |
| Anonymous event handlers | `mousedown`, `mousemove`, `mouseup` on canvas; `keydown` on `document`. |

## Key Patterns & Conventions

- **Naming:** `camelCase` for variables and functions; DOM id `plane-1`
  (kebab-case).
- **Error handling:** Single `alert` if canvas context is unavailable.
  No try/catch elsewhere.
- **Configuration:** Magic numbers inline (500x500 canvas, 8px click
  threshold, stroke widths 1 and 3). No central config object.

## Known Issues & Potential Improvements

- `ctx` is initialized as an empty string (`""`) before being reassigned —
  misleading typing.
- Global `keydown` listener for Backspace may conflict with browser
  navigation when canvas is not focused.
- Very small mouse jitter during a "click" can set `hasDragged = true` and
  draw an unintended short line (no movement threshold).
- README title ("HYPER GRAPH") does not match the current "Visualization
  Plane" behavior.
- **Possible extensions:** Undo/redo, localStorage persistence, PNG/SVG
  export, pan/zoom, variable line styles, touch support.
