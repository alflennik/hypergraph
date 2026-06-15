# hyper-visual — Project Summary

> **Last updated:** 2026-06-13

> **Living document.** This file should be reviewed and updated (if necessary)
> by the AI agent after every use of the **context-loading-strategy** skill.
> Only update when the codebase has changed in ways that make this summary
> inaccurate or incomplete — new files, removed files, renamed modules,
> changed architecture, new dependencies, resolved issues, etc.
> When updating, also bump the "Last updated" date above.

## Project Overview

Browser-based **hypergraph editor** that stores nodes and edges in memory
(Map-based adjacency with a permanent **Nexus** root) and renders them on an
HTML5 Canvas. Users drag from existing nodes to create new connected nodes or
link nodes together. A left tool palette provides visual UI only (no tool logic
wired yet).

## Tech Stack

| Layer | Choice |
|-------|--------|
| Languages | HTML5, CSS3 (nested selectors), vanilla JavaScript (ES modules) |
| Rendering | Canvas 2D API |
| Libraries | None — no `package.json`, bundler, or runtime npm deps |
| Build | No build step |
| Dev server | `npx live-server` |

## How to Run

```sh
cd hyper-visual
npx --yes live-server --port=8080 --open=./index.html
```

ES modules use absolute imports (`/hypergraph.js`), so a local HTTP server is
required — `file://` will not work.

## Directory Structure

| Path | Role |
|------|------|
| `index.html` | Page shell: header, tool palette, full-viewport canvas |
| `style.css` | Layout, dark theme, palette styling |
| `visualizationPlane.js` | Composition root — wires services, redraw loop, interactions |
| `hypergraph.js` | Hypergraph factory: Map adjacency, Nexus, node/edge CRUD |
| `iterateHypergraph.js` | DFS traversal with `nodeCallback` / `edgeCallback` |
| `canvasService.js` | Drawing primitives, coordinate mapping, hit-testing |
| `interactionService.js` | Pointer input (mouse/touch) with subscribe API |
| `tools.js` | Side-effect palette button selection (visual only) |
| `debug.js` | `safeStringify()` for circular refs, Maps, Sets |
| `README.md` | Title + live-server command |
| `context/` | Gitignored local notes (`how-it-works.md`) |
| `docs/` | This file — architecture reference, not loaded by app |

Flat root layout — no `src/`, `lib/`, or `tests/` directories.

## Architecture

### Module graph

```
index.html
  ├── style.css
  └── visualizationPlane.js          ← entry point
        ├── hypergraph.js
        ├── tools.js                   (side effect)
        ├── interactionService.js
        ├── canvasService.js
        │     └── iterateHypergraph.js
        └── iterateHypergraph.js

iterateHypergraph.js
  ├── hypergraph.js    (imported, unused in body)
  └── debug.js         (imported, unused in body)

debug.js               (standalone, unused at runtime)
```

### `hypergraph.js`

`createHypergraph()` returns a closure over `nodeConnect: Map<nodeObj, nodeObj[]>`:

- `getNexus()` — root node `{ nexus: "nexus" }`
- `createEdgeFrom(startNode, { debuggingName }?)` — new node + bidirectional edge
- `createEdgeBetween(node1, node2)` — bidirectional edge with duplicate guards
- `getEdges(node)` — shuffled copy of neighbors (Fisher-Yates)
- `deleteEdge(node1, node2)` — removes from `node1` only (incomplete)

Nodes are **object identity keys**, not strings or indices.

### `iterateHypergraph.js`

DFS from `hypergraph.getNexus()`. Uses a `WeakMap` for visited tracking.
Supports cooperative stop via `{ stopIteration: true }` from callbacks.
Nodes unreachable from Nexus are never visited.

### `canvasService.js`

Factory `createCanvasService({ canvas, context, hypergraph, nodeData })` provides
`drawPoint`, `drawLine`, `getEventCoordinate`, `findNodeAtCoordinate`, and
`getDistance`. Hit-testing walks the full graph (O(n) per event).

### `interactionService.js`

Factory `createInteractionsService({ canvas, canvasService })` — note export
name vs import alias `createInteractionService` in `visualizationPlane.js`.
Exposes registrar methods: `clickedAnywhere`, `draggingAnywhere`,
`draggedAnywhere`, `draggingFromNode`, `draggedFromNode`, `draggingBetweenNodes`,
`draggedBetweenNodes`. Drag threshold: 10px.

### `visualizationPlane.js`

Owns shared state: `hypergraph` and `nodeData` (`WeakMap<node, { coordinate }>`).
Positions Nexus at canvas center on startup (not recentered on resize).
Registers interaction callbacks for node creation and edge linking.

## Data Flow

1. `index.html` loads `visualizationPlane.js` → `createVisualizationPlane()`.
2. Nexus placed at canvas center in `nodeData`.
3. `redrawCanvas()` resets context, resizes backing store, walks graph via
   `iterateHypergraph` to draw nodes (green circles) and edges (green lines).
4. **Drag from node to empty space:** `draggedFromNode` → `createEdgeFrom` +
   store coordinates in `nodeData` → `redrawCanvas`.
5. **Drag between nodes:** `draggedBetweenNodes` → `createEdgeBetween` →
   `redrawCanvas`.
6. **Resize:** `window.resize` → `redrawCanvas()` only (Nexus coords unchanged).

No server — entirely client-side.

## Styling

`style.css`: dark theme, absolute-positioned header and left palette over canvas.
Canvas fills `calc(100vw - 20px)` × `calc(100dvh - 20px)`, background
`rgb(27, 29, 27)`. Palette `.selected` state toggled by `tools.js`.

## Known Issues

- `deleteEdge` only splices from `node1` — does not remove reverse edge
- `startNode` not reset in `interactionService.endInteraction` — stale state
- Unused imports in `iterateHypergraph.js` (`hypergraph`, `debug`)
- Palette tools have no effect on canvas behavior
- `draggedFromEmptyCanvas` not implemented (TODO in `interactionService.js`)
- Nexus not recentered on window resize
- `context/how-it-works.md` partially outdated vs current code
- No self-edge guard when dragging node onto itself
- O(n) hit-testing via full graph walk on every pointer move

## Key Dependencies

None at runtime. Dev-time only: `npx live-server`.

## Build & Packaging

No build step. Serve static files with any HTTP server. `.gitignore` excludes
`context/` and issue-tracking files.

## Historical Context

Commit `a9997fb` removed the original full canvas app. The current codebase
rebuilt a service-layer architecture (hypergraph + canvas + interaction) rather
than restoring the pre-restructure monolith. Pre-restructure versions are
recoverable from git (`visualizationPlane.js` @ `a9997fb^`,
`visualizationPlane2/` @ `a9997fb^`).

## Quick reference — which file to open

| Task | File |
|------|------|
| Hypergraph CRUD / adjacency | `hypergraph.js` |
| Graph traversal / callbacks | `iterateHypergraph.js` |
| Canvas drawing / hit-testing | `canvasService.js` |
| Pointer input / drag events | `interactionService.js` |
| App wiring / redraw loop | `visualizationPlane.js` |
| Page layout / palette HTML | `index.html` |
| Styles | `style.css` |
| Palette UI (visual only) | `tools.js` |
| Debug serialization | `debug.js` |
| Developer notes | `context/how-it-works.md` |
