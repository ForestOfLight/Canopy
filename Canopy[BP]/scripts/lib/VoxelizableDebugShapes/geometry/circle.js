const key = (i, j) => i + ',' + j;

function classify(cp, cq, ru, rv, predicate) {
    const set = new Set();
    if (ru <= 0 || rv <= 0) return set;
    const i0 = Math.floor(cp - ru) - 1; const i1 = Math.ceil(cp + ru) + 1;
    const j0 = Math.floor(cq - rv) - 1; const j1 = Math.ceil(cq + rv) + 1;
    for (let i = i0; i <= i1; i++)
        {for (let j = j0; j <= j1; j++)
            if (predicate(i, j)) set.add(key(i, j));}
    return set;
}

export function coveredSet(cp, cq, ru, rv) {
    return classify(cp, cq, ru, rv, (i, j) => {
        const nx = Math.min(Math.max(cp, i), i + 1); const ny = Math.min(Math.max(cq, j), j + 1);
        const a = (nx - cp) / ru; const b = (ny - cq) / rv;
        return a * a + b * b < 1;
    });
}

export function insideSet(cp, cq, ru, rv) {
    return classify(cp, cq, ru, rv, (i, j) => {
        const fx = Math.abs(i - cp) > Math.abs(i + 1 - cp) ? i : i + 1;
        const fy = Math.abs(j - cq) > Math.abs(j + 1 - cq) ? j : j + 1;
        const a = (fx - cp) / ru; const b = (fy - cq) / rv;
        return a * a + b * b <= 1;
    });
}

/** Boundary of a cell set: edges of member cells whose neighbor across the edge is absent. */
export function boundaryEdges(set) {
    const out = [];
    for (const k of set) {
        const [i, j] = k.split(',').map(Number);
        if (!set.has(key(i, j - 1))) out.push(i, j, i + 1, j);           // bottom
        if (!set.has(key(i, j + 1))) out.push(i, j + 1, i + 1, j + 1);   // top
        if (!set.has(key(i - 1, j))) out.push(i, j, i, j + 1);           // left
        if (!set.has(key(i + 1, j))) out.push(i + 1, j, i + 1, j + 1);   // right
    }
    return out;
}

/** All 4 edges of every member cell (graph-paper); duplicates collapse when merged. */
export function allEdges(set) {
    const out = [];
    for (const k of set) {
        const [i, j] = k.split(',').map(Number);
        out.push(i, j, i + 1, j, i, j + 1, i + 1, j + 1, i, j, i, j + 1, i + 1, j, i + 1, j + 1);
    }
    return out;
}

export function circleVoxel2D(cp, cq, ru, rv, opts) {
    const { innerEdge = false, outerEdge = false, fill = false } = opts || {};
    if (ru <= 0 || rv <= 0) return [];
    const cov = coveredSet(cp, cq, ru, rv);
    let ins = insideSet(cp, cq, ru, rv);
    if (ins.size === 0) ins = cov; // degenerate → inner degenerates to outer
    const groups = [];
    if (outerEdge) groups.push({ group: 'outer', segments: boundaryEdges(cov) });
    if (innerEdge) groups.push({ group: 'inner', segments: boundaryEdges(ins) });
    if (fill) {
        const region = (outerEdge || !innerEdge) ? cov : ins;
        groups.push({ group: 'fill', segments: allEdges(region) });
    }
    return groups;
}
