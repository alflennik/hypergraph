const canvas = document.getElementById("plane-1");
let ctx = "";
let isDrawing = false;

if (canvas.getContext) {
  ctx = canvas.getContext("2d");

} else {
  alert("Your browser does not support the canvas element.");
}

canvas.addEventListener("mousedown", function(event) {
  isDrawing = true;

  const rect = canvas.getBoundingClientRect();
  ctx.beginPath();
  ctx.moveTo(event.clientX - rect.left, event.clientY - rect.top);
});

canvas.addEventListener("mousemove", function(event) {
  if (!isDrawing) return;

  const rect = canvas.getBoundingClientRect();
  ctx.lineTo(event.clientX - rect.left, event.clientY - rect.top);
  ctx.stroke();
});

canvas.addEventListener("mouseup", function() {
  isDrawing = false;
});


// function draw();