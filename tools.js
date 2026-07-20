import iterateHypergraph from './iterateHypergraph.js';

const createTools = ({ hypergraph, canvasService, redrawCanvas, nodeData }) => {
  const tools = {
    lineTool: {
      draggingFromNode: (startNode, endCoordinate) => {
        redrawCanvas();

        const { coordinate: startCoordinate } = nodeData.get(startNode);

        canvasService.drawLine(startCoordinate, endCoordinate);
      },
      draggingFromNodeCanceled: () => {
        redrawCanvas();
      },
      draggedFromNode: (startNode, endCoordinate) => {
        const node = hypergraph.createEdgeFrom(startNode);

        nodeData.set(node, { coordinate: endCoordinate });

        redrawCanvas();
      },
      draggingBetweenNodes: (startNode, endNode) => {
        redrawCanvas();

        const { coordinate: startCoordinate } = nodeData.get(startNode);
        const { coordinate: endCoordinate } = nodeData.get(endNode);

        canvasService.drawLine(startCoordinate, endCoordinate);
      },
      draggedBetweenNodes: (startNode, endNode) => {
        hypergraph.createEdgeBetween(startNode, endNode);

        redrawCanvas();
      },
    },
    moveTool: {
      draggingFromNode: (startNode, endCoordinate) => {
        const startNodeData = nodeData.get(startNode);
        const { coordinate: startCoordinate } = startNodeData;

        nodeData.set(startNode, { ...startNodeData, isSelected: true });

        const deltaX = startCoordinate.planeX - endCoordinate.planeX;
        const deltaY = startCoordinate.planeY - endCoordinate.planeY;

        iterateHypergraph(hypergraph, {
          nodeCallback: (node) => {
            const currentNodeData = nodeData.get(node);
            const { coordinate, isSelected } = currentNodeData;

            if (isSelected) {
              nodeData.set(node, {
                ...currentNodeData,
                coordinate: canvasService.createCoordinate({
                  planeX: coordinate.planeX - deltaX,
                  planeY: coordinate.planeY - deltaY,
                }),
              });
            }
          },
        });

        redrawCanvas();
      },
      draggedFromNode: () => {
        // Save history state once undo/redo is implemented.
      },
      draggingFromNodeCanceled: () => {
        // Save history state once undo/redo is implemented.
      },
      draggingFromEmptyCanvas: (startCoordinate, endCoordinate) => {
        redrawCanvas();

        canvasService.drawSelectionBox(startCoordinate, endCoordinate);
      },
      draggingFromEmptyCanvasCanceled: () => {
        redrawCanvas();
      },
      draggedFromEmptyCanvas: (startCoordinate, endCoordinate) => {
        const left = Math.min(startCoordinate.planeX, endCoordinate.planeX);
        const right = Math.max(startCoordinate.planeX, endCoordinate.planeX);
        const top = Math.min(startCoordinate.planeY, endCoordinate.planeY);
        const bottom = Math.max(startCoordinate.planeY, endCoordinate.planeY);

        iterateHypergraph(hypergraph, {
          nodeCallback: (node) => {
            const currentNodeData = nodeData.get(node);
            const { coordinate } = currentNodeData;

            if (
              coordinate.planeX > left &&
              coordinate.planeX < right &&
              coordinate.planeY > top &&
              coordinate.planeY < bottom
            ) {
              nodeData.set(node, { ...currentNodeData, isSelected: true });
            } else {
              nodeData.set(node, { ...currentNodeData, isSelected: false });
            }
          },
        });

        redrawCanvas();
      },
      clickedEmptyCanvas: () => {
        iterateHypergraph(hypergraph, {
          nodeCallback: (node) => {
            const currentNodeData = nodeData.get(node);
            nodeData.set(node, { ...currentNodeData, isSelected: false });
          },
        });

        redrawCanvas();
      },
      clickedNode: (node) => {
        const currentNodeData = nodeData.get(node);

        const isSelected = !currentNodeData.isSelected;
        nodeData.set(node, { ...currentNodeData, isSelected });

        redrawCanvas();
      },
    },
    handTool: {
      draggingAnywhere: (startCoordinate, endCoordinate, { incrementalChange }) => {
        canvasService.pan({
          planeDeltaX: incrementalChange.planeDeltaX,
          planeDeltaY: incrementalChange.planeDeltaY,
        });

        redrawCanvas();
      },
    },
    zoomInTool: {},
    zoomOutTool: {},
    eraserTool: {},
  };

  let currentTool = tools.lineTool;

  const palette = document.querySelector('.palette');
  const buttons = Array.from(palette.querySelectorAll('button'));

  buttons.forEach((button) => {
    button.addEventListener('click', (event) => {
      const toolName = event.target.closest('button').getAttribute('data-tool-name');
      currentTool = tools[toolName];

      palette.querySelector('.selected').classList.remove('selected');
      button.classList.add('selected');
    });
  });

  const getCurrentTool = () => currentTool;

  return { getCurrentTool };
};

export default createTools;
