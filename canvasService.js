import iterateHypergraph from '/iterateHypergraph.js';

const createCanvasService = ({ canvas, context, hypergraph, nodeData }) => {
  const viewportCoordinateTopLeft = { planeX: 0, planeY: 0 };

  // Only one set of coordinates need to be provided per function call: viewport coordinates or plane coordinates.
  const createCoordinate = ({ viewportX, viewportY, planeX, planeY }) => {
    if (planeX === undefined || planeY === undefined) {
      planeX = viewportX - viewportCoordinateTopLeft.planeX;
      planeY = viewportY - viewportCoordinateTopLeft.planeY;
    }

    return {
      planeX,
      planeY,
      get viewportX() {
        return planeX - viewportCoordinateTopLeft.planeX;
      },
      get viewportY() {
        return planeY - viewportCoordinateTopLeft.planeY;
      },
    };
  };

  const pan = ({ viewportDeltaX, viewportDeltaY }) => {
    // TODO: Account for zoom here when zooming is implemented.
    viewportCoordinateTopLeft.planeX -= viewportDeltaX;
    viewportCoordinateTopLeft.planeY -= viewportDeltaY;
  };

  const getViewportDistance = (coordinate1, coordinate2) => {
    const deltaX = coordinate1.viewportX - coordinate2.viewportX;
    const deltaY = coordinate1.viewportY - coordinate2.viewportY;

    return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  };

  const findNodeAtCoordinate = (clickedCoordinate, { interactionType }) => {
    let clickedNode;
    iterateHypergraph(hypergraph, {
      nodeCallback: (node) => {
        const { coordinate } = nodeData.get(node);
        const distanceFromClicked = getViewportDistance(
          clickedCoordinate,
          coordinate,
        );

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
    context.arc(coordinate.viewportX, coordinate.viewportY, 8, 0, 2 * Math.PI);
    context.fill();
    context.restore();

    context.save();
    context.beginPath();
    context.fillStyle = 'white';
    context.arc(coordinate.viewportX, coordinate.viewportY, 6, 0, 2 * Math.PI);
    context.fill();
    context.restore();
  };

  const drawLine = (startCoordinate, endCoordinate) => {
    context.save();
    context.beginPath();
    context.moveTo(startCoordinate.viewportX, startCoordinate.viewportY);
    context.lineTo(endCoordinate.viewportX, endCoordinate.viewportY);
    context.strokeStyle = '#a3f697';
    context.shadowColor = '#81b47b';
    context.lineWidth = 2;
    context.shadowBlur = 4;
    context.stroke();
    context.restore();
  };

  const drawSelectionBox = (startCoordinate, endCoordinate) => {
    const topLeftX = Math.min(
      startCoordinate.viewportX,
      endCoordinate.viewportX,
    );
    const topLeftY = Math.min(
      startCoordinate.viewportY,
      endCoordinate.viewportY,
    );
    const width = Math.abs(endCoordinate.viewportX - startCoordinate.viewportX);
    const height = Math.abs(
      endCoordinate.viewportY - startCoordinate.viewportY,
    );

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
    context.arc(coordinate.viewportX, coordinate.viewportY, 12, 0, 2 * Math.PI);
    context.stroke();
    context.restore();
  };

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

    return createCoordinate({
      viewportX: clientX - currentSize.left,
      viewportY: clientY - currentSize.top,
    });
  };

  return {
    getEventCoordinate,
    drawPoint,
    getViewportDistance,
    drawLine,
    findNodeAtCoordinate,
    drawSelectionBox,
    drawPointSelection,
    createCoordinate,
    pan,
  };
};

export default createCanvasService;
