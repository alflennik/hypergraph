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

  let isClicking = false;
  let mouseDownCoordinates = null;
  let isDragging = false;

  canvas.addEventListener('mousedown', (event) => {
    isClicking = true;

    mouseDownCoordinates = canvasService.getEventCoordinates(event);
  });

  canvas.addEventListener('mousemove', (event) => {
    if (!isClicking) {
      return;
    }
    const dragThreshold = 10;
    const currentCoordinates = canvasService.getEventCoordinates(event);

    const dragDistance = canvasService.getDistance(mouseDownCoordinates, currentCoordinates);

    if (dragDistance > dragThreshold) {
      isDragging = true;
    };

    if (isDragging) {
      listeners.draggingAnywhere?.(mouseDownCoordinates, currentCoordinates);
    };

  });

  canvas.addEventListener('mouseup', (event) => {
    const currentCoordinates = canvasService.getEventCoordinates(event);

    if (isDragging) {
      listeners.draggedAnywhere?.(mouseDownCoordinates, currentCoordinates);
    } else {
      listeners.clickedAnywhere?.(currentCoordinates);
    };

    isClicking = false;
    isDragging = false;
    mouseDownCoordinates = null;
  });

  return { clickedAnywhere, draggingAnywhere, draggedAnywhere };
}

export default createInteractionsService;