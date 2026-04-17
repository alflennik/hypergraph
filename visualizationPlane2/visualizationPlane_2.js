// const createGraph = require('../hypergraph');
// const graph = createGraph();
import createGraph from '../hypergraph.js';

const graph = createGraph();

const canvas = document.getElementById("plane-1");
let context = null;

if (canvas) {
  context = canvas.getContext("2d");
} else {
  alert("The canvas element is not available. Drawing cannot proceed.");

  throw new Error("The canvas element is not available. Drawing cannot proceed.");
}

if (context) {
// CANVAS CENTER:
// canvas.width = canvas.clientWidth;
// canvas.height = canvas.clientHeight;
const canvasCenterX = canvas.width / 2;
const canvasCenterY = canvas.height / 2;

const nodes = [];

context.fillStyle = "red";
context.fillRect(canvasCenterX - 20, canvasCenterY - 20, 20, 20);

context.fillStyle = "green";
context.fillRect(canvasCenterX - 20 / 2, canvasCenterY - 20 / 2, 20, 20);
// ctx.fillRect(5, 50, 20, 20);
} else {
  alert("A context plane cannot be found. Drawing cannot proceed.");

  throw new Error("A context plane cannot be found. Drawing cannot proceed.");
}