// const createGraph = require('../hypergraph');
// const graph = createGraph();
import createGraph from '../hypergraph.js';
import debug from './debug.js';

const createVisualizationPlane = () => {
  const Debugger = debug();

  // section
  const graph = createGraph();
  const hypergraph = graph.nodeConnect;
  const createHyperEdge = graph.createEdge;
  const createHyperNode = graph.createNode;
  const getHyperEdgesArray = graph.getEdges;
  const getHyperNexus = graph.getNexus;
  const deleteHyperEdge = graph.deleteEdge;

  const nexus = getHyperNexus();

  const canvas = document.getElementById("plane-1");
  const context = canvas.getContext("2d");

  // section:
  // CONFIGURATION:
  const CONFIG = {
    defaultStrokeColor: "black", // Color for normal (unselected) edges.
    selectedStrokeColor: "red", // Color for the currently selected edge.
    previewStrokeColor: "black", // Color for the live preview edge while dragging.
    defaultEdgeWidth: 1, // Stroke width for normal edges (px).
    selectedEdgeWidth: 3, // Stroke width for the selected edge (px).
    clickThreshold: 8, // Max distance (px) from an edge to count as a click on it.
    dragThreshold: 15, // Min distance (px) mouse must move to count as a drag.

    // Node settings.
    nodeRadius: 12, // Radius of regular node circles (viewport px).
    nodeColor: "blue", // Fill color for regular nodes.
    nodeSnapRadius: 12, // Max distance (viewport px) to snap to an existing node.

    // Nexus node — the permanent, undeletable center node.
    nexusRadius: 50, // Radius of the Nexus node (viewport px).
    nexusColor: "green", // Fill color for the Nexus node.

    // Zoom settings.
    minZoom: 0.1, // Minimum zoom level (10%).
    maxZoom: 10, // Maximum zoom level (1000%).
    zoomStep: 0.15, // How much each zoom button click changes the zoom (15%).
    wheelZoomStep: 0.1, // How much each scroll tick changes the zoom (10%).
  };

  // section
  // Drag Coordinates
  let dragStartX = null;
  let dragStartY = null;
  let dragEndX = null;
  let dragEndY = null;

  /** Drawing state. */
  let isDrawing = false;

  /** Start plane position (used when not snapping to an existing node). */
  let startPlaneX = 0;
  let startPlaneY = 0;

  /** Start positions in viewport space (for pan and drag threshold). */
  let startViewportX = 0;
  let startViewportY = 0;

  /** Track whether the mouse moved during a mousedown (to distinguish click vs drag). */
  let hasDragged = false;

  let view = {
    panX: 0,    // Horizontal pan offset (plane units).
    panY: 0,    // Vertical pan offset (plane units).
    zoom: 1,    // Zoom multiplier (1 = 100%).
  };

  /** Convert a viewport-space point to plane-space. */
  const convertViewportToPlane = (viewportX, viewportY) => ({
    x: viewportX / view.zoom - view.panX,
    y: viewportY / view.zoom - view.panY,
  });

  /** Convert a plane-space point to viewport-space. */
  const convertPlaneToViewport = (planeX, planeY) => ({
    x: (planeX + view.panX) * view.zoom,
    y: (planeY + view.panY) * view.zoom,
  });

  // section
  // CANVAS CENTER:
  // const dpr = window.devicePixelRatio || 1;
  // canvas.width = canvas.clientWidth * dpr;
  // canvas.height = canvas.clientHeight * dpr;
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
  // context.scale(dpr, dpr);
  // canvas.width = canvas.clientWidth;
  // canvas.height = canvas.clientHeight;
  const canvasCenterX = canvas.width / 2;
  const canvasCenterY = canvas.height / 2;

  const connections = [];
  const edges = [];
  const snapPosition = [];
  snapPosition.push({ "startX": canvasCenterX, "startY": canvasCenterY });
  // const nodesMap = new WeakMap();
  const edgesMap = new WeakMap();
  const nodesMap = new Map();

  function posKey(x, y) {
    return `${x},${y}`;
  }

  // CREATE NEXUS NODE
  // context.beginPath();
  // context.fillStyle = CONFIG.nexusColor;
  // context.arc(canvasCenterX, canvasCenterY, CONFIG.nexusRadius, 0, Math.PI * 2);
  // context.fill();
  //section
  const createNexus = (x, y, r) => {
    context.beginPath();
    context.fillStyle = CONFIG.nexusColor;
    context.arc(x, y, CONFIG.nexusRadius, 0, Math.PI * 2);
    context.fill();
  };
  createNexus(canvasCenterX, canvasCenterY);

  nodesMap.set(posKey(canvasCenterX, canvasCenterY), nexus);

  const getCanvasPos = (event) => {
    const bounds = canvas.getBoundingClientRect();
    return {
      viewportX: event.clientX - bounds.left,
      viewportY: event.clientY - bounds.top,
    };
  };

  const drawNode = (x, y) => {
    context.beginPath();
    context.fillStyle = "blue";
    context.arc(x, y, CONFIG.nodeRadius, 0, Math.PI * 2);
    context.fill();
  }

  const redrawCanvas = () => {
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Apply the view transform: scale then translate.
    context.save();
    // context.setTransform(
    //   view.zoom, 0,
    //   0, view.zoom,
    //   view.panX * view.zoom,
    //   view.panY * view.zoom
    // );

    // Draw edges
    for (let i = 0; i < connections.length; i++) {
      const node = connections[i];

      // Start position: use the node if snapped, otherwise raw coords.
      // const startX = (edge.startNode !== null) ? nodes[edge.startNode].x : edge.startX;
      // const startY = (edge.startNode !== null) ? nodes[edge.startNode].y : edge.startY;
      // const endNode = nodes[edge.endNode];

      // nodes.push({"nodeStart": [dragStartX, dragStartY], "nodeEnd": [dragEndX, dragEndY]})

      const startX = node.nodeStart[0];
      const startY = node.nodeStart[1];
      const endX = node.nodeEnd[0];
      const endY = node.nodeEnd[1];

      context.beginPath();
      context.moveTo(startX, startY);
      context.lineTo(endX, endY);

      // Highlight the selected edge.
      // Divide lineWidth by zoom so strokes appear the same thickness
      // on viewport regardless of zoom level.
      // if (i === selectedEdgeIndex) {
      //   context.strokeStyle = CONFIG.selectedStrokeColor;
      //   context.lineWidth = CONFIG.selectedEdgeWidth / view.zoom;
      // } else {
      //   context.strokeStyle = CONFIG.defaultStrokeColor;
      //   context.lineWidth = CONFIG.defaultEdgeWidth / view.zoom;
      // }

      context.stroke();

      // drawNode(startX, startY);
      drawNode(endX, endY);


    }

    // Draw regular nodes
    // Node radius is in viewport pixels, so divide by zoom for plane space.
    // const nodePlaneRadius = CONFIG.nodeRadius / view.zoom;
    // context.fillStyle = CONFIG.nodeColor;

    // for (let i = 0; i < nodes.length; i++) {
    //   if (i === NEXUS_INDEX) continue; // Nexus is drawn separately below.
    //   context.beginPath();
    //   context.arc(nodes[i].x, nodes[i].y, nodePlaneRadius, 0, Math.PI * 2);
    //   context.fill();
    // }

    // Draw the Nexus node
    // Drawn last so it renders on top of everything else.
    // const nexusPlaneRadius = CONFIG.nexusRadius / view.zoom;
    // context.fillStyle = CONFIG.nexusColor;
    // context.beginPath();
    // context.arc(nodes[NEXUS_INDEX].x, nodes[NEXUS_INDEX].y, nexusPlaneRadius, 0, Math.PI * 2);
    // context.fill();

    createNexus(canvasCenterX, canvasCenterY);

    context.restore();
  };

  canvas.addEventListener("mousedown", (event) => {
    const { viewportX, viewportY } = getCanvasPos(event);
    startViewportX = viewportX;
    startViewportY = viewportY;

    hasDragged = false;

    // context.beginPath();
    // context.moveTo(viewportX, viewportY);
    // context.lineTo(viewportX + 100, viewportY + 100);
    // context.strokeStyle = "#000000";
    // context.lineWidth = 2;
    // context.stroke();

    // Left-click starts drawing an edge.
    if (event.button === 0) {
      isDrawing = true;
      const plane = convertViewportToPlane(viewportX, viewportY);
      startPlaneX = plane.x;
      startPlaneY = plane.y;

      // // Check if we're near an existing node — snap to it.
      // startNodeIndex = findNearestNode(plane.x, plane.y, CONFIG.nodeSnapRadius);

      // if (startNodeIndex !== null) {
      //   // Snap: use the existing node's position as the start.
      //   startPlaneX = nodes[startNodeIndex].x;
      //   startPlaneY = nodes[startNodeIndex].y;
      // } else {
      //   // No snap: use the raw click position.
      //   startPlaneX = plane.x;
      //   startPlaneY = plane.y;
      // }
    }

    // drawNode(viewportX, viewportY);
    // drawNode(viewportX + 100, viewportY + 100);
  });

  canvas.addEventListener("mousemove", (event) => {
    const { viewportX, viewportY } = getCanvasPos(event);
    const snapPos = {};
    const distance = 0;

    if (!isDrawing) return;

    const deltaViewportX = viewportX - startViewportX;
    const deltaViewportY = viewportY - startViewportY;
    if (!hasDragged && Math.sqrt(deltaViewportX * deltaViewportX + deltaViewportY * deltaViewportY) < CONFIG.dragThreshold) return;

    hasDragged = true;

    // Redraw all existing edges and nodes, then draw the preview edge on top.
    redrawCanvas();

    let endViewportX = viewportX;
    let endViewportY = viewportY;

    const startViewport = convertPlaneToViewport(startPlaneX, startPlaneY);
    // context.beginPath();
    // context.moveTo(viewportX, viewportY);
    // context.lineTo(viewportX + 100, viewportY + 100);
    // context.strokeStyle = "#000000";
    // context.lineWidth = 2;
    // context.stroke();

    if (snapPosition.length === 1) {
      snapPos.snapStartX = canvasCenterX;
      snapPos.snapStartY = canvasCenterY;
    } else {
      const tempDistArr = {};
      let tempDist = 0;
      // snapPosition.push({"startX": canvasCenterX, "startY": canvasCenterY});
      snapPosition.forEach((pos, index) => {
        tempDist = Math.hypot(startViewport.x - pos.startX, startViewport.y - pos.startY);
        // tempDistArr.push({[tempDist]: pos});
        tempDistArr[tempDist] = pos;
      })
      // console.log("CHECK-ARR-keys", Object.keys(tempDistArr))
      // console.log("CHECK-ARR-values", Object.values(tempDistArr))
      // console.log("SMALLEST", Math.min(...Object.keys(tempDistArr)))
      const smallVal = Math.min(...Object.keys(tempDistArr));
      // console.log("VALUE-FOR-SMALLEST", tempDistArr[smallVal])

      // snapPos.snapStartX = startViewport.x;
      // snapPos.snapStartY = startViewport.y;
      snapPos.snapStartX = tempDistArr[smallVal].startX;
      snapPos.snapStartY = tempDistArr[smallVal].startY;
    }

    context.beginPath();
    // context.moveTo(startViewport.x, startViewport.y);
    context.moveTo(snapPos.snapStartX, snapPos.snapStartY);
    context.lineTo(endViewportX, endViewportY);
    context.strokeStyle = CONFIG.previewStrokeColor;
    context.lineWidth = CONFIG.defaultEdgeWidth;
    context.stroke();

    // dragStartX = startViewport.x;
    // dragStartY = startViewport.y;
    dragStartX = snapPos.snapStartX;
    dragStartY = snapPos.snapStartY;
    dragEndX = endViewportX;
    dragEndY = endViewportY;

    // redrawCanvas();

    // drawNode(viewportX, viewportY);
    // drawNode(viewportX + 100, viewportY + 100);
  });

  canvas.addEventListener("mouseup", (event) => {
    const { viewportX, viewportY } = getCanvasPos(event);

    if (hasDragged) {
      // TODO: try putting nodeMap.get(posKey(dragStartX, dragStartY)) as argument for createHyperEdge
      // if () {

      // }
      const tempDistArr = {};
      let tempDist = 0;

      snapPosition.forEach((pos, index) => {
        tempDist = Math.hypot(dragEndX - pos.startX, dragEndY - pos.startY);
        // const existingEdge = connections.find((connection) => {
        //   return connection.nodeEnd[0] === pos.startX;
        // });
        const existingEdge = connections.find((connection) => {
          return connection.nodeStart[0] === dragStartX;
        });

        // console.log("DISTANCES:", index, tempDist);
        // const existingEdge = connections.find((connection) => {
        //   return (connection.nodeStart[0] === dragStartX && connection.nodeStart[1] === dragStartY) && (connection.nodeEnd[0] === pos.startX && connection.nodeEnd[1] === pos.startY);
        // });
        // console.log("existingEdge:", existingEdge);

        if (tempDist < 20 && !existingEdge) {
          console.log("IT'S CLOSE:", tempDist);
          context.moveTo(dragStartX, dragStartY);
          context.lineTo(pos.startX, pos.startY);
          context.strokeStyle = CONFIG.selectedStrokeColor;
          context.lineWidth = CONFIG.defaultEdgeWidth;
          context.stroke();
          createHyperEdge(nodesMap.get(posKey(dragStartX, dragStartY)), pos.startX, pos.startY);
          connections.push({ "nodeStart": [dragStartX, dragStartY], "nodeEnd": [pos.startX, pos.startY] })
          redrawCanvas();
          hasDragged = false;

          // createHyperEdge(nodesMap.get(posKey(pos.startX, pos.startY)), nodesMap.get(posKey(pos.startX, pos.startY)));
        } else {
          console.log("THIS RAN");
        }
        // console.log("dragStartX:", dragStartX);
        // console.log("dragStartY:", dragStartY);
        // console.log("pos.startX:", pos.startX);
        // console.log("pos.startY:", pos.startY);
        // console.log("==================================");
        // console.log("dragEndX:", dragEndX);
        // console.log("dragEndY:", dragEndY);
        // console.log("pos.startX:", pos.startX);
        // console.log("pos.startY:", pos.startY);
        // tempDistArr.push({[tempDist]: pos});
        tempDistArr[tempDist] = pos;
      })

      // TODO: look at snapPosition for pos.startX
      snapPosition.forEach((pos, index) => {
        tempDist = Math.hypot(dragEndX - pos.startX, dragEndY - pos.startY);
        // tempDistArr.push({[tempDist]: pos});
        tempDistArr[tempDist] = pos;
      })
      const smallVal = Math.min(...Object.keys(tempDistArr));
      console.log("SMALL-VALL", smallVal);
      if (hasDragged === true && smallVal > 20) {
        drawNode(dragEndX, dragEndY);
        connections.push({ "nodeStart": [dragStartX, dragStartY], "nodeEnd": [dragEndX, dragEndY] });
        const testNode1 = createHyperNode("testNode");
        nodesMap.set(posKey(dragEndX, dragEndY), testNode1);
        createHyperEdge(nodesMap.get(posKey(dragStartX, dragStartY)), nodesMap.get(posKey(dragEndX, dragEndY)));
        snapPosition.push({ "startX": dragEndX, "startY": dragEndY });
        // console.log("snap", snapPosition);
        // console.log("KEYS:", nodesMap.keys());
        console.log("KEYS:", [...hypergraph.keys()]);
        console.log("NODES-MAP:", nodesMap.get(posKey(dragStartX, dragStartY)));
        console.log("NODES-MAP-2:", nodesMap.get(posKey(dragEndX, dragEndY)));
        // hypergraph
        //  getHyperEdgesArray();
        //  getHyperNexus();
        //  deleteHyperEdge();
      }

      if (hasDragged === true && smallVal < 20) {
        redrawCanvas();
        alert("Too Close to another node");
      }
    }

    //TODO: create code for selecting and highlighting a node and its edges if hasDragged = false. Look at the code for distance and snap position in the mousemove event.

    hasDragged = false;
    isDrawing = false;
    //DEBUGG:
    console.log("=====================================================");
    console.log("==================== BOTTOM LOGS ====================");
    console.log("=====================================================");
    console.log(Debugger(hypergraph));
  });


  // context.beginPath();
  // context.fillStyle = CONFIG.nexusColor;
  // context.arc(canvasCenterX, canvasCenterY, CONFIG.nexusRadius, 0, Math.PI * 2);
  // context.fill();
  // ctx.fillRect(5, 50, 20, 20);



}

createVisualizationPlane();
