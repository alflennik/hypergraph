# hyper-visual — Project Summary

> **Last updated:** 2026-05-22

> **Living document.** This file should be reviewed and updated (if necessary)
> by the AI agent after every use of the **context-loading-strategy** skill.
> Only update when the codebase has changed in ways that make this summary
> inaccurate or incomplete — new files, removed files, renamed modules,
> changed architecture, new dependencies, resolved issues, etc.
> When updating, also bump the "Last updated" date above.

## Project Overview

Browser-based hypergraph visualization experiment. The long-term goal is an
interactive 2D canvas where users draw edges, nodes snap together, and the
structure is stored as a hypergraph (Map-based adjacency with a permanent
**Nexus** root node).

**Current state:** Mid-restructure. The full canvas app was removed in commit
`a9997fb`. On disk today: the hypergraph data layer, traversal utility, debug
helpers, and a minimal canvas stub. The richer UI lives in git history
(pre-restructure).

## Tech Stack

| Layer | Choice |
|-------|--------|
| Languages | HTML5, CSS, vanilla JavaScript (ES modules) |
| Rendering | Canvas 2D API |
| Libraries | None |
| Build | No build step — no bundler, no `package.json` |
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
| `index.html` | Page shell: header, full-viewport canvas, inline CSS |
| `visualizationPlane.js` | Canvas stub — draws one red circle; hypergraph not wired |
| `hypergraph.js` | Hypergraph factory: Map adjacency, Nexus, node/edge CRUD |
| `iterateHypergraph.js` | DFS traversal with `nodeCallback` / `edgeCallback` |
| `debug.js` | `safeStringify()` for circular refs, Maps, Sets |
| `README.md` | Title + live-server command |
| `context/` | Gitignored local notes and archived project summary |

**Removed in restructure (`a9997fb`), recoverable from git:**

- `visualizationPlane.html`, `visualizationPlane.css`, full `visualizationPlane.js` (~698 lines)
- `visualizationPlane2/` — HTML, CSS, JS (~663 lines), local `debug.js`
- Previous `docs/` tree

## Architecture

### Module graph (current)

```
index.html
  └── visualizationPlane.js  (stub)
        └── hypergraph.js    (imported but unused)

iterateHypergraph.js
  ├── hypergraph.js          (imported but unused in module body)
  └── debug.js               (imported but unused)

debug.js                     (standalone utility)
```

### `hypergraph.js`

`createHyperGraph()` returns a closure over `nodeConnect: Map<nodeObj, nodeObj[]>`:

- `getNexus()` — root node `{ nexus: "nexus" }`
- `createNode(nodeName)` — creates `{ [name]: name }`, registers with `[]` adjacency
- `createEdge(node1, node2)` — bidirectional adjacency; guards duplicates
- `getEdges(node)` — shuffled copy of neighbors (Fisher-Yates)
- `deleteEdge(node1, node2)` — removes from `node1` only (incomplete)

Nodes are **object identity keys**, not strings or indices.

### `iterateHypergraph.js`

DFS from `hypergraph.getNexus()`. Uses a `WeakMap` for visited tracking. Expects
the graph API object (`.getEdges()`, `.getNexus()`), not the raw Map.

### Historical: v1 vs v2 (git, pre-`a9997fb`)

| Aspect | v1 (`visualizationPlane.js`) | v2 (`visualizationPlane2/`) |
|--------|------------------------------|-----------------------------|
| Module system | CommonJS + IIFE | ES modules |
| Data model | Spatial arrays (`nodes[]`, `edges[]`) | Dual: hypergraph Map + `nodesMap` (screen pos → node) |
| Features | Full: pan/zoom, draw/select/delete, subtree drag | Partial port; much redraw code commented out |
| Traversal | Did not use `iterateHypergraph` | Wired on mouseup via `iterateHypergraph` |

## Data Flow

### Intended flow (v2 design, from git)

1. `createGraph()` seeds Nexus in the adjacency Map.
2. Nexus placed on canvas via `nodesMap.set(posKey(cx, cy), nexus)`.
3. User draws edge → look up/create nodes by screen position → `createHyperEdge`.
4. `iterateHypergraph(graph, callbacks)` walks from Nexus for render/debug.
5. Canvas draws from stored positions (v2 had much of this commented out).

### Current flow (on disk)

1. `index.html` loads `visualizationPlane.js`.
2. Stub draws one static red circle — no hypergraph, no iteration, no input.

## Styling

**Current:** Inline styles in `index.html` — black body, white text, 40px header,
canvas fills `calc(100dvh - 60px)`, dark green-gray canvas background.

**Historical:** Separate CSS files for v1/v2 with `#canvas-wrapper`, zoom toolbar
styles (v2 toolbar commented out in HTML and CSS).

## Known Issues

- `visualizationPlane.js` imports hypergraph but never uses it
- Import name mismatch: export is `createHyperGraph`, stub imports `createHypergraph`
- `iterateHypergraph.js` has unused imports and an empty TODO block
- `deleteEdge` only splices from `node1` — does not remove reverse edge from `node2`
- `nodeConnect` no longer exported — breaks code expecting `graph.nodeConnect` (v2 relied on this)
- `context/PROJECT_SUMMARY.md` is archival reference for the removed v1 app

## Key Dependencies

None at runtime. Dev-time only: `npx live-server`.

## Build & Packaging

No build step. Serve static files with any HTTP server. `.gitignore` excludes
`context/` and issue-tracking files.

## Quick reference — which file to open

| Task | File |
|------|------|
| Hypergraph CRUD / adjacency | `hypergraph.js` |
| Graph traversal / callbacks | `iterateHypergraph.js` |
| Canvas entry / page layout | `index.html` |
| Canvas rendering (current) | `visualizationPlane.js` |
| Debug serialization | `debug.js` |
| Full interactive canvas (historical) | git: `visualizationPlane.js` @ `a9997fb^` |
| Hypergraph + canvas WIP | git: `visualizationPlane2/visualizationPlane_2.js` @ `a9997fb^` |
