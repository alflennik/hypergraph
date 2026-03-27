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
lines render in red with a thicker stroke. The canvas is pannable and zoomable.

- **Tech stack:** Plain HTML5, CSS, and vanilla JavaScript (no frameworks,
  no bundler, no npm dependencies).
- **How to run:** Open `visualPlane.html` in any web browser. No build step.

## Directory Structure

Flat layout — code files at the project root, documentation in `docs/`.

| File | Purpose |
|------|---------|
| `visualPlane.html` | Page shell. Loads CSS and JS, defines the canvas (`#plane-1`, `tabindex="0"`), heading, and zoom toolbar inside `#canvas-wrapper`. |
| `visualPlane.css` | Responsive layout (85vw x 85vh canvas wrapper), zoom toolbar styles, canvas styling. |
| `visualPlane.js` | All application logic: camera/pan/zoom system, state management, drawing, hit-testing, keyboard handling. (~300 lines, wrapped in an IIFE.) |
| `README.md` | Single-line title (contains typos — "Visualizartion Plane for Hyper Grapsh"). |
| `.gitignore` | Ignores `issues.txt` and `fixed-issues.md` from version control. |
| `docs/PROJECT_SUMMARY.md` | This file. |
| `docs/issues.txt` | Tracks open and fixed issues with severity buckets. |
| `docs/fixed-issues.md` | Narrative changelog describing past fixes in detail. |

## Architecture & Data Flow

- **Entry point:** `visualPlane.html` loads the CSS in `<head>` and the JS
  script at the end of `<body>` so the DOM is ready.
- **Camera system:** A `camera` object holds `panX`, `panY` (world-unit
  offsets) and `zoom` (multiplier). `screenToWorld()` and `worldToScreen()`
  convert between coordinate spaces. All line data is stored in world space.
- **State:** An in-memory `lines` array stores all drawn segments as
  `{ x1, y1, x2, y2 }` objects in world coordinates. `selectedLineIndex`
  tracks which line (if any) is selected. No persistence, no network calls.
- **Flow:**
  1. `mousedown` — stores start coordinates in both screen and world space.
     Shift+click or middle-click starts panning instead of drawing.
  2. `mousemove` — while drawing, if movement exceeds `CONFIG.dragThreshold`
     (15px screen), sets `hasDragged = true`, redraws all lines plus a live
     preview. While panning, adjusts `camera.panX`/`panY`.
  3. `mouseup` — if the user dragged, commits the new line to `lines` in
     world coordinates. If clicked without dragging, runs hit-test to
     select/deselect the nearest line (within `CONFIG.clickThreshold` — 8px,
     adjusted for zoom level).
  4. `wheel` — zooms in/out at the mouse cursor position using
     `zoomAtPoint()`, which adjusts pan so the world point under the cursor
     stays fixed on screen.
  5. `keydown` (scoped to canvas) — Delete/Backspace removes the selected
     line from `lines` via splice.
  6. `redrawCanvas()` — clears the canvas, applies the camera transform via
     `ctx.setTransform()`, and redraws all lines. Line widths are divided by
     zoom so strokes appear consistent on screen.
  7. `resizeCanvas()` — syncs the canvas drawing buffer to its CSS layout
     size. Called on load and on window resize.

## Key Functions (visualPlane.js)

| Function | Description |
|----------|-------------|
| `resizeCanvas()` | Syncs canvas buffer size to CSS layout size. Called on load and window resize. |
| `screenToWorld(sx, sy)` | Converts screen-space coordinates to world-space using the current camera. |
| `worldToScreen(wx, wy)` | Converts world-space coordinates to screen-space using the current camera. |
| `zoomAtPoint(newZoom, sx, sy)` | Applies zoom while keeping the world point under (sx, sy) fixed on screen. |
| `updateZoomDisplay()` | Updates the zoom percentage label in the toolbar. |
| `redrawCanvas()` | Clears canvas, applies camera transform, redraws all segments with selection highlighting. |
| `distanceToLine(px, py, ...)` | Shortest distance from a point to a line segment (world space). |
| `getCanvasPos(event)` | Returns screen-space mouse position relative to the canvas. |
| Event handlers | `mousedown`, `mousemove`, `mouseup`, `wheel`, `keydown` on canvas; `click` on zoom buttons. |

## Key Patterns & Conventions

- **IIFE wrapper:** The entire script runs inside an IIFE. If `getContext`
  fails, the script alerts and returns early — no listeners are registered.
- **Camera/viewport pattern:** All line data stored in world space. Camera
  transform applied during rendering. Screen-to-world conversion for input.
- **CONFIG object:** Centralizes colors, stroke widths, thresholds, and
  zoom settings (`minZoom`, `maxZoom`, `zoomStep`, `wheelZoomStep`).
- **Responsive canvas:** Sized via CSS (85vw x 85vh wrapper with flexbox).
  Canvas buffer resized to match on load and window resize.
- **Naming:** `camelCase` for JS variables/functions; DOM ids in kebab-case;
  `CONFIG` in SCREAMING_SNAKE for the object name.
- **Error handling:** Single `alert` if canvas context is unavailable.
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
- Variable line styles
- Touch/pointer event support
