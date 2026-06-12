import createHypergraph from '/hypergraph.js';
import '/tools.js';
import createInteractionService from '/interactionService.js';
import createCanvasService from '/canvasService.js';
import iterateHypergraph from '/iterateHypergraph.js';
// getNexus,
// createNode,
// createEdge,
// getEdges,
// deleteEdge,
// nodeConnect

const createVisualizationPlane = () => {
  const canvas = document.querySelector('canvas');
  const context = canvas.getContext('2d');
  const nodeData = new WeakMap();

  // SERVICES
  const hypergraph = createHypergraph();
  const canvasService = createCanvasService({ canvas, context, hypergraph, nodeData });
  const interactionService = createInteractionService({
    canvas,
    canvasService,
  });


  (() => {
    const currentSize = canvas.getBoundingClientRect();
    nodeData.set(hypergraph.getNexus(), {
      coordinate: { x: currentSize.width / 2, y: currentSize.height / 2 },
    });
  })();

  const redrawCanvas = () => {
    context.reset();

    const currentSize = canvas.getBoundingClientRect();
    canvas.width = currentSize.width;
    canvas.height = currentSize.height;

    iterateHypergraph(hypergraph, {
      nodeCallback: (node) => {
        const { coordinate } = nodeData.get(node);
        canvasService.drawPoint(coordinate.x, coordinate.y);
      },
      edgeCallback: (node1, node2) => {
        const { coordinate: startCoordinate} = nodeData.get(node1);
        const { coordinate: endCoordinate } = nodeData.get(node2);

        canvasService.drawLine(startCoordinate, endCoordinate);
      },
    });
  };

  interactionService.draggingFromNode((startNode, endCoordinate) => {
    redrawCanvas();

    const { coordinate: startCoordinate } = nodeData.get(startNode);

    canvasService.drawLine(startCoordinate, endCoordinate);
  });

  interactionService.draggedFromNode((startNode, endCoordinate) => {
    const node = hypergraph.createEdgeFrom(startNode);

    nodeData.set(node, { coordinate: endCoordinate });

    redrawCanvas();
  });

  interactionService.draggingBetweenNodes((startNode, endNode) => {
    redrawCanvas();

    const { coordinate: startCoordinate } = nodeData.get(startNode);
    const { coordinate: endCoordinate } = nodeData.get(endNode);

    canvasService.drawLine(startCoordinate, endCoordinate);
  });

  interactionService.draggedBetweenNodes((startNode, endNode) => {
    hypergraph.createEdgeBetween(startNode, endNode);

    redrawCanvas();
  });

  window.addEventListener('resize', () => {
    redrawCanvas();
  });

  redrawCanvas();
};

createVisualizationPlane();
