import createHypergraph from "/hypergraph.js";
import "/tools.js"
import createInteractionService from "/interactionService.js"
// getNexus,
// createNode,
// createEdge,
// getEdges,
// deleteEdge,
// nodeConnect

const createVisualizationPlane = () => {
  const canvas = document.querySelector('canvas');
  const context = canvas.getContext("2d");

  const interactionService = createInteractionService({canvas});

  let points = [{ x: 100, y: 50 }];

  const drawPoint = (x, y,) => {
    context.beginPath();
    context.shadowColor = "red";
    context.shadowBlur = 15;
    context.arc(x, y, 10, 0, 2 * Math.PI);
    context.fillStyle = "red";
    context.fill();
    // context.stroke();
  };

  const redrawCanvas = () => {
    const currentSize = canvas.getBoundingClientRect();
    canvas.width = currentSize.width;
    canvas.height = currentSize.height;

    points.forEach((point) => {
      drawPoint(point.x, point.y);
    });
  };
  // const { viewportX, viewportY } = getCanvasPos(event);
  interactionService.clickedEmptyCanvas(({x, y}) => {
    // points.push({ x, y });
    points.push({ x, y });
    redrawCanvas();
  });

  window.addEventListener('resize', () => {
    redrawCanvas();
  });

  redrawCanvas();


}

createVisualizationPlane();


