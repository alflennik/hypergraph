import createHypergraph from '/hypergraph.js';
import createTools from '/tools.js';
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

  const hypergraph = createHypergraph();
  const canvasService = createCanvasService({ canvas, context, hypergraph, nodeData });
  const interactionService = createInteractionService({ canvas, canvasService });

  (() => {
    nodeData.set(hypergraph.getNexus(), {
      coordinate: canvasService.createCoordinate({
        viewX: canvasService.getWidth() / 2,
        viewY: canvasService.getHeight() / 2,
      }),
    });
  })();

  // TEMP
  window.devicePixelRatio = 2;

  const redrawCanvas = () => {
    context.reset();
    
    // Enable retina support
    // context.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);

    // const currentSize = canvas.getBoundingClientRect();
    canvas.width = canvasService.getWidth();
    canvas.height = canvasService.getHeight();
    // canvas.width = currentSize.width;
    // canvas.height = currentSize.height;
    // canvas.width = currentSize.width * 2;
    // canvas.height = currentSize.height * 2;

    iterateHypergraph(hypergraph, {
      nodeCallback: (node) => {
        const { coordinate, isSelected } = nodeData.get(node);
        canvasService.drawPoint(coordinate);

        if (isSelected) {
          canvasService.drawPointSelection(coordinate);
        }
      },
      edgeCallback: (node1, node2) => {
        const { coordinate: startCoordinate } = nodeData.get(node1);
        const { coordinate: endCoordinate } = nodeData.get(node2);

        canvasService.drawLine(startCoordinate, endCoordinate);
      },
    });
  };

  const tools = createTools({ hypergraph, canvasService, redrawCanvas, nodeData });

  interactionService.clickedAnywhere((coordinate) => {
    tools.getCurrentTool().clickedAnywhere?.(coordinate);
  });

  interactionService.clickedEmptyCanvas((coordinate) => {
    tools.getCurrentTool().clickedEmptyCanvas?.(coordinate);
  });

  interactionService.clickedNode((node) => {
    tools.getCurrentTool().clickedNode?.(node);
  });

  interactionService.draggingAnywhere((startCoordinate, endCoordinate, options) => {
    tools.getCurrentTool().draggingAnywhere?.(startCoordinate, endCoordinate, options);
  });

  interactionService.draggingAnywhereCanceled((startCoordinate, endCoordinate, options) => {
    tools.getCurrentTool().draggingAnywhereCanceled?.(startCoordinate, endCoordinate, options);
  });

  interactionService.draggingFromNode((startNode, endCoordinate) => {
    tools.getCurrentTool().draggingFromNode?.(startNode, endCoordinate);
  });

  interactionService.draggingFromNodeCanceled((startNode, endCoordinate) => {
    tools.getCurrentTool().draggingFromNodeCanceled?.(startNode, endCoordinate);
  });

  interactionService.draggedFromNode((startNode, endCoordinate) => {
    tools.getCurrentTool().draggedFromNode?.(startNode, endCoordinate);
  });

  interactionService.draggingBetweenNodes((startNode, endNode) => {
    tools.getCurrentTool().draggingBetweenNodes?.(startNode, endNode);
  });

  interactionService.draggedBetweenNodes((startNode, endNode) => {
    tools.getCurrentTool().draggedBetweenNodes?.(startNode, endNode);
  });

  interactionService.draggingFromEmptyCanvas((startCoordinate, endCoordinate) => {
    tools.getCurrentTool().draggingFromEmptyCanvas?.(startCoordinate, endCoordinate);
  });

  interactionService.draggingFromEmptyCanvasCanceled((startCoordinate, endCoordinate) => {
    tools.getCurrentTool().draggingFromEmptyCanvasCanceled?.(startCoordinate, endCoordinate);
  });

  interactionService.draggedFromEmptyCanvas((startCoordinate, endCoordinate) => {
    tools.getCurrentTool().draggedFromEmptyCanvas?.(startCoordinate, endCoordinate);
  });

  window.addEventListener('resize', () => {
    redrawCanvas();
  });

  redrawCanvas();
};

createVisualizationPlane();
