// const util = require('util');
// Usage:
// console.log(util.inspect(testNode2, { depth: null, colors: true }));
// import Debugger from "/debugger";

const createHypergraph = () => {
  const nodeConnect = new Map();
  const nexus = { nexus: 'nexus' };

  // Initializing nodeConnect with one edge
  nodeConnect.set(nexus, []);

  // Thank Claude for this Fisher-Yates algorithm
  const shuffle = (arr) => {
    const shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const getNexus = () => {
    return nexus;
  };

  const createEdgeFrom = (startNode, { debuggingName } = {}) => {
    let newNode;
    if (debuggingName) {
      newNode = { debuggingName };
    } else {
      newNode = {};
    }

    nodeConnect.set(newNode, [startNode]);
    nodeConnect.set(startNode, [...nodeConnect.get(startNode), newNode]);

    return newNode;
  };

  const createEdgeBetween = (node1, node2) => {
    const keys = [...nodeConnect.keys()];

    if (!keys.includes(node1) || !keys.includes(node2)) {
      console.log("One or both nodes do not/doesn't exist");
      console.log('node1', node1);
      console.log('node2', node2);
      console.log('keys', keys);

      return;
    }

    const node1Connections = nodeConnect.get(node1) ?? [];
    const node2Connections = nodeConnect.get(node2) ?? [];

    if (node1Connections.includes(node2) || node2Connections.includes(node1)) {
      console.log('These nodes are already connected');

      return;
    }

    node1Connections.push(node2);
    node2Connections.push(node1);

    nodeConnect.set(node1, node1Connections);
    nodeConnect.set(node2, node2Connections);
  };

  const getEdges = (node) => {
    const keys = [...nodeConnect.keys()];

    if (!keys.includes(node)) {
      console.log('This node does not exist');
      return;
    }

    const nodeEdges = nodeConnect.get(node);
    const randomlyOrdered = shuffle(nodeEdges);

    return randomlyOrdered;
  };

  const iterateHypergraph = ({ nodeCallback, edgeCallback, skipNodes = [], skipEdges = [] }) => {
    const processedNodes = new WeakMap();

    const recurse = (node) => {
      processedNodes.set(node, true);

      nodeCallback?.(node);

      const connectedNodes = getEdges(node);

      connectedNodes.forEach((connectedNode) => {
        const isSkipped =
          skipNodes.includes(connectedNode) ||
          skipEdges.some(
            (edgeToSkip) =>
              (edgeToSkip[0] === node && edgeToSkip[1] === connectedNode) ||
              (edgeToSkip[0] === connectedNode && edgeToSkip[1] === node),
          );

        const isDuplicate = processedNodes.get(connectedNode);

        if (isSkipped || isDuplicate) {
          return;
        }

        edgeCallback?.(node, connectedNode);
      });

      connectedNodes.forEach((connectedNode) => {
        const isSkipped =
          skipNodes.includes(connectedNode) ||
          skipEdges.some(
            (edgeToSkip) =>
              (edgeToSkip[0] === node && edgeToSkip[1] === connectedNode) ||
              (edgeToSkip[0] === connectedNode && edgeToSkip[1] === node),
          );

        const isDuplicate = processedNodes.get(connectedNode);

        if (isSkipped || isDuplicate) {
          return;
        }

        recurse(connectedNode);
      });
    };

    recurse(getNexus());
  };

  const findUnreachableNodesAndEdges = ({ nodesToDelete, edgesToDelete }) => {
    const reachableNodesMap = new Map();
    const reachableEdgesMap = new Map();

    iterateHypergraph({
      skipNodes: nodesToDelete,
      skipEdges: edgesToDelete,
      nodeCallback: (node) => {
        reachableNodesMap.set(node, true);
      },
      edgeCallback: (node1, node2) => {
        // debugger;
        if (!reachableEdgesMap.get(node1)) {
          reachableEdgesMap.set(node1, [node2]);
        } else {
          reachableEdgesMap.set(node1, [...reachableEdgesMap.get(node1), node2]);
        }
      },
    });

    const unreachableNodeCount = nodeConnect.size - reachableNodesMap.size;

    let edgeCount = 0;
    nodeConnect.forEach((edges, node) => {
      edgeCount += edges.length;
    });
    // Each edge is stored twice in nodeConnect (left -> right, right -> left)
    edgeCount = edgeCount/2;
    
    let reachableEdgesCount = 0;
    reachableEdgesMap.forEach((edges) => {
      reachableEdgesCount += edges.length;
    }); 
    
    const unreachableEdgeCount = edgeCount - reachableEdgesCount;
    // debugger;

    const isNodeUnreachable = (node) => {
      return !reachableNodesMap.get(node);
    };

    const isEdgeUnreachable = ([node1, node2]) => {
      return !(reachableEdgesMap.get(node1)?.includes(node2) || reachableEdgesMap.get(node2)?.includes(node1));
    };

    return { isNodeUnreachable, isEdgeUnreachable, unreachableNodeCount, unreachableEdgeCount };
  };

  const deleteEdge = (node1, node2) => {
    const node1Connections = nodeConnect.get(node1) || [];

    if (node1Connections.includes(node2)) {
      console.log('ITS IN THERE');
      node1Connections.splice(node1Connections.indexOf(node2), 1);
    } else {
      console.log(`These nodes do not share any edges.`);
      return;
    }
  };

  return {
    getNexus,
    createEdgeFrom,
    createEdgeBetween,
    getEdges,
    deleteEdge,
    iterateHypergraph,
    findUnreachableNodesAndEdges,
  };
};

export default createHypergraph;
