const createCanvasService = ({ canvas, context }) => {
  const drawPoint = (x, y,) => {
    context.beginPath();
    context.shadowColor = "red";
    context.shadowBlur = 15;
    context.arc(x, y, 10, 0, 2 * Math.PI);
    context.fillStyle = "red";
    context.fill();
    // context.stroke();
  };

  const drawLine = (startCoordinates, endCoordinates) => {
    context.beginPath();
    context.moveTo(startCoordinates.x, startCoordinates.y);
    context.lineTo(endCoordinates.x, endCoordinates.y);
    context.lineWidth = 1;
    context.strokeStyle = "white";
    context.shadowBlur = 0;
    context.stroke();
  }

  const getEventCoordinates = (event) => {
    const currentSize = canvas.getBoundingClientRect();
    return {
      x: event.clientX - currentSize.left,
      y: event.clientY - currentSize.top
    };
  };

  const getDistance = (coordinate1, coordinate2) => {
    const deltaX = coordinate1.x - coordinate2.x;
    const deltaY = coordinate1.y - coordinate2.y;

    return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  };

  return { getEventCoordinates, drawPoint, getDistance, drawLine }
};

export default createCanvasService;

