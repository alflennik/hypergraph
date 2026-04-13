const util = require('util');
// Usage:
// console.log(util.inspect(testNode2, { depth: null, colors: true }));

const nodeConnect = new Map();
const nexus = {"nexus": "nexus"};
// console.log("KEY", Object.keys(nexus)[0]);
// console.log("KEY", Object.values(nexus));

const shuffle = (arr) => {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const getNexus = () => {
  return nexus
};

console.log("nexus:", getNexus());

const createNode = (node, nodeName) => {
  const newNode = {[nodeName]: nodeName};
  const connect = new Map();

  const nodeExists = nodeConnect.get(node);

  if (nodeExists) {
    console.log("EXISTS");

    const nodeValues = nodeConnect.get(node);
    nodeConnect.set(node, nodeValues.concat(newNode));

    nodeConnect.set(newNode, [node]);

  } else {
    console.log("DOESN'T EXIST");
    
    connect.set(node, [newNode]);
    connect.set(newNode, [node]);

    for (const [key, value] of connect) {
      const existing = nodeConnect.get(key) || [];
      nodeConnect.set(key, existing.concat(value));
    }
  }


  return newNode;
};

const testNode_1 = createNode(nexus, "testNode_1");
const testNode_2 = createNode(testNode_1, "testNode_2");
const testNode_3 = createNode(nexus, "testNode_3");

// console.log("nodeConnect", util.inspect(nodeConnect, { depth: null, colors: true }));

  const createEdge = (node1, node2) => {
    const node1Connections = nodeConnect.get(node1) || [];
    const node2Connections = nodeConnect.get(node2) || [];

    node1Connections.push(node2);
    node2Connections.push(node1);


    nodeConnect.set(node1, node1Connections);
    nodeConnect.set(node2, node2Connections);
  };

  createEdge(testNode_1, testNode_3);

  // console.log("nodeConnect-NEW-EDGE", util.inspect(nodeConnect, { depth: null, colors: true }));

  const getEdges = (node) => {
    const keys = [nodeConnect.key()];

    if (!keys.includes(node)) {
      console.log("This node does not exist");
      return;
    }

    const nodeEdges = nodeConnect.get(node);

    const randomlyOrdered = shuffle(nodeEdges);

    return randomlyOrdered;
  }

  // const testEdges_1 = getEdges(testNode_1);
  // console.log("testEdges_1: testNode_1", util.inspect(testEdges_1, { depth: null, colors: true }));

  const deleteEdge = (node1, node2) =>  {
    const node1Connections = nodeConnect.get(node1) || [];

    if (node1Connections.includes(node2)) {
      console.log("ITS IN THERE");
      node1Connections.splice(node1Connections.indexOf(node2), 1);
    } else {
      console.log(`These nodes do not share any edges.`)
      return;
    }
  };

  deleteEdge(testNode_1, testNode_3);
  const testEdges_2 = getEdges(testNode_1);

  // console.log("deletedEdge_1: testNode_1", util.inspect(testEdges_2, { depth: null, colors: true }));

