// ============================================================
// Wrap the entire script in an IIFE (Immediately Invoked Function
// Expression) so we can use early return to bail out if the
// canvas context is unavailable.
// ============================================================
(function() {

// ============================================================
// Configuration — all tunable values in one place.
// Adjust these instead of hunting for hardcoded numbers.
// ============================================================
const CONFIG = {
  defaultStrokeColor: "black",   // Color for normal (unselected) lines.
  selectedStrokeColor: "red",    // Color for the currently selected line.
  previewStrokeColor: "black",   // Color for the live preview line while dragging.
  defaultLineWidth: 1,           // Stroke width for normal lines (px).
  selectedLineWidth: 3,          // Stroke width for the selected line (px).
  clickThreshold: 8,             // Max distance (px) from a line to count as a click on it.
  dragThreshold: 15,             // Min distance (px) mouse must move to count as a drag.

  // Zoom settings.
  minZoom: 0.1,                  // Minimum zoom level (10%).
  maxZoom: 10,                   // Maximum zoom level (1000%).
  zoomStep: 0.15,               // How much each zoom button click changes the zoom (15%).
  wheelZoomStep: 0.1,           // How much each scroll tick changes the zoom (10%).
};

// ============================================================
// Canvas setup — size the canvas to match its CSS layout size.
// ============================================================
const canvas = document.getElementById("plane-1");
let ctx = null;

if (canvas.getContext) {
  ctx = canvas.getContext("2d");
} else {
  alert("Your browser does not support the canvas element.");
}

// Guard: stop here if the canvas context is not available.
// Without a valid context, none of the drawing or event code will work.
if (!ctx) return;

// ============================================================
// Resize the canvas drawing buffer to match its displayed size.
// Called once on load and whenever the window resizes.
// This keeps the canvas crisp at any viewport size.
// ============================================================
function resizeCanvas() {
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
  redrawCanvas();
}

window.addEventListener("resize", resizeCanvas);

// ============================================================
// Camera — tracks the current pan and zoom state.
//
// World coordinates: the "infinite" plane where lines live.
// Screen coordinates: pixels on the visible canvas element.
//
// Conversion formulas:
//   screenX = (worldX + panX) * zoom
//   screenY = (worldY + panY) * zoom
//   worldX  = screenX / zoom - panX
//   worldY  = screenY / zoom - panY
// ============================================================
let camera = {
  panX: 0,    // Horizontal pan offset (world units).
  panY: 0,    // Vertical pan offset (world units).
  zoom: 1,    // Zoom multiplier (1 = 100%).
};

// Convert a screen-space point to world-space.
function screenToWorld(sx, sy) {
  return {
    x: sx / camera.zoom - camera.panX,
    y: sy / camera.zoom - camera.panY,
  };
}

// Convert a world-space point to screen-space.
function worldToScreen(wx, wy) {
  return {
    x: (wx + camera.panX) * camera.zoom,
    y: (wy + camera.panY) * camera.zoom,
  };
}

// ============================================================
// Zoom at a specific screen point. Adjusts the pan so that the
// world point under the cursor stays in the same screen position
// after the zoom changes. This is the "zoom toward mouse" effect.
// ============================================================
function zoomAtPoint(newZoom, screenX, screenY) {
  // Clamp the new zoom to the configured range.
  newZoom = Math.max(CONFIG.minZoom, Math.min(CONFIG.maxZoom, newZoom));

  // Find the world point currently under the cursor.
  const worldBefore = screenToWorld(screenX, screenY);

  // Apply the new zoom level.
  camera.zoom = newZoom;

  // After zoom changed, the same screen point now maps to a different
  // world point. Adjust panX/panY so it maps back to the original.
  const worldAfter = screenToWorld(screenX, screenY);
  camera.panX += (worldAfter.x - worldBefore.x);
  camera.panY += (worldAfter.y - worldBefore.y);

  updateZoomDisplay();
  redrawCanvas();
}

// ============================================================
// Zoom display — update the percentage label in the toolbar.
// ============================================================
const zoomLevelSpan = document.getElementById("zoom-level");

function updateZoomDisplay() {
  zoomLevelSpan.textContent = Math.round(camera.zoom * 100) + "%";
}

// ============================================================
// Zoom toolbar buttons.
// Zoom in/out focus on the center of the canvas since there is
// no specific mouse position when clicking a button.
// ============================================================
document.getElementById("zoom-in-btn").addEventListener("click", function() {
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  zoomAtPoint(camera.zoom * (1 + CONFIG.zoomStep), cx, cy);
});

document.getElementById("zoom-out-btn").addEventListener("click", function() {
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  zoomAtPoint(camera.zoom * (1 - CONFIG.zoomStep), cx, cy);
});

document.getElementById("zoom-reset-btn").addEventListener("click", function() {
  camera.panX = 0;
  camera.panY = 0;
  camera.zoom = 1;
  updateZoomDisplay();
  redrawCanvas();
});

// ============================================================
// Drawing state — lines and selection.
// ============================================================

// Array to store all drawn lines as { x1, y1, x2, y2 } objects.
// Coordinates are in world space.
let lines = [];

// Index of the currently selected line (-1 means nothing selected).
let selectedLineIndex = -1;

let isDrawing = false;
let isPanning = false;

// Start positions in world space (for drawing lines).
let startWorldX = 0;
let startWorldY = 0;

// Start positions in screen space (for pan and drag threshold).
let startScreenX = 0;
let startScreenY = 0;

// Last screen position during a pan drag.
let lastPanScreenX = 0;
let lastPanScreenY = 0;

// Track whether the mouse moved during a mousedown (to distinguish click vs drag).
let hasDragged = false;

// ============================================================
// Redraw all lines from the lines array.
// Clears the entire canvas first, then applies the camera
// transform and draws each stored line in world space.
// The selected line is drawn in red so the user can see it.
// ============================================================
function redrawCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Apply the camera transform: scale then translate.
  ctx.save();
  ctx.setTransform(
    camera.zoom, 0,
    0, camera.zoom,
    camera.panX * camera.zoom,
    camera.panY * camera.zoom
  );

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    ctx.beginPath();
    ctx.moveTo(line.x1, line.y1);
    ctx.lineTo(line.x2, line.y2);

    // Highlight the selected line in red, all others in black.
    // Divide lineWidth by zoom so strokes appear the same thickness
    // on screen regardless of zoom level.
    if (i === selectedLineIndex) {
      ctx.strokeStyle = CONFIG.selectedStrokeColor;
      ctx.lineWidth = CONFIG.selectedLineWidth / camera.zoom;
    } else {
      ctx.strokeStyle = CONFIG.defaultStrokeColor;
      ctx.lineWidth = CONFIG.defaultLineWidth / camera.zoom;
    }

    ctx.stroke();
  }

  ctx.restore();
}

