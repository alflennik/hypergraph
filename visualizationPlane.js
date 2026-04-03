/**
 * Wrap the entire script in an IIFE (Immediately Invoked Function
 * Expression) so all variables are scoped and don't leak into
 * the global namespace.
 */
(() => {
  const CONFIG = {
    defaultStrokeColor: "black",   // Color for normal (unselected) edges.
    selectedStrokeColor: "red",    // Color for the currently selected edge.
    previewStrokeColor: "black",   // Color for the live preview edge while dragging.
    defaultEdgeWidth: 1,            // Stroke width for normal edges (px).
    selectedEdgeWidth: 3,           // Stroke width for the selected edge (px).
    clickThreshold: 8,             // Max distance (px) from an edge to count as a click on it.
    dragThreshold: 15,             // Min distance (px) mouse must move to count as a drag.

    // Node settings.
    nodeRadius: 6,                 // Radius of regular node circles (viewport px).
    nodeColor: "blue",             // Fill color for regular nodes.
    nodeSnapRadius: 12,            // Max distance (viewport px) to snap to an existing node.

    // Nexus node — the permanent, undeletable center node.
    nexusRadius: 15,               // Radius of the Nexus node (viewport px).
    nexusColor: "green",           // Fill color for the Nexus node.

    // Zoom settings.
    minZoom: 0.1,                  // Minimum zoom level (10%).
    maxZoom: 10,                   // Maximum zoom level (1000%).
    zoomStep: 0.15,                // How much each zoom button click changes the zoom (15%).
    wheelZoomStep: 0.1,            // How much each scroll tick changes the zoom (10%).
  };

  const canvas = document.getElementById("plane-1");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Canvas 2D context is not available. Drawing cannot proceed.");
  }

  /**
   * View — tracks the current pan and zoom state.
   *
   * Plane coordinates: the "infinite" 2D surface where edges live.
   * Viewport coordinates: pixels on the visible canvas element.
   *
   * Conversion formulas:
   *   viewportX = (planeX + panX) * zoom
   *   viewportY = (planeY + panY) * zoom
   *   planeX    = viewportX / zoom - panX
   *   planeY    = viewportY / zoom - panY
   */
  let view = {
    panX: 0,    // Horizontal pan offset (plane units).
    panY: 0,    // Vertical pan offset (plane units).
    zoom: 1,    // Zoom multiplier (1 = 100%).
  };

  /**
   * Graph data model — nodes and edges.
   *
   * nodes[]: Array of { x, y } objects in plane coordinates.
   *          Nodes are created only at the END of a drawn edge.
   *          They serve as visible snap targets for future edges.
   *
   * edges[]: Array of { startNode, endNode, startX, startY } objects.
   *          endNode is always an index into nodes[].
   *          startNode is a node index if the edge snapped to an
   *          existing node, or null if the edge started from empty
   *          space (in which case startX/startY hold the raw position).
   *
   * This lets edges share endpoints via nodes. Deleting an edge
   * removes only that edge. Unused nodes (nodes with no remaining
   * edges referencing them) are garbage-collected automatically.
   */
  let nodes = [];
  let edges = [];

  const NEXUS_INDEX = 0;
  nodes.push({ x: 0, y: 0 });

  /** Index of the currently selected edge (null means nothing selected). */
  let selectedEdgeIndex = null;

  /** Drawing state. */
  let isDrawing = false;
  let isPanning = false;

  /** The node index the new edge starts from (null if starting fresh). */
  let startNodeIndex = null;

  /** Start plane position (used when not snapping to an existing node). */
  let startPlaneX = 0;
  let startPlaneY = 0;

  /** Start positions in viewport space (for pan and drag threshold). */
  let startViewportX = 0;
  let startViewportY = 0;

  /** Last viewport position during a pan drag. */
  let lastPanViewportX = 0;
  let lastPanViewportY = 0;

  /** Track whether the mouse moved during a mousedown (to distinguish click vs drag). */
  let hasDragged = false;

  /** Coordinate conversion functions. */

  /** Convert a viewport-space point to plane-space. */
  const convertViewportToPlane = (viewportX, viewportY) => ({
    x: viewportX / view.zoom - view.panX,
    y: viewportY / view.zoom - view.panY,
  });

  /** Convert a plane-space point to viewport-space. */
  const convertPlaneToViewport = (planeX, planeY) => ({
    x: (planeX + view.panX) * view.zoom,
    y: (planeY + view.panY) * view.zoom,
  });

  /**
   * Get the viewport-space mouse position relative to the
   * canvas from a mouse event.
   */
  const getCanvasPos = (event) => {
    const bounds = canvas.getBoundingClientRect();
    return {
      viewportX: event.clientX - bounds.left,
      viewportY: event.clientY - bounds.top,
    };
  };

  /** Zoom display — update the percentage label in the toolbar. */
  const zoomLevelSpan = document.getElementById("zoom-level");

  const updateZoomDisplay = () => {
    zoomLevelSpan.textContent = Math.round(view.zoom * 100) + "%";
  };

  const redrawCanvas = () => {
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Apply the view transform: scale then translate.
    context.save();
    context.setTransform(
      view.zoom, 0,
      0, view.zoom,
      view.panX * view.zoom,
      view.panY * view.zoom
    );

    // --- Draw edges ---
    for (let i = 0; i < edges.length; i++) {
      const edge = edges[i];

      // Start position: use the node if snapped, otherwise raw coords.
      const startX = (edge.startNode !== null) ? nodes[edge.startNode].x : edge.startX;
      const startY = (edge.startNode !== null) ? nodes[edge.startNode].y : edge.startY;
      const endNode = nodes[edge.endNode];

      context.beginPath();
      context.moveTo(startX, startY);
      context.lineTo(endNode.x, endNode.y);

      // Highlight the selected edge.
      // Divide lineWidth by zoom so strokes appear the same thickness
      // on viewport regardless of zoom level.
      if (i === selectedEdgeIndex) {
        context.strokeStyle = CONFIG.selectedStrokeColor;
        context.lineWidth = CONFIG.selectedEdgeWidth / view.zoom;
      } else {
        context.strokeStyle = CONFIG.defaultStrokeColor;
        context.lineWidth = CONFIG.defaultEdgeWidth / view.zoom;
      }

      context.stroke();
    }

    // Draw regular nodes
    // Node radius is in viewport pixels, so divide by zoom for plane space.
    const nodePlaneRadius = CONFIG.nodeRadius / view.zoom;
    context.fillStyle = CONFIG.nodeColor;

    for (let i = 0; i < nodes.length; i++) {
      if (i === NEXUS_INDEX) continue; // Nexus is drawn separately below.
      context.beginPath();
      context.arc(nodes[i].x, nodes[i].y, nodePlaneRadius, 0, Math.PI * 2);
      context.fill();
    }

    // Draw the Nexus node
    // Drawn last so it renders on top of everything else.
    const nexusPlaneRadius = CONFIG.nexusRadius / view.zoom;
    context.fillStyle = CONFIG.nexusColor;
    context.beginPath();
    context.arc(nodes[NEXUS_INDEX].x, nodes[NEXUS_INDEX].y, nexusPlaneRadius, 0, Math.PI * 2);
    context.fill();

    context.restore();
  };

  /**
   * Calculate the shortest distance from a point (pointX, pointY) to a
   * edge segment defined by an edge object (which may have a node
   * or raw coordinates for its start).
   * All coordinates are in plane space.
   * Used to detect if a click is close enough to select an edge.
   */
  const calcDistanceToEdge = (pointX, pointY, edge) => {
    const segStartX = (edge.startNode !== null) ? nodes[edge.startNode].x : edge.startX;
    const segStartY = (edge.startNode !== null) ? nodes[edge.startNode].y : edge.startY;
    const segEndX = nodes[edge.endNode].x;
    const segEndY = nodes[edge.endNode].y;

    const segDeltaX = segEndX - segStartX;
    const segDeltaY = segEndY - segStartY;
    const lengthSquared = segDeltaX * segDeltaX + segDeltaY * segDeltaY;

    // If the edge has zero length, just return distance to the point.
    if (lengthSquared === 0) {
      return Math.sqrt((pointX - segStartX) * (pointX - segStartX) + (pointY - segStartY) * (pointY - segStartY));
    }

    // Project point onto the edge segment, clamped between 0 and 1.
    let projection = ((pointX - segStartX) * segDeltaX + (pointY - segStartY) * segDeltaY) / lengthSquared;
    projection = Math.max(0, Math.min(1, projection));

    // Find the closest point on the segment.
    const closestX = segStartX + projection * segDeltaX;
    const closestY = segStartY + projection * segDeltaY;

    return Math.sqrt((pointX - closestX) * (pointX - closestX) + (pointY - closestY) * (pointY - closestY));
  };

  /** Node helpers. */

  /**
   * Find the nearest node to a plane-space point within a maximum
   * viewport-pixel radius. Returns the node index or null if none found.
   */
  const findNearestNode = (planeX, planeY, maxViewportPx) => {
    const maxPlaneDist = maxViewportPx / view.zoom;
    let bestIndex = null;
    let bestDist = Infinity;

    for (let i = 0; i < nodes.length; i++) {
      const deltaX = nodes[i].x - planeX;
      const deltaY = nodes[i].y - planeY;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      if (distance < bestDist && distance <= maxPlaneDist) {
        bestDist = distance;
        bestIndex = i;
      }
    }

    return bestIndex;
  };

  const getOrCreateNode = (planeX, planeY) => {
    const existing = findNearestNode(planeX, planeY, CONFIG.nodeSnapRadius);
    if (existing !== null) return existing;

    nodes.push({ x: planeX, y: planeY });
    return nodes.length - 1;
  };

  const removeUnusedNodes = () => {
    // Build a set of all node indices currently in use.
    // Always include the Nexus so it survives cleanup.
    const usedSet = new Set();
    usedSet.add(NEXUS_INDEX);
    for (let i = 0; i < edges.length; i++) {
      if (edges[i].startNode !== null) usedSet.add(edges[i].startNode);
      usedSet.add(edges[i].endNode);
    }

    // Build an index mapping: oldIndex -> newIndex (or null if removed).
    const indexMap = new Array(nodes.length);
    const newNodes = [];
    for (let i = 0; i < nodes.length; i++) {
      if (usedSet.has(i)) {
        indexMap[i] = newNodes.length;
        newNodes.push(nodes[i]);
      } else {
        indexMap[i] = null;
      }
    }

    // Update all edge references to use the new compacted indices.
    // startNode can be null (no node), so skip remapping in that case.
    for (let i = 0; i < edges.length; i++) {
      if (edges[i].startNode !== null) {
        edges[i].startNode = indexMap[edges[i].startNode];
      }
      edges[i].endNode = indexMap[edges[i].endNode];
    }

    nodes = newNodes;
  };

  const applyZoomAtPoint = (newZoom, viewportX, viewportY) => {
    // Clamp the new zoom to the configured range.
    newZoom = Math.max(CONFIG.minZoom, Math.min(CONFIG.maxZoom, newZoom));

    // Find the plane point currently under the cursor.
    const planeBefore = convertViewportToPlane(viewportX, viewportY);

    // Apply the new zoom level.
    view.zoom = newZoom;

    // After zoom changed, the same viewport point now maps to a different
    // plane point. Adjust panX/panY so it maps back to the original.
    const planeAfter = convertViewportToPlane(viewportX, viewportY);
    view.panX += (planeAfter.x - planeBefore.x);
    view.panY += (planeAfter.y - planeBefore.y);

    updateZoomDisplay();
    redrawCanvas();
  };

  const resizeCanvas = () => {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    redrawCanvas();
  };

  const centerOnNexus = () => {
    view.zoom = 1;
    view.panX = canvas.width / 2;
    view.panY = canvas.height / 2;
    updateZoomDisplay();
    redrawCanvas();
  };

  const resetZoom = () => {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    const planeCenter = convertViewportToPlane(centerX, centerY);

    view.zoom = 1;

    view.panX = centerX - planeCenter.x;
    view.panY = centerY - planeCenter.y;

    updateZoomDisplay();
    redrawCanvas();
  };

  /** Event listeners — canvas interactions and toolbar buttons. */

  window.addEventListener("resize", resizeCanvas);

  document.getElementById("zoom-in-btn").addEventListener("click", () => {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    applyZoomAtPoint(view.zoom * (1 + CONFIG.zoomStep), centerX, centerY);
  });

  document.getElementById("zoom-out-btn").addEventListener("click", () => {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    applyZoomAtPoint(view.zoom * (1 - CONFIG.zoomStep), centerX, centerY);
  });

  document.getElementById("zoom-reset-btn").addEventListener("click", () => {
    // centerOnNexus();
    resetZoom();
  });

  /** Recenter button — pans and zooms to center the Nexus node. */
  document.getElementById("recenter-btn").addEventListener("click", () => {
    centerOnNexus();
  });

  canvas.addEventListener("mousedown", (event) => {
    // Focus the canvas so it can receive keyboard events (e.g. Delete/Backspace).
    canvas.focus();

    const { viewportX, viewportY } = getCanvasPos(event);
    startViewportX = viewportX;
    startViewportY = viewportY;
    hasDragged = false;

    // Middle-click or shift+left-click starts panning.
    if (event.button === 1 || (event.button === 0 && event.shiftKey)) {
      isPanning = true;
      lastPanViewportX = viewportX;
      lastPanViewportY = viewportY;
      event.preventDefault();
      return;
    }

    // Left-click starts drawing an edge.
    if (event.button === 0) {
      isDrawing = true;
      const plane = convertViewportToPlane(viewportX, viewportY);

      // Check if we're near an existing node — snap to it.
      startNodeIndex = findNearestNode(plane.x, plane.y, CONFIG.nodeSnapRadius);

      if (startNodeIndex !== null) {
        // Snap: use the existing node's position as the start.
        startPlaneX = nodes[startNodeIndex].x;
        startPlaneY = nodes[startNodeIndex].y;
      } else {
        // No snap: use the raw click position.
        startPlaneX = plane.x;
        startPlaneY = plane.y;
      }
    }
  });

  canvas.addEventListener("mousemove", (event) => {
    const { viewportX, viewportY } = getCanvasPos(event);

    // Handle panning.
    if (isPanning) {
      // Pan offset is in plane units, so divide viewport delta by zoom.
      const deltaX = (viewportX - lastPanViewportX) / view.zoom;
      const deltaY = (viewportY - lastPanViewportY) / view.zoom;
      view.panX += deltaX;
      view.panY += deltaY;
      lastPanViewportX = viewportX;
      lastPanViewportY = viewportY;
      redrawCanvas();
      return;
    }

    if (!isDrawing) return;

    // Only count as a drag if the mouse moved past the threshold from the start.
    // This prevents tiny accidental jitter during a click from committing
    // an unintended short edge segment. Threshold is in viewport pixels.
    const deltaViewportX = viewportX - startViewportX;
    const deltaViewportY = viewportY - startViewportY;
    if (!hasDragged && Math.sqrt(deltaViewportX * deltaViewportX + deltaViewportY * deltaViewportY) < CONFIG.dragThreshold) return;

    hasDragged = true;

    // Redraw all existing edges and nodes, then draw the preview edge on top.
    redrawCanvas();

    // Check if the cursor is near an existing node for a snap preview.
    const plane = convertViewportToPlane(viewportX, viewportY);
    const snapNodeIndex = findNearestNode(plane.x, plane.y, CONFIG.nodeSnapRadius);
    let endViewportX = viewportX;
    let endViewportY = viewportY;

    // If snapping, draw the preview edge to the snapped node position.
    if (snapNodeIndex !== null) {
      const snapped = convertPlaneToViewport(nodes[snapNodeIndex].x, nodes[snapNodeIndex].y);
      endViewportX = snapped.x;
      endViewportY = snapped.y;
    }

    // Draw the preview edge in viewport space (outside the view transform).
    const startViewport = convertPlaneToViewport(startPlaneX, startPlaneY);
    context.beginPath();
    context.moveTo(startViewport.x, startViewport.y);
    context.lineTo(endViewportX, endViewportY);
    context.strokeStyle = CONFIG.previewStrokeColor;
    context.lineWidth = CONFIG.defaultEdgeWidth;
    context.stroke();
  });

  canvas.addEventListener("mouseup", (event) => {
    // End panning.
    if (isPanning) {
      isPanning = false;
      return;
    }

    if (!isDrawing) return;
    isDrawing = false;

    const { viewportX, viewportY } = getCanvasPos(event);
    const plane = convertViewportToPlane(viewportX, viewportY);

    if (!hasDragged) {
      // User clicked without dragging — try to select an edge.
      // The click threshold is in viewport pixels, so convert to plane units.
      const clickThresholdPlane = CONFIG.clickThreshold / view.zoom;
      let closestIndex = null;
      let closestDist = Infinity;

      for (let i = 0; i < edges.length; i++) {
        const edge = edges[i];
        const distance = calcDistanceToEdge(plane.x, plane.y, edge);

        if (distance < closestDist) {
          closestDist = distance;
          closestIndex = i;
        }
      }

      // Select the edge if it's within the threshold, otherwise deselect.
      if (closestDist <= clickThresholdPlane) {
        selectedEdgeIndex = closestIndex;
      } else {
        selectedEdgeIndex = null;
      }

      redrawCanvas();
      return;
    }

    // User dragged — create the edge.
    // A node is created only at the END of the edge (or reused if snapping).
    // The start reuses an existing node if snapped, otherwise stores raw coords.
    const endNodeIndex = getOrCreateNode(plane.x, plane.y);

    // Don't create an edge from a node to itself.
    if (startNodeIndex !== null && startNodeIndex === endNodeIndex) {
      redrawCanvas();
      return;
    }

    edges.push({
      startNode: startNodeIndex,   // null if not snapped, or an existing node index.
      startX: startPlaneX,         // Raw start position (used when startNode is null).
      startY: startPlaneY,
      endNode: endNodeIndex,
    });

    // Deselect any previously selected edge when drawing a new one.
    selectedEdgeIndex = null;

    redrawCanvas();
  });

  /**
   * WHEEL — zoom in/out at the mouse cursor position.
   * Scrolling up zooms in, scrolling down zooms out.
   */
  canvas.addEventListener("wheel", (event) => {
    event.preventDefault();

    const { viewportX, viewportY } = getCanvasPos(event);

    // deltaY is positive when scrolling down (zoom out).
    const direction = event.deltaY < 0 ? 1 : -1;
    const newZoom = view.zoom * (1 + direction * CONFIG.wheelZoomStep);

    applyZoomAtPoint(newZoom, viewportX, viewportY);
  }, { passive: false });

  canvas.addEventListener("keydown", (event) => {
    if (event.key === "Delete" || event.key === "Backspace") {
      // Prevent the browser from navigating back on Backspace.
      event.preventDefault();

      if (selectedEdgeIndex === null) return;

      // Remove the selected edge from the array.
      edges.splice(selectedEdgeIndex, 1);
      selectedEdgeIndex = null;

      // Clean up nodes that are no longer connected to any edge.
      removeUnusedNodes();

      redrawCanvas();
    }
  });

  /** Initial setup: size the canvas, center on the Nexus, and draw. */
  resizeCanvas();
  centerOnNexus();

})();
