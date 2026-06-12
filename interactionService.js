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
    const currentCoordinate = canvasService.getEventCoordinate(event);

    const dragDistance = canvasService.getDistance(
      startCoordinate,
      currentCoordinate,
    );

    if (dragDistance > dragThreshold) {
      isDragging = true;
    }

    if (isDragging) {
      listeners.draggingAnywhere?.(startCoordinate, currentCoordinate);

      const currentNode = canvasService.findNodeAtCoordinate(currentCoordinate, {interactionType});

      if (startNode) {
        if (currentNode) {
          listeners.draggingBetweenNodes?.(startNode, currentNode);
        } else {
          listeners.draggingFromNode?.(startNode, currentCoordinate);
        }
      } else {
        // TODO: Implement the following:
        // listeners.draggingFromEmptyCanvas(currentCoordinate);
      }
    }
  };

  const endInteraction = (event, {interactionType}) => {
    const currentCoordinate = canvasService.getEventCoordinate(event);

    if (isDragging) {
      listeners.draggedAnywhere?.(startCoordinate, currentCoordinate);

      const currentNode = canvasService.findNodeAtCoordinate(currentCoordinate, {interactionType});

      if (startNode) {
        if (currentNode) {
          listeners.draggedBetweenNodes?.(startNode, currentNode);
        } else {
          listeners.draggedFromNode?.(startNode, currentCoordinate);
        }
      } else {
        // TODO: Implement the following:
        // listeners.draggedFromEmptyCanvas(currentCoordinate);
      }
    } else {
      listeners.clickedAnywhere?.(currentCoordinate);
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
