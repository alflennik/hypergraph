const createInteractionsService = ({ canvas, canvasService }) => {
  const listeners = {};

  const hoveredNode = (callback) => {
    listeners.hoveredNode = callback;
  };

  const hoveredEdge = (callback) => {
    listeners.hoveredEdge = callback;
  };

  const hoveredEmptyCanvas = (callback) => {
    listeners.hoveredEmptyCanvas = callback;
  };

  const clickedAnywhere = (callback) => {
    listeners.clickedAnywhere = callback;
  };

  const clickedEmptyCanvas = (callback) => {
    listeners.clickedEmptyCanvas = callback;
  };

  const clickedNode = (callback) => {
    listeners.clickedNode = callback;
  };

  const draggingAnywhere = (callback) => {
    listeners.draggingAnywhere = callback;
  };

  const draggingAnywhereCanceled = (callback) => {
    listeners.draggingAnywhereCanceled = callback;
  };

  const draggedAnywhere = (callback) => {
    listeners.draggedAnywhere = callback;
  };

  const draggingFromNode = (callback) => {
    listeners.draggingFromNode = callback;
  };

  const draggingFromNodeCanceled = (callback) => {
    listeners.draggingFromNodeCanceled = callback;
  };

  const draggedFromNode = (callback) => {
    listeners.draggedFromNode = callback;
  };

  const draggingBetweenNodes = (callback) => {
    listeners.draggingBetweenNodes = callback;
  };

  const draggedBetweenNodes = (callback) => {
    listeners.draggedBetweenNodes = callback;
  };

  const draggingFromEmptyCanvas = (callback) => {
    listeners.draggingFromEmptyCanvas = callback;
  };

  const draggingFromEmptyCanvasCanceled = (callback) => {
    listeners.draggingFromEmptyCanvasCanceled = callback;
  };

  const draggedFromEmptyCanvas = (callback) => {
    listeners.draggedFromEmptyCanvas = callback;
  };

  let isClicking = false;
  let startCoordinate = null;
  let startNode = null;
  let isDragging = false;
  let distanceDraggedSoFar = { x: 0, y: 0 };
  let currentHoveredNode = null;
  let currentHoveredEdge = null;

  const startInteraction = (event, { interactionType }) => {
    isClicking = true;

    startCoordinate = canvasService.getEventCoordinate(event);

    const clickedNode = canvasService.findNodeAtCoordinate(startCoordinate, { interactionType });

    startNode = clickedNode;
  };

  const moveInteraction = (event, { interactionType }) => {
    const endCoordinate = canvasService.getEventCoordinate(event);

    const hoveredNode = canvasService.findNodeAtCoordinate(endCoordinate, { interactionType });

    const hoveredEdge = canvasService.findEdgeAtCoordinate(endCoordinate, { interactionType });

    if (hoveredNode) {
      if (hoveredNode !== currentHoveredNode) {
        listeners.hoveredNode?.(hoveredNode);

        currentHoveredNode = hoveredNode;
        currentHoveredEdge = null;
      }
    } else if (hoveredEdge) {
      if (!(currentHoveredEdge && hoveredEdge[0] === currentHoveredEdge[0] && hoveredEdge[1] === currentHoveredEdge[1])) {
        listeners.hoveredEdge?.(hoveredEdge);

        currentHoveredEdge = hoveredEdge;
        currentHoveredNode = null;
      }
    } else {
      if (currentHoveredNode !== null || currentHoveredEdge !== null) {
        listeners.hoveredEmptyCanvas?.();

        currentHoveredNode = null;
        currentHoveredEdge = null;
      }
    };

    if (!isClicking) {
      return;
    }
    const dragThreshold = 5 * window.devicePixelRatio;

    const dragDistance = canvasService.getViewDistance(startCoordinate, endCoordinate);

    if (dragDistance > dragThreshold) {
      isDragging = true;
    }

    if (isDragging) {
      const endNode = hoveredNode;

      const incrementalChange = {
        viewDeltaX:
          endCoordinate.scaledClientX - startCoordinate.scaledClientX - distanceDraggedSoFar.x,
        viewDeltaY:
          endCoordinate.scaledClientY - startCoordinate.scaledClientY - distanceDraggedSoFar.y,
      };

      listeners.draggingAnywhere?.(startCoordinate, endCoordinate, { incrementalChange });

      if (startNode) {
        if (endNode) {
          listeners.draggingBetweenNodes?.(startNode, endNode, { incrementalChange });
        } else {
          listeners.draggingFromNode?.(startNode, endCoordinate, { incrementalChange });
        }
      } else {
        listeners.draggingFromEmptyCanvas?.(startCoordinate, endCoordinate, { incrementalChange });
      }

      distanceDraggedSoFar = {
        x: endCoordinate.scaledClientX - startCoordinate.scaledClientX,
        y: endCoordinate.scaledClientY - startCoordinate.scaledClientY,
      };
    }
  };

  const endInteraction = (event, { interactionType }) => {
    const endCoordinate = canvasService.getEventCoordinate(event);

    if (isDragging) {
      listeners.draggedAnywhere?.(startCoordinate, endCoordinate);

      const endNode = canvasService.findNodeAtCoordinate(endCoordinate, { interactionType });

      if (startNode) {
        if (endNode) {
          listeners.draggedBetweenNodes?.(startNode, endNode);
        } else {
          listeners.draggedFromNode?.(startNode, endCoordinate);
        }
      } else {
        listeners.draggedFromEmptyCanvas?.(startCoordinate, endCoordinate);
      }
    } else {
      listeners.clickedAnywhere?.(startCoordinate);

      if (startNode) {
        listeners.clickedNode?.(startNode);
      } else {
        listeners.clickedEmptyCanvas?.(startCoordinate);
      }
    }

    isClicking = false;
    isDragging = false;
    startCoordinate = null;
    distanceDraggedSoFar = { x: 0, y: 0 };
  };

  const cancelInteraction = (event, { interactionType }) => {
    if (!isDragging) {
      return;
    }

    const endCoordinate = canvasService.getEventCoordinate(event);

    listeners.draggingAnywhereCanceled?.(startCoordinate, endCoordinate);

    if (startNode) {
      listeners.draggingFromNodeCanceled?.(startNode, endCoordinate);
    } else {
      listeners.draggingFromEmptyCanvasCanceled?.(startCoordinate, endCoordinate);
    }

    isClicking = false;
    isDragging = false;
    startCoordinate = null;
    distanceDraggedSoFar = { x: 0, y: 0 };
  };

  canvas.addEventListener('mousedown', (event) => {
    startInteraction(event, { interactionType: 'mouse' });
  });

  canvas.addEventListener('touchstart', (event) => {
    event.preventDefault();
    startInteraction(event, { interactionType: 'touch' });
  });

  canvas.addEventListener('mousemove', (event) => {
    moveInteraction(event, { interactionType: 'mouse' });
  });

  canvas.addEventListener('touchmove', (event) => {
    event.preventDefault();
    moveInteraction(event, { interactionType: 'touch' });
  });

  canvas.addEventListener('mouseup', (event) => {
    endInteraction(event, { interactionType: 'mouse' });
  });

  canvas.addEventListener('touchend', (event) => {
    event.preventDefault();
    endInteraction(event, { interactionType: 'touch' });
  });

  canvas.addEventListener('mouseout', (event) => {
    event.preventDefault();
    cancelInteraction(event, { interactionType: 'mouse' });
  });

  canvas.addEventListener('touchcancel', (event) => {
    event.preventDefault();
    cancelInteraction(event, { interactionType: 'touch' });
  });

  return {
    hoveredNode,
    hoveredEdge,
    hoveredEmptyCanvas,
    clickedAnywhere,
    clickedNode,
    clickedEmptyCanvas,
    draggingAnywhere,
    draggingAnywhereCanceled,
    draggedAnywhere,
    draggingFromNode,
    draggingFromNodeCanceled,
    draggedFromNode,
    draggingBetweenNodes,
    draggedBetweenNodes,
    draggingFromEmptyCanvas,
    draggingFromEmptyCanvasCanceled,
    draggedFromEmptyCanvas,
  };
};

export default createInteractionsService;
