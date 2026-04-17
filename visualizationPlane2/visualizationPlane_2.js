// const createGraph = require('../hypergraph');
// const graph = createGraph();
import createGraph from '../hypergraph.js';

const graph = createGraph();

(() => {
  const canvas = document.getElementById("plane-1");
  const ctx = canvas.getContext("2d");

  // ctx.fillStyle = "red";
  // ctx.fillRect(20, 20, 300, 200);

  ctx.fillStyle = "green";
  ctx.fillRect(10, 10, 150, 100);
})();