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
  defaultLineWidth: 1,           // Stroke width for normal lines (px).
  selectedLineWidth: 3,          // Stroke width for the selected line (px).
  clickThreshold: 8,             // Max distance (px) from a line to count as a click on it.
  dragThreshold: 15,             // Min distance (px) mouse must move to count as a drag.
};

const canvas = document.getElementById("plane-1");
let ctx = null;
let isDrawing = false;
let startX = 0;
let startY = 0;

// Array to store all drawn lines as { x1, y1, x2, y2 } objects.
let lines = [];

// Index of the currently selected line (-1 means nothing selected).
let selectedLineIndex = -1;

// Track whether the mouse moved during a click (to distinguish click vs drag).
let hasDragged = false;

if (canvas.getContext) {
  ctx = canvas.getContext("2d");
} else {
  alert("Your browser does not support the canvas element.");
}

// Guard: stop here if the canvas context is not available.
// Without a valid context, none of the drawing or event code will work.
if (!ctx) return;

// ============================================================
// Redraw all lines from the lines array.
// Clears the entire canvas first, then draws each stored line.
// The selected line is drawn in red so the user can see it.
// ============================================================
function redrawCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    ctx.beginPath();
    ctx.moveTo(line.x1, line.y1);
    ctx.lineTo(line.x2, line.y2);

    // Highlight the selected line in red, all others in black.
    if (i === selectedLineIndex) {
      ctx.strokeStyle = CONFIG.selectedStrokeColor;
      ctx.lineWidth = CONFIG.selectedLineWidth;
    } else {
      ctx.strokeStyle = CONFIG.defaultStrokeColor;
      ctx.lineWidth = CONFIG.defaultLineWidth;
    }

    ctx.stroke();
  }

  // Reset stroke style back to default after drawing.
  ctx.strokeStyle = CONFIG.defaultStrokeColor;
  ctx.lineWidth = CONFIG.defaultLineWidth;
}

// ============================================================
// Calculate the shortest distance from a point (px, py) to a
// line segment defined by (x1, y1) -> (x2, y2).
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
// MOUSE DOWN — start drawing a new line.
// ============================================================
canvas.addEventListener("mousedown", function(event) {
  // Focus the canvas so it can receive keyboard events (e.g. Delete/Backspace).
  canvas.focus();

  isDrawing = true;
  hasDragged = false;

  const rect = canvas.getBoundingClientRect();
  startX = event.clientX - rect.left;
  startY = event.clientY - rect.top;
});

// ============================================================
// MOUSE MOVE — show a live preview of the line being drawn.
// ============================================================
canvas.addEventListener("mousemove", function(event) {
  if (!isDrawing) return;

  const rect = canvas.getBoundingClientRect();
  const currentX = event.clientX - rect.left;
  const currentY = event.clientY - rect.top;

  // Only count as a drag if the mouse moved past the threshold from the start.
  // This prevents tiny accidental jitter during a click from committing
  // an unintended short line segment.
  const dragThreshold = CONFIG.dragThreshold;
  const dx = currentX - startX;
  const dy = currentY - startY;
  if (!hasDragged && Math.sqrt(dx * dx + dy * dy) < dragThreshold) return;

  hasDragged = true;

  // Redraw all existing lines, then draw the preview line on top.
  redrawCanvas();
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(currentX, currentY);
  ctx.stroke();
});

// ============================================================
// MOUSE UP — finish drawing or select a line.
// If the mouse didn't move (click without drag), try to select
// a line near the click point. Otherwise, save the new line.
// ============================================================
canvas.addEventListener("mouseup", function(event) {
  if (!isDrawing) return;
  isDrawing = false;

  const rect = canvas.getBoundingClientRect();
  const endX = event.clientX - rect.left;
  const endY = event.clientY - rect.top;

  if (!hasDragged) {
    // User clicked without dragging — try to select a line.
    const clickThreshold = CONFIG.clickThreshold;
    let closestIndex = -1;
    let closestDist = Infinity;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const dist = distanceToLine(endX, endY, line.x1, line.y1, line.x2, line.y2);

      if (dist < closestDist) {
        closestDist = dist;
        closestIndex = i;
      }
    }

    // Select the line if it's within the threshold, otherwise deselect.
    if (closestDist <= clickThreshold) {
      selectedLineIndex = closestIndex;
    } else {
      selectedLineIndex = -1;
    }

    redrawCanvas();
    return;
  }

  // User dragged — save the new line.
  lines.push({ x1: startX, y1: startY, x2: endX, y2: endY });

  // Deselect any previously selected line when drawing a new one.
  selectedLineIndex = -1;

  redrawCanvas();
});

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

})();
