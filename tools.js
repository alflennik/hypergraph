const createTools = ({ hypergraph, canvasService, redrawCanvas, nodeData }) => {
  const tools = {
    lineTool: {
      draggingFromNode: (startNode, endCoordinate) => {
        redrawCanvas();

        const { coordinate: startCoordinate } = nodeData.get(startNode);

        canvasService.drawLine(startCoordinate, endCoordinate);
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
        nodeData.set(startNode, {
          ...startNodeData,
          coordinate: endCoordinate,
        });

        redrawCanvas();
      },
      draggedFromNode: () => {
        // Save history state once undo/redo is implemented.
      },
      draggingFromEmptyCanvas: (startCoordinate, endCoordinate) => {
        redrawCanvas();

        canvasService.drawSelectionBox(startCoordinate, endCoordinate);
      },
      draggedFromEmptyCanvas: (startCoordinate, endCoordinate) => {
        const left = Math.min(startCoordinate.x, endCoordinate.x);
        const right = Math.max(startCoordinate.x, endCoordinate.x);
        const top = Math.min(startCoordinate.y, endCoordinate.y);
        const bottom = Math.max(startCoordinate.y, endCoordinate.y);

        iterateHypergraph(hypergraph, {
          nodeCallback: (node) => {
            const { coordinate } = nodeData.get(node);

            if ((coordinate.x > left && coordinate.x < right) && (coordinate.y > top && coordinate.y < bottom)) {
              
            }
          },
        });

        redrawCanvas();
      },
    },
  };

  let currentTool = tools.lineTool;

  const palette = document.querySelector('.palette');
  const buttons = Array.from(palette.querySelectorAll('button'));

  buttons.forEach((button) => {
    button.addEventListener('click', (event) => {
      const toolName = event.target
        .closest('button')
        .getAttribute('data-tool-name');
      currentTool = tools[toolName];

      palette.querySelector('.selected').classList.remove('selected');
      button.classList.add('selected');
    });
  });

  const getCurrentTool = () => currentTool;

  return { getCurrentTool };
};

export default createTools;
