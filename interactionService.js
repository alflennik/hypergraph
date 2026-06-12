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
  let mouseDownCoordinate = null;
  let mouseDownNode = null;
  let isDragging = false;

  canvas.addEventListener('mousedown', (event) => {
    isClicking = true;

    mouseDownCoordinate = canvasService.getEventCoordinate(event);
    const clickedNode = canvasService.findNodeAtCoordinate(mouseDownCoordinate);

    mouseDownNode = clickedNode;
  });

  canvas.addEventListener('mousemove', (event) => {
    if (!isClicking) {
      return;
    }
    const dragThreshold = 10;
    const currentCoordinate = canvasService.getEventCoordinate(event);

    const dragDistance = canvasService.getDistance(
      mouseDownCoordinate,
      currentCoordinate,
    );

    if (dragDistance > dragThreshold) {
      isDragging = true;
    }

    if (isDragging) {
      listeners.draggingAnywhere?.(mouseDownCoordinate, currentCoordinate);

      const currentNode = canvasService.findNodeAtCoordinate(currentCoordinate);

      if (mouseDownNode) {
        if (currentNode) {
          listeners.draggingBetweenNodes?.(mouseDownNode, currentNode);
        } else {
          listeners.draggingFromNode?.(mouseDownNode, currentCoordinate);
        }
      } else {
        // TODO: Implement the following:
        // listeners.draggingFromEmptyCanvas(currentCoordinate);
      }
    }
  });

  canvas.addEventListener('mouseup', (event) => {
    const currentCoordinate = canvasService.getEventCoordinate(event);

    if (isDragging) {
      listeners.draggedAnywhere?.(mouseDownCoordinate, currentCoordinate);

      const currentNode = canvasService.findNodeAtCoordinate(currentCoordinate);

      if (mouseDownNode) {
        if (currentNode) {
          listeners.draggedBetweenNodes?.(mouseDownNode, currentNode);
        } else {
          listeners.draggedFromNode?.(mouseDownNode, currentCoordinate);
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
    mouseDownCoordinate = null;
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
