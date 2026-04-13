# Hyper Visual — Project Summary

> **Last updated:** 2026-04-07 (v5 — line count ~688 for `visualizationPlane.js`; removed stale `isNodeUsed` row; documented subtree drag via `collectSubtreeNodes` / `dragSubtreeNodeIndices`; noted `lastDragPlaneX`/`lastDragPlaneY` vs `lastDragPointPlane*` naming bug)

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
nearest edge, and press Delete/Backspace to remove the selected edge. Selected
edges render in red with a thicker stroke.

- **Tech stack:** Plain HTML5, CSS, and vanilla JavaScript (no frameworks,
  no bundler, no npm dependencies).
- **How to run:** Open `visualizationPlane.html` in any web browser. No build step.

## Directory Structure

Flat layout — code files at the project root, documentation in `docs/`.

| File | Purpose |
|------|---------|
| `visualizationPlane.html` | Page shell. Loads CSS and JS, defines the canvas (`#plane-1`, `tabindex="0"`), heading, and zoom toolbar inside `#canvas-wrapper`. |
| `visualizationPlane.css` | Responsive layout (85vw x 85vh canvas wrapper), zoom toolbar styles, canvas styling (~80 lines). |
| `visualizationPlane.js` | All application logic: view/pan/zoom, node/edge graph model, Nexus, snapping, drawing, hit-testing, subtree drag when an edge is selected, orphan cleanup, keyboard handling (~688 lines, wrapped in an IIFE). |
| `README.md` | Single-line title — "Visualization Plane for Hyper Graph". |
| `.gitignore` | Ignores `issues.txt` and `fixed-issues.md` from version control. |
| `docs/PROJECT_SUMMARY.md` | This file. |
| `docs/issues.txt` | Tracks open and fixed issues with severity buckets. |
| `docs/fixed-issues.md` | Narrative changelog describing past fixes in detail. |

## Architecture & Data Flow

- **Entry point:** `visualizationPlane.html` loads the CSS in `<head>` and the JS
  script at the end of `<body>` so the DOM is ready.
- **View system:** A `view` object holds `panX`, `panY` (world-unit
  offsets) and `zoom` (multiplier). `convertViewportToPlane()` and
  `convertPlaneToViewport()` convert between coordinate spaces. All edge
  data is stored in world (plane) space.
- **State:** Two in-memory arrays form a graph model:
  - `nodes[]` — `{ x, y }` positions in world space. `nodes[0]` is the
    permanent green "Nexus" at the origin (`NEXUS_INDEX = 0`).
  - `edges[]` — `{ startNode, endNode, startX, startY }` where `endNode`
    is always a node index. `startNode` can be `null` if the start is in
    free space (with raw coords in `startX`/`startY`).
  - `selectedEdgeIndex` tracks which edge (if any) is selected.
  - No persistence, no network calls.
- **Flow:**
  1. `mousedown` — stores start coordinates. Snaps the start to the nearest
     node via `findNearestNode()`. Shift+click or middle-click starts panning.
  2. `mousemove` — while drawing, if movement exceeds `CONFIG.dragThreshold`
     (15px screen), sets `hasDragged = true`, redraws plus a live preview.
     While panning, adjusts `view.panX`/`view.panY`.
  3. `mouseup` — if dragged, `getOrCreateNode()` finds or creates the end
     node, self-loop prevention blocks same-node connections, then pushes
     a new edge. If clicked without dragging, runs hit-test to
     select/deselect the nearest edge (within `CONFIG.clickThreshold` — 8px).
  4. `wheel` — zooms at cursor via `applyZoomAtPoint()`.
  5. `keydown` (scoped to canvas) — Delete/Backspace splices the selected
     edge and calls `removeUnusedNodes()` to clean up unused non-Nexus nodes.
  6. When an edge is selected, dragging moves the **subtree** rooted at that
     edge’s **end node** (`collectSubtreeNodes`, `dragSubtreeNodeIndices`).
  7. `redrawCanvas()` — clears canvas, applies view transform via
     `ctx.setTransform()`, draws all segments and nodes. Nexus drawn last
     (on top). Line widths divided by zoom for consistent screen thickness.
  8. `resizeCanvas()` — syncs canvas drawing buffer to CSS layout size.
     Called on load and on window resize.

