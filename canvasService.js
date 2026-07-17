import iterateHypergraph from '/iterateHypergraph.js';

const createCanvasService = ({ canvas, context, hypergraph, nodeData }) => {
  const viewCoordinateTopLeft = { planeX: 0, planeY: 0 };

  // Only one set of coordinates need to be provided per function call: view coordinates or plane coordinates.
  const createCoordinate = ({ viewX, viewY, planeX, planeY, clientX, clientY }) => {
    if (planeX === undefined || planeY === undefined) {
      planeX = viewX - viewCoordinateTopLeft.planeX;
      planeY = viewY - viewCoordinateTopLeft.planeY;
    }

    return {
      planeX,
      planeY,
      clientX, // Only available in interactions
      clientY, // Only available in interactions
      get viewX() {
        return planeX + viewCoordinateTopLeft.planeX;
      },
      get viewY() {
        return planeY + viewCoordinateTopLeft.planeY;
      },
    };
  };

  const pan = ({ viewDeltaX, viewDeltaY }) => {
    // TODO: Account for zoom here when zooming is implemented.
    viewCoordinateTopLeft.planeX += viewDeltaX;
    viewCoordinateTopLeft.planeY += viewDeltaY;
  };

  const getViewDistance = (coordinate1, coordinate2) => {
    const deltaX = coordinate1.viewX - coordinate2.viewX;
    const deltaY = coordinate1.viewY - coordinate2.viewY;

    return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  };

  const findNodeAtCoordinate = (clickedCoordinate, { interactionType }) => {
    let clickedNode;
    iterateHypergraph(hypergraph, {
      nodeCallback: (node) => {
        const { coordinate } = nodeData.get(node);
        const distanceFromClicked = getViewDistance(clickedCoordinate, coordinate);

        const snappingThreshold = interactionType === 'touch' ? 25 : 10;
        if (distanceFromClicked < snappingThreshold) {
          clickedNode = node;
          return { stopIteration: true };
        }
      },
    });
    return clickedNode;
  };

  const drawPoint = (coordinate) => {
    context.save();
    context.beginPath();
    context.fillStyle = '#4ee238';
    context.shadowColor = '#81b47b';
    context.shadowBlur = 4;
    context.arc(coordinate.viewX, coordinate.viewY, 8, 0, 2 * Math.PI);
    context.fill();
    context.restore();

    context.save();
    context.beginPath();
    context.fillStyle = 'white';
    context.arc(coordinate.viewX, coordinate.viewY, 6, 0, 2 * Math.PI);
    context.fill();
    context.restore();
  };

  const drawLine = (startCoordinate, endCoordinate) => {
    context.save();
    context.beginPath();
    context.moveTo(startCoordinate.viewX, startCoordinate.viewY);
    context.lineTo(endCoordinate.viewX, endCoordinate.viewY);
    context.strokeStyle = '#a3f697';
    context.shadowColor = '#81b47b';
    context.lineWidth = 2;
    context.shadowBlur = 4;
    context.stroke();
    context.restore();
  };

  const drawSelectionBox = (startCoordinate, endCoordinate) => {
    const topLeftX = Math.min(startCoordinate.viewX, endCoordinate.viewX);
    const topLeftY = Math.min(startCoordinate.viewY, endCoordinate.viewY);
    const width = Math.abs(endCoordinate.viewX - startCoordinate.viewX);
    const height = Math.abs(endCoordinate.viewY - startCoordinate.viewY);

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
    context.arc(coordinate.viewX, coordinate.viewY, 12, 0, 2 * Math.PI);
    context.stroke();
    context.restore();
  };

  const getEventCoordinate = (event) => {
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

    return createCoordinate({
      viewX: clientX - currentSize.left,
      viewY: clientY - currentSize.top,
      clientX, // Needed for interactions (hand tool) that mutate the view
      clientY, // Needed for interactions (hand tool) that mutate the view
    });
  };

  return {
    getEventCoordinate,
    drawPoint,
    getViewDistance,
    drawLine,
    findNodeAtCoordinate,
    drawSelectionBox,
    drawPointSelection,
    createCoordinate,
    pan,
  };
};

export default createCanvasService;
