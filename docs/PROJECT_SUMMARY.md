# Hyper Visual — Project Summary

> **Last updated:** 2026-03-27 (v2 — updated node/line model, functions, data flow)

> **Living document.** This file should be reviewed and updated (if necessary)
> by the AI agent after every use of the **context-loading-strategy** skill.
> Only update when the codebase has changed in ways that make this summary
> inaccurate or incomplete — new files, removed files, renamed modules,
> changed architecture, new dependencies, resolved issues, etc.
> When updating, also bump the "Last updated" date above.

## Project Overview

A browser-based interactive "visualization plane" for drawing line segments on
an infinite 2D canvas with pan and zoom. Lines snap to nodes — reusable graph
vertices that appear when endpoints land near each other. A permanent green
"Nexus" node sits at the origin. Users drag to draw, click to select the
nearest line, and press Delete/Backspace to remove the selected line. Selected
lines render in red with a thicker stroke.

- **Tech stack:** Plain HTML5, CSS, and vanilla JavaScript (no frameworks,
  no bundler, no npm dependencies).
- **How to run:** Open `visualPlane.html` in any web browser. No build step.

## Directory Structure

Flat layout — code files at the project root, documentation in `docs/`.

| File | Purpose |
|------|---------|
| `visualPlane.html` | Page shell. Loads CSS and JS, defines the canvas (`#plane-1`, `tabindex="0"`), heading, and zoom toolbar inside `#canvas-wrapper`. |
| `visualPlane.css` | Responsive layout (85vw x 85vh canvas wrapper), zoom toolbar styles, canvas styling. |
| `visualPlane.js` | All application logic: camera/pan/zoom, node/line graph model, Nexus, snapping, drawing, hit-testing, orphan cleanup, keyboard handling. (~640 lines, wrapped in an IIFE.) |
| `README.md` | Single-line title — "Visualization Plane for Hyper Graph". |
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
- **State:** Two in-memory arrays form a graph model:
  - `nodes[]` — `{ x, y }` positions in world space. `nodes[0]` is the
    permanent green "Nexus" at the origin (`NEXUS_INDEX = 0`).
  - `lines[]` — `{ startNode, endNode, startX, startY }` where `endNode`
    is always a node index. `startNode` can be `-1` if the start is in
    free space (with raw coords in `startX`/`startY`).
  - `selectedLineIndex` tracks which line (if any) is selected.
  - No persistence, no network calls.
- **Flow:**
  1. `mousedown` — stores start coordinates. Snaps the start to the nearest
     node via `findNearestNode()`. Shift+click or middle-click starts panning.
  2. `mousemove` — while drawing, if movement exceeds `CONFIG.dragThreshold`
     (15px screen), sets `hasDragged = true`, redraws plus a live preview.
     While panning, adjusts `camera.panX`/`panY`.
  3. `mouseup` — if dragged, `getOrCreateNode()` finds or creates the end
     node, self-loop prevention blocks same-node connections, then pushes
     a new line. If clicked without dragging, runs hit-test to
     select/deselect the nearest line (within `CONFIG.clickThreshold` — 8px).
  4. `wheel` — zooms at cursor via `zoomAtPoint()`.
  5. `keydown` (scoped to canvas) — Delete/Backspace splices the selected
     line and calls `removeOrphanedNodes()` to clean up unused non-Nexus nodes.
  6. `redrawCanvas()` — clears canvas, applies camera transform via
     `ctx.setTransform()`, draws all segments and nodes. Nexus drawn last
     (on top). Line widths divided by zoom for consistent screen thickness.
  7. `resizeCanvas()` — syncs canvas drawing buffer to CSS layout size.
     Called on load and on window resize.

## Key Functions (visualPlane.js)

| Function | Description |
|----------|-------------|
| `resizeCanvas()` | Syncs canvas buffer size to CSS layout size. Called on load and window resize. |
| `screenToWorld(sx, sy)` | Converts screen-space coordinates to world-space using the current camera. |
| `worldToScreen(wx, wy)` | Converts world-space coordinates to screen-space using the current camera. |
| `zoomAtPoint(newZoom, sx, sy)` | Applies zoom while keeping the world point under (sx, sy) fixed on screen. |
| `updateZoomDisplay()` | Updates the zoom percentage label in the toolbar. |
| `centerOnNexus()` | Resets camera pan/zoom so the Nexus node is centered on screen. |
| `findNearestNode(wx, wy)` | Returns the index of the nearest node within snap radius, or `-1`. |
| `getOrCreateNode(wx, wy)` | Returns an existing node index if within snap radius, or creates a new one. |
| `isNodeUsed(index)` | Checks whether any line references the given node index. |
| `removeOrphanedNodes()` | Removes unused non-Nexus nodes and remaps line references. |
| `redrawCanvas()` | Clears canvas, applies camera transform, redraws all segments and nodes (Nexus on top). |
| `distanceToLine(px, py, ...)` | Shortest distance from a point to a line segment (world space). |
| `getCanvasPos(event)` | Returns screen-space mouse position relative to the canvas. |
| Event handlers | `mousedown`, `mousemove`, `mouseup`, `wheel`, `keydown` on canvas; `click` on zoom/recenter buttons. |

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
  `nodes`/`lines` arrays live only in memory. Refreshing the page clears
  all drawings. Suggested fix: localStorage or file export/import.
- **Doc drift:** `docs/fixed-issues.md` still says `dragThreshold` is 3px;
  the current code uses `CONFIG.dragThreshold = 15`.

## Possible Extensions

- Undo/redo
- localStorage persistence
- PNG/SVG export
- Variable line styles
- Touch/pointer event support