## Key Functions (visualizationPlane.js)

| Function | Description |
|----------|-------------|
| `resizeCanvas()` | Syncs canvas buffer size to CSS layout size. Called on load and window resize. |
| `convertViewportToPlane(sx, sy)` | Converts viewport (screen) coordinates to plane (world) space using the current view. |
| `convertPlaneToViewport(wx, wy)` | Converts plane (world) coordinates to viewport (screen) space using the current view. |
| `applyZoomAtPoint(newZoom, sx, sy)` | Applies zoom while keeping the world point under (sx, sy) fixed on screen. |
| `updateZoomDisplay()` | Updates the zoom percentage label in the toolbar. |
| `centerOnNexus()` | Resets view pan/zoom so the Nexus node is centered on screen. |
| `findNearestNode(wx, wy)` | Returns the index of the nearest node within snap radius, or `null`. |
| `getOrCreateNode(wx, wy)` | Returns an existing node index if within snap radius, or creates a new one. |
| `collectSubtreeNodes(rootNodeIndex)` | Stack walk from `rootNodeIndex` following edges where `edge.startNode === current` (used for subtree drag). |
| `removeUnusedNodes()` | Removes unused non-Nexus nodes and remaps edge references. |
| `redrawCanvas()` | Clears canvas, applies view transform, redraws all segments and nodes (Nexus on top). |
| `calcDistanceToEdge(px, py, ...)` | Shortest distance from a point to an edge segment (world space). |
| `getCanvasPos(event)` | Returns screen-space mouse position relative to the canvas. |
| Event handlers | `mousedown`, `mousemove`, `mouseup`, `wheel`, `keydown` on canvas; `click` on zoom/recenter buttons. |

## Key Patterns & Conventions

- **IIFE wrapper:** The entire script runs inside an IIFE. If `getContext`
  fails, the script throws an `Error` — no listeners are registered.
- **View/viewport pattern:** All edge data stored in world (plane) space.
  View transform applied during rendering. Viewport-to-plane conversion for input.
- **CONFIG object:** Centralizes colors, stroke widths, thresholds, and
  zoom settings (`minZoom`, `maxZoom`, `zoomStep`, `wheelZoomStep`).
- **Responsive canvas:** Sized via CSS (85vw x 85vh wrapper with flexbox).
  Canvas buffer resized to match on load and window resize.
- **Naming:** `camelCase` for JS variables/functions; DOM ids in kebab-case;
  `CONFIG` in SCREAMING_SNAKE for the object name.
- **Error handling:** Single `throw new Error` if canvas 2D context is unavailable.
- **Focus management:** Canvas has `tabindex="0"` and is focused on
  mousedown so keyboard events are received without a separate click.

## Known Issues

From `docs/issues.txt` — **6 open issues:**

**Moderate:**
- Right-click during drawing may leave inconsistent state (no button-2 guard).
- Free-space starts can yield degenerate/near-zero-length edges when the end
  snaps very close to the start (`startNode === null` case bypasses self-loop check).
- `resizeCanvas()` doesn't adjust `view.panX`/`view.panY` for new dimensions —
  Nexus and view drift after window resize vs initial `centerOnNexus`.

**Low:**
- No persistence — `nodes`/`edges` arrays live only in memory. Refreshing
  the page clears all drawings.
- No grab/grabbing cursor feedback when panning.
- Documentation drift — `fixed-issues.md` says `dragThreshold` is 3px vs
  code `CONFIG.dragThreshold = 15`; `issues.txt` still references old
  `visualPlane.js` filenames and line numbers.
- **Code hygiene:** `mousemove` assigns `lastDragPlaneX` / `lastDragPlaneY`
  but the file declares `lastDragPointPlaneX` / `lastDragPointPlaneY` — likely
  accidental globals; should be unified to avoid subtle bugs.

## Possible Extensions

- Undo/redo
- localStorage persistence
- PNG/SVG export
- Variable line styles
- Touch/pointer event support
- Min segment length validation
- Split JS into smaller modules (currently ~688 lines in one file)
