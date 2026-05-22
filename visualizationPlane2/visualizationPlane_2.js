// const createGraph = require('../hypergraph');
// const graph = createGraph();
import createGraph from '../hypergraph.js';
import debug from './debug.js';
import iterateHypergraph from '../iterateHypergraph.js'

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
  /* Mouse Coordinates */
  const bounds = canvas.getBoundingClientRect();
  let mouseX = 0;
  let mouseY = 0;

  /* Drag Coordinates */
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

  let edgeSelected = false;
  let selectedEdge = null;

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
  // const drawSelectedNode = (x, y) => {
  //   context.beginPath();
  //   context.fillStyle = "red";
  //   context.arc(x, y, CONFIG.nodeRadius, 0, Math.PI * 2);
  //   context.fill();
  // }
  const drawSelectedEdge = (x1, y1, x2, y2) => {
    context.beginPath();
    context.strokeStyle = "red";
    context.lineWidth = 2.5;
    context.moveTo(x1, y1);
    context.lineTo(x2, y2);

    context.stroke();
  }

  // A function for getting the line closest to the mouse click -- grokAI
  function distanceToSegment(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len2 = dx * dx + dy * dy;

    if (len2 === 0) return Math.hypot(px - x1, py - y1); // line is a point

    // Projection parameter t (clamped between 0 and 1)
    let t = ((px - x1) * dx + (py - y1) * dy) / len2;
    t = Math.max(0, Math.min(1, t));

    const projX = x1 + t * dx;
    const projY = y1 + t * dy;

    return Math.hypot(px - projX, py - projY);
  };

  // A funciton for removing connections cursor composer AI
  // TODO: GOT IMPATIENT WITH THIS ONE. COULD HAVE DONE IT MYSELF
  function removeConnection(startX, startY, endX, endY) {
    const i = connections.findIndex(
      (c) =>
        c.nodeStart[0] === startX &&
        c.nodeStart[1] === startY &&
        c.nodeEnd[0] === endX &&
        c.nodeEnd[1] === endY
    );
    if (i !== -1) connections.splice(i, 1);
  }

  let clickedOnNode = false;

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
      console.log("CLIDKED ON NODE", clickedOnNode);
      if (clickedOnNode === true) {
        const startX = node.nodeStart[0];
        const startY = node.nodeStart[1];
        const endX = node.nodeEnd[0];
        const endY = node.nodeEnd[1];

        context.beginPath();
        context.moveTo(startX, startY);
        context.lineTo(endX, endY);

        context.stroke();
        // drawSelectedNode(endX, endY);
      } else {
        const startX = node.nodeStart[0];
        const startY = node.nodeStart[1];
        const endX = node.nodeEnd[0];
        const endY = node.nodeEnd[1];

        context.beginPath();
        context.strokeStyle = CONFIG.defaultStrokeColor;
        context.lineWidth = CONFIG.defaultEdgeWidth;
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

  window.addEventListener("keydown", (event) => {
    if (event.key === "Delete" || event.key === "Backspace") {
      if (edgeSelected === true) {
        console.log("AN-EDGE-IS-SELECTED");
        console.log("SELECTED-EDGE:", selectedEdge);

        let node1 = nodesMap.get(posKey(selectedEdge.start[0], selectedEdge.start[1]));
        let node2 = nodesMap.get(posKey(selectedEdge.end[0], selectedEdge.end[1]));

        removeConnection(selectedEdge.start[0], selectedEdge.start[1], selectedEdge.end[0], selectedEdge.end[1]);
        console.log("HERE:", node1);
        console.log("HERE:", node2);

        deleteHyperEdge(node1, node2);
        redrawCanvas();
        console.log(Debugger(hypergraph));
      } else {
        console.log("EDGE-NOT-SELECTED");
        console.log("SELECTED-EDGE:", selectedEdge);
      }
    }
  });

  canvas.addEventListener("mousedown", (event) => {
    const { viewportX, viewportY } = getCanvasPos(event);

    const nodeKeys = nodesMap.keys();
    startViewportX = viewportX;
    startViewportY = viewportY;

    mouseX = event.clientX - bounds.left;
    mouseY = event.clientY - bounds.top;
    const deltaViewportX = viewportX - startViewportX;
    const deltaViewportY = viewportY - startViewportY;
    // if (!hasDragged && Math.sqrt(deltaViewportX * deltaViewportX + deltaViewportY * deltaViewportY) < CONFIG.dragThreshold) return;



    // if (event.button === 2) {
    //   nodeKeys.forEach((key) => {
    //     let lineDist = Math.hypot(mouseX - dragStartX, mouseY - dragStartY);
    //     if (lineDist < 12) {

    //     }
    //   })
    // }
    let edgeStartX = 0;
    let edgeStartY = 0;
    let edgeEndX = 0;
    let edgeEndY = 0;
    let lineDistStartNode = 0;
    let lineDistEndNode = 0;
    let distToLine = 0;
    let edgeMinLength = 0;
    let closestEdgeDist = 0;
    let closestEdge = null;
    const minArr = [];

    if (event.button === 0 && hasDragged === false) {
      // connections.push({ "nodeStart": [dragStartX, dragStartY], "nodeEnd": [pos.startX, pos.startY] });
      const mouseDist = [];
      console.log("CONNECTIONS-LENTGH:", connections.length);
      if (connections.length > 0) {
        connections.forEach((key, index) => {
          edgeStartX = key.nodeStart[0];
          edgeStartY = key.nodeStart[1];
          edgeEndX = key.nodeEnd[0];
          edgeEndY = key.nodeEnd[1];

          // lineDistStartNode = Math.hypot(mouseX - edgeStartX, mouseY - edgeStartY);
          // lineDistEndNode = Math.hypot(mouseX - edgeEndX, mouseY - edgeEndX);
          // distSum = lineDistStartNode + lineDistEndNode;
          distToLine = distanceToSegment(mouseX, mouseY, edgeStartX, edgeStartY, edgeEndX, edgeEndY);
          // // mouseDist.push({[key]:[lineDistStartNode + lineDistEndNode]});
          mouseDist.push({
            start: key.nodeStart,
            end: key.nodeEnd,
            dist: distToLine,
          });


          minArr.push(mouseDist[index].dist);
        });

        // console.log("MIN-ARR", minArr);
        console.log("MOUSE-DIST:", mouseDist);
        closestEdgeDist = Math.min(...minArr);
        // console.log("CLOSEST-EDGE", closestEdge);

        mouseDist.forEach((node) => {
          if (node.dist === closestEdgeDist) {
            closestEdge = node;
            let clicked = Math.hypot(node.start[0] - node.end[0], node.start[1] - node.end[1]);
            // distSum = lineDistStartNode + lineDistEndNode;
            console.log("CLICKED:", clicked);
            console.log("THIS-IS-THE-NODE", node);
            console.log("CLOSEST-EDGE", closestEdge);

          }
        });
        // console.log("MOUSE-DIST:", JSON.stringify(mouseDist));
        // console.log("EDGE-MIN-LENTGH:", edgeMinLength);
        // console.log("CONNECTIONS-0",);
        // console.log("CONNECTIONS-0-start", connections[0].nodeStart);
      }
      if (closestEdge && closestEdgeDist < 10) {
        edgeSelected = true;
        selectedEdge = closestEdge;
        redrawCanvas();
        drawSelectedEdge(closestEdge.start[0], closestEdge.start[1], closestEdge.end[0], closestEdge.end[1]);
      } else {
        edgeSelected = false;
        selectedEdge = null;
        redrawCanvas();
      }
      // nodeKeys.forEach((key) => {
      //   const [nodeX, nodeY] = key.split(",").map((coordinate) => Number(coordinate));

      //   let lineDist = Math.hypot(mouseX - nodeX, mouseY - nodeY);
      //   if (lineDist < 12) {
      //     console.log("LINE DISTANCE:", lineDist);
      //     clickedOnNode = true;
      //     redrawCanvas();
      //   }
      // })
    }

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

    mouseX = event.clientX - bounds.left;
    mouseY = event.clientY - bounds.top;
    // const nodeKeys = nodesMap.keys()
    // console.log("nodeKeys:", nodeKeys);
    // console.log("MOUSE:", mouseX, mouseY);

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
    let lineDist = 0;
    let newLineDist = 0;
    lineDist = Math.hypot(endViewportX - dragStartX, endViewportY - dragStartY);
    if (lineDist > 350) {
      endViewportX = dragStartX + ((endViewportX - dragStartX) / lineDist) * 350;
      endViewportY = dragStartY + ((endViewportY - dragStartY) / lineDist) * 350;
    };

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
    // TODO: try lineDist should be shorter than 550.

    dragEndX = endViewportX;
    dragEndY = endViewportY;

    // redrawCanvas();

    // drawNode(viewportX, viewportY);
    // drawNode(viewportX + 100, viewportY + 100);
  });

  canvas.addEventListener("mouseup", (event) => {
    const { viewportX, viewportY } = getCanvasPos(event);

    if (hasDragged) {
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
          // debugger;
          context.moveTo(dragStartX, dragStartY);
          context.lineTo(pos.startX, pos.startY);
          context.strokeStyle = CONFIG.selectedStrokeColor;
          context.lineWidth = CONFIG.defaultEdgeWidth;
          context.stroke();
          // createHyperEdge(nodesMap.get(posKey(dragStartX, dragStartY)), pos.startX, pos.startY);
          createHyperEdge(nodesMap.get(posKey(dragStartX, dragStartY)), nodesMap.get(posKey(pos.startX, pos.startY)));
          connections.push({ "nodeStart": [dragStartX, dragStartY], "nodeEnd": [pos.startX, pos.startY] });
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
        // console.log("KEYS:", [...hypergraph.keys()]);
        // console.log("NODES-MAP:", nodesMap.get(posKey(dragStartX, dragStartY)));
        // console.log("NODES-MAP-2:", nodesMap.get(posKey(dragEndX, dragEndY)));
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
    // console.log("ITERATE:", iterateHypergraph());
    // const getNodes = (hypergraph) => {
    //   const graphNodes = [...hypergraph.keys()];
    //   return graphNodes;
    // };

    // const getEdges = (hypergraph) => {
    //   const graphEdges = [...hypergraph.values()];
    //   return graphEdges;
    // };
    iterateHypergraph(graph, {
      nodeCallback: (node) => { console.log(`THIS IS THE NODE`) },
      edgeCallback: (node1, node2) => { console.log(`THIS IS THE EDGE`) }
    });
  });


  // context.beginPath();
  // context.fillStyle = CONFIG.nexusColor;
  // context.arc(canvasCenterX, canvasCenterY, CONFIG.nexusRadius, 0, Math.PI * 2);
  // context.fill();
  // ctx.fillRect(5, 50, 20, 20);



}

createVisualizationPlane();
