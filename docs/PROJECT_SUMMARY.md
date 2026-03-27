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

Flat layout — code files at the project root, documentation in `docs/`.

| File | Purpose |
|------|---------|
| `visualPlane.html` | Page shell. Loads CSS and JS, defines the 500x500 canvas (`#plane-1`, `tabindex="0"`) and heading. |
| `visualPlane.css` | Styles the canvas border/centering and the centered `#header` heading. |
| `visualPlane.js` | All application logic: state management, drawing, hit-testing, keyboard handling. (~219 lines, wrapped in an IIFE.) |
| `README.md` | Single-line title (contains typos — "Visualizartion Plane for Hyper Grapsh"). |
| `.gitignore` | Ignores `issues.txt` and `fixed-issues.md` from version control. |
| `docs/PROJECT_SUMMARY.md` | This file. |
| `docs/issues.txt` | Tracks open and fixed issues with severity buckets. |
| `docs/fixed-issues.md` | Narrative changelog describing past fixes in detail. |

## Architecture & Data Flow

- **Entry point:** `visualPlane.html` loads the CSS in `<head>` and the JS
  script at the end of `<body>` so the DOM is ready.
- **State:** An in-memory `lines` array stores all drawn segments as
  `{ x1, y1, x2, y2 }` objects. `selectedLineIndex` tracks which line (if
  any) is selected. No persistence, no network calls.
- **Flow:**
  1. `mousedown` — stores the start coordinates, sets `isDrawing = true`.
  2. `mousemove` — while drawing, if movement exceeds `CONFIG.dragThreshold`
     (15px), sets `hasDragged = true`, redraws all lines plus a live preview
     of the in-progress segment.
  3. `mouseup` — if the user dragged, commits the new line to `lines`.
     If the user clicked without dragging, runs hit-test to select/deselect
     the nearest line (within `CONFIG.clickThreshold` — 8px).
  4. `keydown` (scoped to canvas) — Delete/Backspace removes the selected
     line from `lines` via splice. `preventDefault` stops Backspace from
     triggering browser navigation.
  5. `redrawCanvas()` — clears the canvas and redraws all lines from `lines`,
     highlighting the selected line in red with thicker stroke.

## Key Functions (visualPlane.js)

| Function | Description |
|----------|-------------|
| `redrawCanvas()` | Clears canvas, redraws all segments, applies selected style (red, thick) to the selected line. |
| `distanceToLine(px, py, x1, y1, x2, y2)` | Computes shortest distance from a point to a line segment (clamped projection). Handles degenerate zero-length segments. |
| Anonymous event handlers | `mousedown`, `mousemove`, `mouseup` on canvas; `keydown` on canvas (not document). |

## Key Patterns & Conventions

- **IIFE wrapper:** The entire script runs inside an IIFE. If `getContext`
  fails, the script alerts and returns early — no listeners are registered.
- **CONFIG object:** A top-level `CONFIG` object centralizes colors
  (`defaultStrokeColor`, `selectedStrokeColor`, `previewStrokeColor`),
  stroke widths (`defaultLineWidth`, `selectedLineWidth`), and thresholds
  (`clickThreshold: 8`, `dragThreshold: 15`). Canvas size (500x500) is still
  set in HTML attributes, not in CONFIG.
- **Naming:** `camelCase` for JS variables/functions; DOM id `plane-1`
  (kebab-case); `CONFIG` in SCREAMING_SNAKE for the object name, camelCase
  for its keys.
- **Error handling:** Single `alert` if canvas context is unavailable.
  No try/catch elsewhere.
- **Focus management:** Canvas has `tabindex="0"` and is focused on
  mousedown so keyboard events are received without a separate click.

## Known Issues

- **1 open Low issue (from `docs/issues.txt`):** No persistence — the
  `lines` array lives only in memory. Refreshing the page clears all
  drawings. Suggested fix: localStorage or file export/import.
- **Doc drift:** `docs/fixed-issues.md` still says `dragThreshold` is 3px;
  the current code uses 15px. `README.md` has typos that don't match the
  HTML page title.

## Possible Extensions

- Undo/redo
- localStorage persistence
- PNG/SVG export
- Pan/zoom
- Variable line styles
- Touch/pointer event support
- Responsive canvas sizing
