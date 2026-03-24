const canvas = document.getElementById("plane-1");
var ctx = "";

if (canvas.getContext) {
  ctx = canvas.getContext("2d");

} else {
  alert("Your browser does not support the canvas element.");
}

draw();