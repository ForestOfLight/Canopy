import { mergeAxisAligned } from './merge.js';

function pushEdge(out, ax, ay, az, bx, by, bz) {
    if (ax === bx && ay === by && az === bz) return; // drop zero-length
    out.push(ax, ay, az, bx, by, bz);
}

export function wireBox(x0, y0, z0, x1, y1, z1) {
    const out = [];
    const xs = [x0, x1]; const ys = [y0, y1]; const zs = [z0, z1];
    // 4 edges along X
    for (const y of ys) for (const z of zs) pushEdge(out, x0, y, z, x1, y, z);
    // 4 edges along Y
    for (const x of xs) for (const z of zs) pushEdge(out, x, y0, z, x, y1, z);
    // 4 edges along Z
    for (const x of xs) for (const y of ys) pushEdge(out, x, y, z0, x, y, z1);
    // dedup collapsed duplicates from a flat axis
    return mergeAxisAligned(out);
}

export function latticeFill(x0, y0, z0, x1, y1, z1) {
    const out = [];
    for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) pushEdge(out, x0, y, z, x1, y, z);
    for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) pushEdge(out, x, y0, z, x, y1, z);
    for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) pushEdge(out, x, y, z0, x, y, z1);
    return mergeAxisAligned(out);
}

export function boxVoxel(minX, minY, minZ, maxX, maxY, maxZ, opts) {
    const { innerEdge = false, outerEdge = false, fill = false } = opts || {};
    const oX0 = Math.floor(minX); const oY0 = Math.floor(minY); const oZ0 = Math.floor(minZ);
    const oX1 = Math.ceil(maxX); const oY1 = Math.ceil(maxY); const oZ1 = Math.ceil(maxZ);
    let iX0 = Math.ceil(minX); let iY0 = Math.ceil(minY); let iZ0 = Math.ceil(minZ);
    let iX1 = Math.floor(maxX); let iY1 = Math.floor(maxY); let iZ1 = Math.floor(maxZ);
    const innerEmpty = iX0 > iX1 || iY0 > iY1 || iZ0 > iZ1;
    if (innerEmpty) { iX0 = oX0; iY0 = oY0; iZ0 = oZ0; iX1 = oX1; iY1 = oY1; iZ1 = oZ1; }

    const groups = [];
    if (outerEdge) groups.push({ group: 'outer', segments: wireBox(oX0, oY0, oZ0, oX1, oY1, oZ1) });
    if (innerEdge) groups.push({ group: 'inner', segments: wireBox(iX0, iY0, iZ0, iX1, iY1, iZ1) });
    if (fill) {
        // fill to the active silhouette: outer if outer active (or both), else inner
        const useOuter = outerEdge || !innerEdge;
        const [fx0, fy0, fz0, fx1, fy1, fz1] = useOuter
            ? [oX0, oY0, oZ0, oX1, oY1, oZ1]
            : [iX0, iY0, iZ0, iX1, iY1, iZ1];
        groups.push({ group: 'fill', segments: latticeFill(fx0, fy0, fz0, fx1, fy1, fz1) });
    }
    return groups;
}
