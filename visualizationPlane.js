import createHypergraph from "/hypergraph.js";
import "/tools.js"
import createInteractionService from "/interactionService.js"
import createCanvasService from "/canvasService.js"
// getNexus,
// createNode,
// createEdge,
// getEdges,
// deleteEdge,
// nodeConnect

const createVisualizationPlane = () => {
  const canvas = document.querySelector('canvas');
  const context = canvas.getContext("2d");

  const canvasService = createCanvasService({canvas, context});
  const interactionService = createInteractionService({canvas, canvasService});

  let points = [{ x: 100, y: 50 }];

  const redrawCanvas = () => {
    const currentSize = canvas.getBoundingClientRect();
    canvas.width = currentSize.width;
    canvas.height = currentSize.height;

    points.forEach((point) => {
      canvasService.drawPoint(point.x, point.y);
    });
  };

  interactionService.clickedAnywhere(({x, y}) => {
    points.push({ x, y });
    redrawCanvas();
  });

  window.addEventListener('resize', () => {
    redrawCanvas();
  });

  redrawCanvas();


}

createVisualizationPlane();