// ============================================================
// Calculate the shortest distance from a point (px, py) to a
// line segment defined by (x1, y1) -> (x2, y2).
// All coordinates are in world space.
// Used to detect if a click is close enough to select a line.
// ============================================================
function distanceToLine(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthSquared = dx * dx + dy * dy;

  // If the line has zero length, just return distance to the point.
  if (lengthSquared === 0) {
    return Math.sqrt((px - x1) * (px - x1) + (py - y1) * (py - y1));
  }

  // Project point onto the line segment, clamped between 0 and 1.
  let t = ((px - x1) * dx + (py - y1) * dy) / lengthSquared;
  t = Math.max(0, Math.min(1, t));

  // Find the closest point on the segment.
  const closestX = x1 + t * dx;
  const closestY = y1 + t * dy;

  return Math.sqrt((px - closestX) * (px - closestX) + (py - closestY) * (py - closestY));
}

// ============================================================
// Helper: get the screen-space mouse position relative to the
// canvas from a mouse event.
// ============================================================
function getCanvasPos(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    sx: event.clientX - rect.left,
    sy: event.clientY - rect.top,
  };
}

// ============================================================
// MOUSE DOWN — start drawing a new line, or start panning.
// Middle mouse button (button 1) or left + shift starts a pan.
// Left mouse button starts drawing.
// ============================================================
canvas.addEventListener("mousedown", function(event) {
  // Focus the canvas so it can receive keyboard events (e.g. Delete/Backspace).
  canvas.focus();

  const { sx, sy } = getCanvasPos(event);
  startScreenX = sx;
  startScreenY = sy;
  hasDragged = false;

  // Middle-click or shift+left-click starts panning.
  if (event.button === 1 || (event.button === 0 && event.shiftKey)) {
    isPanning = true;
    lastPanScreenX = sx;
    lastPanScreenY = sy;
    event.preventDefault();
    return;
  }

  // Left-click starts drawing a line.
  if (event.button === 0) {
    isDrawing = true;
    const world = screenToWorld(sx, sy);
    startWorldX = world.x;
    startWorldY = world.y;
  }
});

