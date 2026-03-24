const canvas = document.getElementById("plane-1");
let ctx = "";
let isDrawing = false;
let startX = "";
let startY = "";
let snapshot = "";

if (canvas.getContext) {
  ctx = canvas.getContext("2d");

} else {
  alert("Your browser does not support the canvas element.");
}

canvas.addEventListener("mousedown", function(event) {
  isDrawing = true;

  const rect = canvas.getBoundingClientRect();

  // Free Hand:
  // ctx.beginPath();
  // ctx.moveTo(event.clientX - rect.left, event.clientY - rect.top);

  startX = event.clientX - rect.left;
  startY = event.clientY - rect.top;

  snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
});

canvas.addEventListener("mousemove", function(event) {
  if (!isDrawing) return;

  const rect = canvas.getBoundingClientRect();

  // Free Hand:
  // ctx.lineTo(event.clientX - rect.left, event.clientY - rect.top);
  // ctx.stroke();

  const currentX = event.clientX - rect.left;
  const currentY = event.clientY - rect.top;

  ctx.putImageData(snapshot, 0, 0);

  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(currentX, currentY);
  ctx.stroke();
});

canvas.addEventListener("mouseup", function() {
  isDrawing = false;
});


// function draw();