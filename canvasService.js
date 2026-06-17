import iterateHypergraph from '/iterateHypergraph.js';

const createCanvasService = ({ canvas, context, hypergraph, nodeData }) => {
  const getDistance = (coordinate1, coordinate2) => {
    const deltaX = coordinate1.x - coordinate2.x;
    const deltaY = coordinate1.y - coordinate2.y;

    return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  };

  const findNodeAtCoordinate = (clickedCoordinate, { interactionType }) => {
    let clickedNode;
    iterateHypergraph(hypergraph, {
      nodeCallback: (node) => {
        const { coordinate } = nodeData.get(node);
        const distanceFromClicked = getDistance(clickedCoordinate, coordinate);

        const snappingThreshold = interactionType === 'touch' ? 25 : 10;
        if (distanceFromClicked < snappingThreshold) {
          clickedNode = node;
          return { stopIteration: true };
        }
      },
    });
    return clickedNode;
  };

  const drawPoint = (x, y) => {
    context.save();
    context.beginPath();
    context.fillStyle = '#4ee238';
    context.shadowColor = '#81b47b';
    context.shadowBlur = 4;
    context.arc(x, y, 8, 0, 2 * Math.PI);
    context.fill();
    context.restore();

    context.save();
    context.beginPath();
    context.fillStyle = 'white';
    context.arc(x, y, 6, 0, 2 * Math.PI);
    context.fill();
    context.restore();
  };

  const drawLine = (startCoordinate, endCoordinate) => {
    context.save();
    context.beginPath();
    context.moveTo(startCoordinate.x, startCoordinate.y);
    context.lineTo(endCoordinate.x, endCoordinate.y);
    context.strokeStyle = '#a3f697';
    context.shadowColor = '#81b47b';
    context.lineWidth = 2;
    context.shadowBlur = 4;
    context.stroke();
    context.restore();
  };

  const drawSelectionBox = (startCoordinate, endCoordinate) => {
    const topLeftX = Math.min(startCoordinate.x, endCoordinate.x);
    const topLeftY = Math.min(startCoordinate.y, endCoordinate.y);
    const width = Math.abs(endCoordinate.x - startCoordinate.x);
    const height = Math.abs(endCoordinate.y - startCoordinate.y);

    context.save();
    context.beginPath();
    context.rect(topLeftX, topLeftY, width, height);
    context.setLineDash([6]);
    context.strokeStyle = 'white';
    context.stroke();
    context.restore();

  };

  const drawPointSelection = (coordinate) => {
    context.save();
    context.beginPath();
    context.strokeStyle = 'white';
    context.lineWidth = 2;
    context.arc(coordinate.x, coordinate.y, 12, 0, 2 * Math.PI);
    context.stroke();
    context.restore();
  }

  const getEventCoordinate = (event) => {
    // const {clientX, clientY} = event.touches ? event.touches[0] : event;
    let clientX;
    let clientY;
    if (event.changedTouches) {
      clientX = event.changedTouches[0].clientX;
      clientY = event.changedTouches[0].clientY;
    } else if (event.touches) {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else {
      clientX = event.clientX;
      clientY = event.clientY;
    }

    const currentSize = canvas.getBoundingClientRect();

    return {
      x: clientX - currentSize.left,
      y: clientY - currentSize.top,
    };
  };

  return {
    getEventCoordinate,
    drawPoint,
    getDistance,
    drawLine,
    findNodeAtCoordinate,
    drawSelectionBox,
    drawPointSelection,
  };
};

export default createCanvasService;