// ============================================================
// MOUSE MOVE — show a live preview of the line being drawn,
// or update the pan position.
// ============================================================
canvas.addEventListener("mousemove", function(event) {
  const { sx, sy } = getCanvasPos(event);

  // Handle panning.
  if (isPanning) {
    // Pan offset is in world units, so divide screen delta by zoom.
    const dx = (sx - lastPanScreenX) / camera.zoom;
    const dy = (sy - lastPanScreenY) / camera.zoom;
    camera.panX += dx;
    camera.panY += dy;
    lastPanScreenX = sx;
    lastPanScreenY = sy;
    redrawCanvas();
    return;
  }

  if (!isDrawing) return;

  // Only count as a drag if the mouse moved past the threshold from the start.
  // This prevents tiny accidental jitter during a click from committing
  // an unintended short line segment. Threshold is in screen pixels.
  const dxScreen = sx - startScreenX;
  const dyScreen = sy - startScreenY;
  if (!hasDragged && Math.sqrt(dxScreen * dxScreen + dyScreen * dyScreen) < CONFIG.dragThreshold) return;

  hasDragged = true;

  // Redraw all existing lines, then draw the preview line on top.
  redrawCanvas();

  // Draw the preview line in screen space (outside the camera transform)
  // by converting world start to screen and using current screen pos.
  const startScreen = worldToScreen(startWorldX, startWorldY);
  ctx.beginPath();
  ctx.moveTo(startScreen.x, startScreen.y);
  ctx.lineTo(sx, sy);
  ctx.strokeStyle = CONFIG.previewStrokeColor;
  ctx.lineWidth = CONFIG.defaultLineWidth;
  ctx.stroke();
});

// ============================================================
// MOUSE UP — finish drawing, finish panning, or select a line.
// If the mouse didn't move (click without drag), try to select
// a line near the click point. Otherwise, save the new line.
// ============================================================
canvas.addEventListener("mouseup", function(event) {
  // End panning.
  if (isPanning) {
    isPanning = false;
    return;
  }

  if (!isDrawing) return;
  isDrawing = false;

  const { sx, sy } = getCanvasPos(event);
  const world = screenToWorld(sx, sy);

  if (!hasDragged) {
    // User clicked without dragging — try to select a line.
    // The click threshold is in screen pixels, so convert to world units.
    const clickThresholdWorld = CONFIG.clickThreshold / camera.zoom;
    let closestIndex = -1;
    let closestDist = Infinity;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const dist = distanceToLine(world.x, world.y, line.x1, line.y1, line.x2, line.y2);

      if (dist < closestDist) {
        closestDist = dist;
        closestIndex = i;
      }
    }

    // Select the line if it's within the threshold, otherwise deselect.
    if (closestDist <= clickThresholdWorld) {
      selectedLineIndex = closestIndex;
    } else {
      selectedLineIndex = -1;
    }

    redrawCanvas();
    return;
  }

  // User dragged — save the new line in world coordinates.
  lines.push({ x1: startWorldX, y1: startWorldY, x2: world.x, y2: world.y });

  // Deselect any previously selected line when drawing a new one.
  selectedLineIndex = -1;

  redrawCanvas();
});

// ============================================================
// WHEEL — zoom in/out at the mouse cursor position.
// Scrolling up zooms in, scrolling down zooms out.
// ============================================================
canvas.addEventListener("wheel", function(event) {
  event.preventDefault();

  const { sx, sy } = getCanvasPos(event);

  // deltaY is positive when scrolling down (zoom out).
  const direction = event.deltaY < 0 ? 1 : -1;
  const newZoom = camera.zoom * (1 + direction * CONFIG.wheelZoomStep);

  zoomAtPoint(newZoom, sx, sy);
}, { passive: false });

// ============================================================
// KEYBOARD — press Delete or Backspace to remove selected line.
// Scoped to the canvas element so it only fires when the canvas
// has focus. This prevents conflicts with browser navigation
// (e.g. Backspace triggering browser back). The canvas receives
// focus automatically on mousedown via canvas.focus().
// ============================================================
canvas.addEventListener("keydown", function(event) {
  if (event.key === "Delete" || event.key === "Backspace") {
    // Prevent the browser from navigating back on Backspace.
    event.preventDefault();

    if (selectedLineIndex === -1) return;

    // Remove the selected line from the array.
    lines.splice(selectedLineIndex, 1);
    selectedLineIndex = -1;

    redrawCanvas();
  }
});

// ============================================================
// Initial setup: size the canvas and draw.
// ============================================================
resizeCanvas();
updateZoomDisplay();

})();
