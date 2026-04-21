const Debugger = () => {
  function safeStringify(value, { space = 2, maxDepth = 30 } = {}) {
    const path = [];
    function visit(v, depth) {
      if (depth > maxDepth) return "[MaxDepth]";
      if (v === undefined) return null;
      if (v === null) return null;
      const t = typeof v;
      if (t === "string" || t === "number" || t === "boolean") return v;
      if (t === "bigint") return v.toString() + "n";
      if (t === "symbol") return v.toString();
      if (t === "function") return `[Function ${v.name || "anonymous"}]`;
      if (typeof v === "object") {
        if (path.includes(v)) return "[Circular]";
        path.push(v);
        let out;
        if (Array.isArray(v)) {
          out = v.map((item) => visit(item, depth + 1));
        } else if (v instanceof Map) {
          out = {
            __type: "Map",
            entries: [...v].map(([k, val]) => [
              visit(k, depth + 1),
              visit(val, depth + 1),
            ]),
          };
        } else if (v instanceof Set) {
          out = {
            __type: "Set",
            values: [...v].map((item) => visit(item, depth + 1)),
          };
        } else if (v instanceof Date) {
          out = v.toISOString();
        } else if (v instanceof RegExp) {
          out = v.toString();
        } else {
          out = {};
          for (const key of Reflect.ownKeys(v)) {
            const desc = Object.getOwnPropertyDescriptor(v, key);
            if (!desc) continue;
            let sk = key;
            if (typeof sk === "symbol") sk = sk.toString();
            if (Object.prototype.hasOwnProperty.call(desc, "value")) {
              out[sk] = visit(desc.value, depth + 1);
            } else {
              out[sk] = "[Getter]";
            }
          }
        }
        path.pop();
        return out;
      }
      return String(v);
    }
    return JSON.stringify(visit(value, 0), null, space);
  }

  return safeStringify;
};

export default Debugger;