import createHypergraph from "/hypergraph.js";
import "/tools.js"
import createInteractionService from "/interactionService.js"
import createCanvasService from "/canvasService.js"
import iterateHypergraph from "/iterateHypergraph.js"
// getNexus,
// createNode,
// createEdge,
// getEdges,
// deleteEdge,
// nodeConnect

const createVisualizationPlane = () => {
  const canvas = document.querySelector('canvas');
  const context = canvas.getContext("2d");

  // SERVICES
  const canvasService = createCanvasService({ canvas, context });
  const interactionService = createInteractionService({ canvas, canvasService });
  const hypergraph = createHypergraph();

  const nodeData = new WeakMap();
  nodeData.set(hypergraph.getNexus(), {coordinates: {x: 200, y: 200}});

  const redrawCanvas = () => {
    context.reset();

    const currentSize = canvas.getBoundingClientRect();
    canvas.width = currentSize.width;
    canvas.height = currentSize.height;

    iterateHypergraph(hypergraph, {
      nodeCallback: (node) => {
        const {coordinates} = nodeData.get(node);
        canvasService.drawPoint(coordinates.x, coordinates.y);
      },
      edgeCallback: (node1, node2) => {
        const {coordinates: startCoordinates} = nodeData.get(node1);
        const {coordinates: endCoordinates} = nodeData.get(node2);

        canvasService.drawLine(startCoordinates, endCoordinates);
      }
    });
  };

  interactionService.draggingAnywhere((startCoordinates, endCoordinates) => {
    redrawCanvas();

    canvasService.drawLine(startCoordinates, endCoordinates);
  });

  interactionService.draggedAnywhere((startCoordinates, endCoordinates) => {
    const node = hypergraph.createEdgeFrom(hypergraph.getNexus());

    // TEMPORARY HACK
    nodeData.set(hypergraph.getNexus(), { coordinates: startCoordinates });
    nodeData.set(node, { coordinates: endCoordinates });

    redrawCanvas();
  });



  window.addEventListener('resize', () => {
    redrawCanvas();
  });

  redrawCanvas();


}

createVisualizationPlane();


