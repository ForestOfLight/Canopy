import { mergeAxisAligned } from './merge.js';

function addNonEmptyEdge(edges, startX, startY, startZ, endX, endY, endZ) {
    if (startX === endX && startY === endY && startZ === endZ)
        return;
    edges.push(startX, startY, startZ, endX, endY, endZ);
}

export function wireBox(minX, minY, minZ, maxX, maxY, maxZ) {
    const edges = [];
    const xFaces = [minX, maxX];
    const yFaces = [minY, maxY];
    const zFaces = [minZ, maxZ];
    for (const y of yFaces) {
        for (const z of zFaces)
            addNonEmptyEdge(edges, minX, y, z, maxX, y, z);
    }
    for (const x of xFaces) {
        for (const z of zFaces)
            addNonEmptyEdge(edges, x, minY, z, x, maxY, z);
    }
    for (const x of xFaces) {
        for (const y of yFaces)
            addNonEmptyEdge(edges, x, y, minZ, x, y, maxZ);
    }
    return mergeAxisAligned(edges);
}

export function latticeFill(minX, minY, minZ, maxX, maxY, maxZ) {
    const edges = [];
    for (let y = minY; y <= maxY; y++) {
        for (let z = minZ; z <= maxZ; z++)
            addNonEmptyEdge(edges, minX, y, z, maxX, y, z);
    }
    for (let x = minX; x <= maxX; x++) {
        for (let z = minZ; z <= maxZ; z++)
            addNonEmptyEdge(edges, x, minY, z, x, maxY, z);
    }
    for (let x = minX; x <= maxX; x++) {
        for (let y = minY; y <= maxY; y++)
            addNonEmptyEdge(edges, x, y, minZ, x, y, maxZ);
    }
    return mergeAxisAligned(edges);
}

export function boxVoxel(minX, minY, minZ, maxX, maxY, maxZ, options) {
    const { innerEdge = false, outerEdge = false, fill = false } = options || {};
    const outerMinX = Math.floor(minX);
    const outerMinY = Math.floor(minY);
    const outerMinZ = Math.floor(minZ);
    const outerMaxX = Math.ceil(maxX);
    const outerMaxY = Math.ceil(maxY);
    const outerMaxZ = Math.ceil(maxZ);
    let innerMinX = Math.ceil(minX);
    let innerMinY = Math.ceil(minY);
    let innerMinZ = Math.ceil(minZ);
    let innerMaxX = Math.floor(maxX);
    let innerMaxY = Math.floor(maxY);
    let innerMaxZ = Math.floor(maxZ);
    const innerIsEmpty = innerMinX > innerMaxX || innerMinY > innerMaxY || innerMinZ > innerMaxZ;
    if (innerIsEmpty) {
        innerMinX = outerMinX;
        innerMinY = outerMinY;
        innerMinZ = outerMinZ;
        innerMaxX = outerMaxX;
        innerMaxY = outerMaxY;
        innerMaxZ = outerMaxZ;
    }

    const groups = [];
    if (outerEdge)
        groups.push({ group: 'outer', segments: wireBox(outerMinX, outerMinY, outerMinZ, outerMaxX, outerMaxY, outerMaxZ) });
    if (innerEdge)
        groups.push({ group: 'inner', segments: wireBox(innerMinX, innerMinY, innerMinZ, innerMaxX, innerMaxY, innerMaxZ) });
    if (fill) {
        const fillToOuter = outerEdge || !innerEdge;
        const [fillMinX, fillMinY, fillMinZ, fillMaxX, fillMaxY, fillMaxZ] = fillToOuter
            ? [outerMinX, outerMinY, outerMinZ, outerMaxX, outerMaxY, outerMaxZ]
            : [innerMinX, innerMinY, innerMinZ, innerMaxX, innerMaxY, innerMaxZ];
        groups.push({ group: 'fill', segments: latticeFill(fillMinX, fillMinY, fillMinZ, fillMaxX, fillMaxY, fillMaxZ) });
    }
    return groups;
}
