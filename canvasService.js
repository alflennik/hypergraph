import iterateHypergraph from '/iterateHypergraph.js';

const createCanvasService = ({ canvas, context, hypergraph, nodeData }) => {
  const getDistance = (coordinate1, coordinate2) => {
    const deltaX = coordinate1.x - coordinate2.x;
    const deltaY = coordinate1.y - coordinate2.y;

    return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  };

  const findNodeAtCoordinate = (clickedCoordinate) => {
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
    context.fillStyle = '#4ee238';
    context.shadowColor = '#81b47b';
    context.shadowBlur = 4;
    context.arc(x, y, 8, 0, 2 * Math.PI);
    context.fill();
    
    context.beginPath();
    context.fillStyle = 'white';
    context.shadowBlur = 0;
    context.arc(x, y, 6, 0, 2 * Math.PI);
    context.fill();
  };

  const drawLine = (startCoordinate, endCoordinate) => {
    context.beginPath();
    context.moveTo(startCoordinate.x, startCoordinate.y);
    context.lineTo(endCoordinate.x, endCoordinate.y);
    context.strokeStyle = '#a3f697';
    context.shadowColor = '#81b47b';
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
    findNodeAtCoordinate,
  };
};

export default createCanvasService;
