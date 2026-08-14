const createCanvasService = ({ canvas, context, hypergraph, nodeData }) => {
  const viewCoordinateTopLeft = { planeX: 0, planeY: 0 };
  let viewScale = 1;

  // Only one set of coordinates need to be provided per function call: view coordinates or plane coordinates.
  const createCoordinate = ({ viewX, viewY, planeX, planeY, clientX, clientY }) => {
    if (planeX === undefined || planeY === undefined) {
      planeX = viewX / viewScale - viewCoordinateTopLeft.planeX;
      planeY = viewY / viewScale - viewCoordinateTopLeft.planeY;
    }

    return {
      planeX,
      planeY,
      scaledClientX: clientX * window.devicePixelRatio, // Only available in interactions
      scaledClientY: clientY * window.devicePixelRatio, // Only available in interactions
      get viewX() {
        return (planeX + viewCoordinateTopLeft.planeX) * viewScale;
      },
      get viewY() {
        return (planeY + viewCoordinateTopLeft.planeY) * viewScale;
      },
    };
  };

  const getWidth = () => {
    const currentSize = canvas.getBoundingClientRect();
    return currentSize.width * window.devicePixelRatio;
  };

  const getHeight = () => {
    const currentSize = canvas.getBoundingClientRect();
    return currentSize.height * window.devicePixelRatio;
  };

  const pan = ({ viewDeltaX, viewDeltaY }) => {
    viewCoordinateTopLeft.planeX += viewDeltaX / viewScale;
    viewCoordinateTopLeft.planeY += viewDeltaY / viewScale;
  };

  const zoomIn = (anchorCoordinate) => {
    const viewPercentFromLeft = anchorCoordinate.viewX / getWidth();
    const viewPercentFromTop = anchorCoordinate.viewY / getHeight();

    const viewWidthToRemove = getWidth() * 0.5;
    const viewHeightToRemove = getHeight() * 0.5;

    const panX = viewPercentFromLeft * viewWidthToRemove * -1;
    const panY = viewPercentFromTop * viewHeightToRemove * -1;

    viewScale *= 1.5;

    // Anchors the zoom
    pan({ viewDeltaX: panX, viewDeltaY: panY });
  };

  const zoomOut = (anchorCoordinate) => {
    const viewPercentFromLeft = anchorCoordinate.viewX / getWidth();
    const viewPercentFromTop = anchorCoordinate.viewY / getHeight();

    const viewWidthToAdd = getWidth() * 0.5;
    const viewHeightToAdd = getHeight() * 0.5;

    const panX = viewPercentFromLeft * viewWidthToAdd;
    const panY = viewPercentFromTop * viewHeightToAdd;

    // Anchors the zoom
    pan({ viewDeltaX: panX, viewDeltaY: panY });

    viewScale /= 1.5;
  };

  const getViewDistance = (coordinate1, coordinate2) => {
    const deltaX = coordinate1.viewX - coordinate2.viewX;
    const deltaY = coordinate1.viewY - coordinate2.viewY;

    return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  };

  const getViewDistanceToEdge = (edgeStartCoordinate, edgeEndCoordinate, coordinate) => {
    const interpolate = (value1, value2, position) => {
      return value1 + position * (value2 - value1);
    };

    const deltaX = edgeEndCoordinate.viewX - edgeStartCoordinate.viewX;
    const deltaY = edgeEndCoordinate.viewY - edgeStartCoordinate.viewY;

    const positionAlongInfiniteLine =
      ((coordinate.viewX - edgeStartCoordinate.viewX) * deltaX +
        (coordinate.viewY - edgeStartCoordinate.viewY) * deltaY) /
      (deltaX * deltaX + deltaY * deltaY);

    const positionAlongLine = Math.min(1, Math.max(0, positionAlongInfiniteLine));

    const x = interpolate(edgeStartCoordinate.viewX, edgeEndCoordinate.viewX, positionAlongLine);
    const y = interpolate(edgeStartCoordinate.viewY, edgeEndCoordinate.viewY, positionAlongLine);

    const closestCoordinateOnLine = createCoordinate({ viewX: x, viewY: y });

    return getViewDistance(coordinate, closestCoordinateOnLine);
  };

  const findNodeAtCoordinate = (coordinate, { interactionType }) => {
    let bestNode;
    let bestDistance = Infinity;

    hypergraph.iterateHypergraph({
      nodeCallback: (node) => {
        const { coordinate: nodeCoordinate } = nodeData.get(node);
        const distanceFromNode = getViewDistance(coordinate, nodeCoordinate);

        const snappingThreshold = (interactionType === 'touch' ? 25 : 10) * window.devicePixelRatio;
        if (distanceFromNode < snappingThreshold && distanceFromNode < bestDistance) {
          bestNode = node;

          bestDistance = distanceFromNode;
        }
      },
    });

    return bestNode;
  };

  const findEdgeAtCoordinate = (coordinate, { interactionType }) => {
    let bestEdge;
    let bestDistance = Infinity;

    hypergraph.iterateHypergraph({
      edgeCallback: (startNode, endNode) => {
        const { coordinate: edgeStartCoordinate } = nodeData.get(startNode);
        const { coordinate: edgeEndCoordinate } = nodeData.get(endNode);

        const distanceFromEdge = getViewDistanceToEdge(
          edgeStartCoordinate,
          edgeEndCoordinate,
          coordinate,
        );

        const snappingThreshold = (interactionType === 'touch' ? 25 : 10) * window.devicePixelRatio;

        if (distanceFromEdge < snappingThreshold && distanceFromEdge < bestDistance) {
          bestEdge = [startNode, endNode];

          bestDistance = distanceFromEdge;
        }
      },
    });

    return bestEdge;
  };

  const drawPoint = (coordinate) => {
    context.save();
    context.beginPath();
    context.fillStyle = '#4ee238';
    context.shadowColor = '#81b47b';
    context.shadowBlur = 4 * window.devicePixelRatio;
    context.arc(coordinate.viewX, coordinate.viewY, 8 * window.devicePixelRatio, 0, 2 * Math.PI);
    context.fill();
    context.restore();

    context.save();
    context.beginPath();
    context.fillStyle = 'white';
    context.arc(coordinate.viewX, coordinate.viewY, 6 * window.devicePixelRatio, 0, 2 * Math.PI);
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
    context.lineWidth = 2 * window.devicePixelRatio;
    context.shadowBlur = 4 * window.devicePixelRatio;
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
    context.lineWidth = 1 * window.devicePixelRatio;
    context.arc(coordinate.viewX, coordinate.viewY, 12 * window.devicePixelRatio, 0, 2 * Math.PI);
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

    // TODO: Prevent viewport zoom on desktop safari
    return createCoordinate({
      // viewX: clientX - currentSize.left,
      // viewY: clientY - currentSize.top,
      viewX: (clientX - currentSize.left) * window.devicePixelRatio,
      viewY: (clientY - currentSize.top) * window.devicePixelRatio,
      clientX, // Needed for interactions (hand tool) that mutate the view
      clientY, // Needed for interactions (hand tool) that mutate the view
    });
  };

  return {
    getEventCoordinate,
    drawPoint,
    getViewDistance,
    getViewDistanceToEdge,
    drawLine,
    findNodeAtCoordinate,
    findEdgeAtCoordinate,
    drawSelectionBox,
    drawPointSelection,
    createCoordinate,
    pan,
    zoomIn,
    zoomOut,
    getWidth,
    getHeight,
  };
};

export default createCanvasService;
