const createInteractionsService = ({ canvas, canvasService }) => {
  const listeners = {};

  const clickedAnywhere = (callback) => {
    listeners.clickedAnywhere = callback;
  };

  const draggingAnywhere = (callback) => {
    listeners.draggingAnywhere = callback;
  };

  const draggedAnywhere = (callback) => {
    listeners.draggedAnywhere = callback;
  };

  const draggingFromNode = (callback) => {
    listeners.draggingFromNode = callback;
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

  let isClicking = false;
  let startCoordinate = null;
  let startNode = null;
  let isDragging = false;

  const startInteraction = (event, {interactionType}) => {
    isClicking = true;

    startCoordinate = canvasService.getEventCoordinate(event);
    const clickedNode = canvasService.findNodeAtCoordinate(startCoordinate, {interactionType});

    startNode = clickedNode;
  };

  const interactionMove = (event, {interactionType}) => {
    if (!isClicking) {
      return;
    }
    const dragThreshold = 10;
    const endCoordinate = canvasService.getEventCoordinate(event);

    const dragDistance = canvasService.getDistance(
      startCoordinate,
      endCoordinate,
    );

    if (dragDistance > dragThreshold) {
      isDragging = true;
    }

    if (isDragging) {
      listeners.draggingAnywhere?.(startCoordinate, endCoordinate);

      const endNode = canvasService.findNodeAtCoordinate(endCoordinate, {interactionType});

      if (startNode) {
        if (endNode) {
          listeners.draggingBetweenNodes?.(startNode, endNode);
        } else {
          listeners.draggingFromNode?.(startNode, endCoordinate);
        }
      } else {
        // TODO: Implement the following:
        // listeners.draggingFromEmptyCanvas(endCoordinate);
      }
    }
  };

  const endInteraction = (event, {interactionType}) => {
    const endCoordinate = canvasService.getEventCoordinate(event);

    if (isDragging) {
      listeners.draggedAnywhere?.(startCoordinate, endCoordinate);

      const endNode = canvasService.findNodeAtCoordinate(endCoordinate, {interactionType});

      if (startNode) {
        if (endNode) {
          listeners.draggedBetweenNodes?.(startNode, endNode);
        } else {
          listeners.draggedFromNode?.(startNode, endCoordinate);
        }
      } else {
        // TODO: Implement the following:
        // listeners.draggedFromEmptyCanvas(endCoordinate);
      }
    } else {
      listeners.clickedAnywhere?.(endCoordinate);
    }

    isClicking = false;
    isDragging = false;
    startCoordinate = null;
  }

  canvas.addEventListener('mousedown', (event) => {
    startInteraction(event, {interactionType: 'mouse'});
  });

  canvas.addEventListener('touchstart', (event) => {
    event.preventDefault();
    startInteraction(event, {interactionType: 'touch'});
  });

  canvas.addEventListener('mousemove', (event) => {
    interactionMove(event, {interactionType: 'mouse'});
  });

  canvas.addEventListener('touchmove', (event) => {
    event.preventDefault();
    interactionMove(event, {interactionType: 'touch'});
  });

  canvas.addEventListener('mouseup', (event) => {
    endInteraction(event, {interactionType: 'mouse'});
  });

  canvas.addEventListener('touchend', (event) => {
    event.preventDefault();
    endInteraction(event, {interactionType: 'touch'});
  });

  return {
    clickedAnywhere,
    draggingAnywhere,
    draggedAnywhere,
    draggingFromNode,
    draggedFromNode,
    draggingBetweenNodes,
    draggedBetweenNodes,
  };
};

export default createInteractionsService;
