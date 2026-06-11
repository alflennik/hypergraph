import createGraph from './hypergraph.js';
import debug from './debug.js';

// const edges = createGraph().getEdges;
// const hypergraph = createGraph().nodeConnect;
/* TODO:
- 

*/

const iterateHypergraph = (hypergraph, { nodeCallback, edgeCallback }) => {
  // debugger;
  const processedNodes = new WeakMap();
  let stopIteration = false;

  const recurse = (node) => {
    processedNodes.set(node, true);

    const iterationControl = nodeCallback?.(node);

    if (iterationControl?.stopIteration) {
      stopIteration = true;
      return;
    };

    const connectedNodes = hypergraph.getEdges(node);

    connectedNodes.forEach((connectedNode) => {
      if (!processedNodes.get(connectedNode) && !stopIteration) {
        const iterationControl = edgeCallback?.(node, connectedNode);
        
        if (iterationControl?.stopIteration) {
          stopIteration = true;
          return;
        };
      }
    });

    connectedNodes.forEach((connectedNode) => {
      if (!processedNodes.get(connectedNode) && !stopIteration) {
        recurse(connectedNode);
      }
    });
  };

  recurse(hypergraph.getNexus());
};


// const getNodes = (hypergraph) => {
//   const graphNodes = [...hypergraph.keys()];
//   return graphNodes;
// };

// const getEdges = (hypergraph) => {
//   const graphEdges = [...hypergraph.values()];
//   return graphEdges;
// };

// const processedNodes = new WeakMap();
// const processedEdges = new WeakMap();
// const nodes = [];

// const iterateHypergraph = (hypergraph) => {
//   const graphNodes = getNodes(hypergraph);
//   const graphEdgesArr = getEdges(hypergraph);


//   graphNodes.forEach((node, index) => {
//     if (processedNodes.has(node)) {
//       console.log(`Node already has ID`);
//     } else {
//       processedNodes.set(node, crypto.randomUUID());
//       nodes.push(processedNodes.get(node));
//     };

//     console.log("NODE", processedNodes.has(node));
//     // processedNodes.set(node, crypto.randomUUID());
//     console.log("NODE ARRAY", nodes);
//     // console.log("NODE", processedNodes.get(node))
//   });
//   // const check = [...processedNodes]


//   // console.log("graphNodes", graphNodes);
//   // console.log("graphEdgesArr", graphEdgesArr);
//   console.log("PROCESSED NODES", processedNodes);
//   // console.log("CHECK", check);
// };

// TODO: CREATE FUNCTION TO GET ALL NODES AND EDGES
// NODE CALLBACK FUNCTION SHOULD BE CALLED FOR EVERY NODE WITH NO DUPLICATES
// EDGE CALLBACK FUNCTION SHOULD BE CALLED FOR EVERY EDGE WITH NO DUPLICATES
// THE WEAKMAP IS FOR KEEPING TRACK OF NODES THAT YOU SAW ALREADY.
export default iterateHypergraph;
