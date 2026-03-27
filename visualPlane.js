const canvas = document.getElementById("plane-1");
let ctx = "";
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
      ctx.strokeStyle = "red";
      ctx.lineWidth = 3;
    } else {
      ctx.strokeStyle = "black";
      ctx.lineWidth = 1;
    }

    ctx.stroke();
  }

  // Reset stroke style back to default after drawing.
  ctx.strokeStyle = "black";
  ctx.lineWidth = 1;
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

  hasDragged = true;

  const rect = canvas.getBoundingClientRect();
  const currentX = event.clientX - rect.left;
  const currentY = event.clientY - rect.top;

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
    const clickThreshold = 8; // Max pixel distance to count as "on the line".
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
// ============================================================
document.addEventListener("keydown", function(event) {
  if (event.key === "Delete" || event.key === "Backspace") {
    if (selectedLineIndex === -1) return;

    // Remove the selected line from the array.
    lines.splice(selectedLineIndex, 1);
    selectedLineIndex = -1;

    redrawCanvas();
  }
});