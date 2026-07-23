export function boxCorners(frame, centerX, centerY, centerZ, halfU, halfV, halfNormal) {
    const corners = [];
    for (const signU of [-1, 1]) {
        for (const signNormal of [-1, 1]) {
            for (const signV of [-1, 1]) {
                const corner = [0, 0, 0];
                frame.mapLocal(centerX, centerY, centerZ, signU * halfU, signV * halfV, signNormal * halfNormal, corner, 0);
                corners.push(corner);
            }
        }
    }
    return corners;
}

export function boxEdges(corners) {
    const cornerIndex = (uIndex, normalIndex, vIndex) => (uIndex * 2 + normalIndex) * 2 + vIndex;
    const edges = [];
    const addEdge = (start, end) => edges.push(start[0], start[1], start[2], end[0], end[1], end[2]);
    for (const normalIndex of [0, 1]) {
        for (const vIndex of [0, 1])
            addEdge(corners[cornerIndex(0, normalIndex, vIndex)], corners[cornerIndex(1, normalIndex, vIndex)]);
    }
    for (const uIndex of [0, 1]) {
        for (const vIndex of [0, 1])
            addEdge(corners[cornerIndex(uIndex, 0, vIndex)], corners[cornerIndex(uIndex, 1, vIndex)]);
    }
    for (const uIndex of [0, 1]) {
        for (const normalIndex of [0, 1])
            addEdge(corners[cornerIndex(uIndex, normalIndex, 0)], corners[cornerIndex(uIndex, normalIndex, 1)]);
    }
    return edges;
}

export function worldAABB(corners) {
    const minimum = [Infinity, Infinity, Infinity];
    const maximum = [-Infinity, -Infinity, -Infinity];
    for (const corner of corners) {
        for (let axis = 0; axis < 3; axis++) {
            minimum[axis] = Math.min(minimum[axis], corner[axis]);
            maximum[axis] = Math.max(maximum[axis], corner[axis]);
        }
    }
    return [minimum[0], minimum[1], minimum[2], maximum[0], maximum[1], maximum[2]];
}
