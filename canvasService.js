import iterateHypergraph from '/iterateHypergraph.js';

const createCanvasService = ({ canvas, context, hypergraph, nodeData }) => {
  const getDistance = (coordinate1, coordinate2) => {
    const deltaX = coordinate1.x - coordinate2.x;
    const deltaY = coordinate1.y - coordinate2.y;

    return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  };

  const findClickedNode = (clickedCoordinate) => {
    let clickedNode;
    iterateHypergraph(hypergraph, {
      nodeCallback: (node) => {
        const { coordinate } = nodeData.get(node);
        const distanceFromClicked = getDistance(clickedCoordinate, coordinate);

        if (distanceFromClicked < 10) {
          clickedNode = node;
          return {stopIteration: true}
        }
      }
    });
    return clickedNode;
  };

  const drawPoint = (x, y) => {
    context.beginPath();
    context.fillStyle = '#50dc3b';
    context.shadowColor = '#a3f697';
    context.shadowBlur = 3;
    context.arc(x, y, 4, 0, 2 * Math.PI);
    context.fill();
  };

  const drawLine = (startCoordinate, endCoordinate) => {
    context.beginPath();
    context.moveTo(startCoordinate.x, startCoordinate.y);
    context.lineTo(endCoordinate.x, endCoordinate.y);
    context.strokeStyle = '#a3f697';
    context.shadowColor = '#a6bfa3';

    context.lineWidth = 2;
    context.shadowBlur = 4;
    context.stroke();
  };

  const getEventCoordinate = (event) => {
    const currentSize = canvas.getBoundingClientRect();
    return {
      x: event.clientX - currentSize.left,
      y: event.clientY - currentSize.top,
    };
  };

  return {
    getEventCoordinate,
    drawPoint,
    getDistance,
    drawLine,
    findClickedNode,
  };
};

export default createCanvasService;
