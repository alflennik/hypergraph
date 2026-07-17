import iterateHypergraph from '/iterateHypergraph.js';

const createCanvasService = ({ canvas, context, hypergraph, nodeData }) => {
  const viewCoordinateTopLeft = { worldX: 0, worldY: 0 };

  // Only one set of coordinates need to be provided per function call: plane coordinates or canvas coordinates.
  const createCoordinate = ({ worldX, worldY, viewX, viewY, }) => {
    if (worldX === undefined || worldY === undefined) {
      worldX = viewX - viewCoordinateTopLeft.worldX;
      worldY = viewY - viewCoordinateTopLeft.worldY;
    }

    return {
      canvasX,
      canvasY,
      get planeX() {
        return canvasX - planeCoordinateTopLeft.canvasX;
      },
      get planeY() {
        return canvasY - planeCoordinateTopLeft.canvasY;
      },
    };
  };

  const pan = ({ planeDeltaX, planeDeltaY }) => {
    // TODO: Account for zoom here when zooming is implemented.
    planeCoordinateTopLeft.canvasX -= planeDeltaX;
    planeCoordinateTopLeft.canvasY -= planeDeltaY;
  };

  const getPlaneDistance = (coordinate1, coordinate2) => {
    const deltaX = coordinate1.planeX - coordinate2.planeX;
    const deltaY = coordinate1.planeY - coordinate2.planeY;

    return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  };

  const findNodeAtCoordinate = (clickedCoordinate, { interactionType }) => {
    let clickedNode;
    iterateHypergraph(hypergraph, {
      nodeCallback: (node) => {
        const { coordinate } = nodeData.get(node);
        const distanceFromClicked = getPlaneDistance(
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
    context.arc(coordinate.planeX, coordinate.planeY, 8, 0, 2 * Math.PI);
    context.fill();
    context.restore();

    context.save();
    context.beginPath();
    context.fillStyle = 'white';
    context.arc(coordinate.planeX, coordinate.planeY, 6, 0, 2 * Math.PI);
    context.fill();
    context.restore();
  };

  const drawLine = (startCoordinate, endCoordinate) => {
    context.save();
    context.beginPath();
    context.moveTo(startCoordinate.planeX, startCoordinate.planeY);
    context.lineTo(endCoordinate.planeX, endCoordinate.planeY);
    context.strokeStyle = '#a3f697';
    context.shadowColor = '#81b47b';
    context.lineWidth = 2;
    context.shadowBlur = 4;
    context.stroke();
    context.restore();
  };

  const drawSelectionBox = (startCoordinate, endCoordinate) => {
    const topLeftX = Math.min(
      startCoordinate.canvasX,
      endCoordinate.canvasX,
    );
    const topLeftY = Math.min(
      startCoordinate.canvasY,
      endCoordinate.canvasY,
    );
    const width = Math.abs(endCoordinate.canvasX - startCoordinate.canvasX);
    const height = Math.abs(
      endCoordinate.canvasY - startCoordinate.canvasY,
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
    context.arc(coordinate.planeX, coordinate.planeY, 12, 0, 2 * Math.PI);
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
      planeX: clientX - currentSize.left,
      planeY: clientY - currentSize.top,
    });
  };

  return {
    getEventCoordinate,
    drawPoint,
    getPlaneDistance,
    drawLine,
    findNodeAtCoordinate,
    drawSelectionBox,
    drawPointSelection,
    createCoordinate,
    pan,
  };
};

export default createCanvasService;
