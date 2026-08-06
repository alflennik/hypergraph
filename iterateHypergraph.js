import createGraph from './hypergraph.js';
import debug from './debug.js';

// const edges = createGraph().getEdges;
// const hypergraph = createGraph().nodeConnect;
/* TODO:
- 

*/

const iterateHypergraph = (hypergraph, { nodeCallback, edgeCallback }) => {
  const processedNodes = new WeakMap();

  const recurse = (node) => {
    processedNodes.set(node, true);

    nodeCallback?.(node);

    const connectedNodes = hypergraph.getEdges(node);

    connectedNodes.forEach((connectedNode) => {
      if (!processedNodes.get(connectedNode)) {
        edgeCallback?.(node, connectedNode);
      }
    });

    connectedNodes.forEach((connectedNode) => {
      if (!processedNodes.get(connectedNode)) {
        recurse(connectedNode);
      }
    });
  };

  recurse(hypergraph.getNexus());
};
export default iterateHypergraph;
