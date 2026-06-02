const createInteractionsService = ({canvas}) => {
  const listeners = {};

  const clickedEmptyCanvas = (callback) => {
    listeners.clickedEmptyCanvas = callback;
  };

  canvas.addEventListener('mouseup', (event) => {
    const currentSize = canvas.getBoundingClientRect();
    listeners.clickedEmptyCanvas({x: event.clientX - currentSize.left, y: event.clientY - currentSize.top});
  });

  return {clickedEmptyCanvas};
}

export default createInteractionsService;