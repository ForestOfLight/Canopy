import { coveredSet, insideSet, boundaryEdges, allEdges } from './circle.js';

function angleDeg(dp, dq) {
    let a = Math.atan2(dq, dp) * 180 / Math.PI;
    return a < 0 ? a + 360 : a;
}
function inRange(a, start, end) {
    start = ((start % 360) + 360) % 360;
    end = ((end % 360) + 360) % 360;
    if (start <= end) return a >= start && a <= end;
    return a >= start || a <= end;              // wraps through 0
}
function filterSector(set, cp, cq, start, end) {
    const out = new Set();
    for (const k of set) {
        const [i, j] = k.split(',').map(Number);
        if (inRange(angleDeg(i + 0.5 - cp, j + 0.5 - cq), start, end)) out.add(k);
    }
    return out;
}
function capAt(cp, cq, ru, rv, deg) {
    const a = deg * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
    const inFrac = Math.max(0, 1 - 1 / Math.max(ru, rv));
    return [cp + ru * c * inFrac, cq + rv * s * inFrac, cp + ru * c, cq + rv * s];
}

export function arcVoxel2D(cp, cq, ru, rv, startDeg, endDeg, opts) {
    const { innerEdge = false, outerEdge = false, fill = false } = opts || {};
    if (ru <= 0 || rv <= 0 || startDeg === endDeg) return [];
    const isFullCircle = Math.abs(endDeg - startDeg) >= 360 - 1e-9;
    const cov = isFullCircle ? coveredSet(cp, cq, ru, rv) : filterSector(coveredSet(cp, cq, ru, rv), cp, cq, startDeg, endDeg);
    let insFull = insideSet(cp, cq, ru, rv);
    if (insFull.size === 0) insFull = coveredSet(cp, cq, ru, rv);
    const ins = isFullCircle ? insFull : filterSector(insFull, cp, cq, startDeg, endDeg);
    const caps = isFullCircle ? [] : [...capAt(cp, cq, ru, rv, startDeg), ...capAt(cp, cq, ru, rv, endDeg)];
    const groups = [];
    if (outerEdge) groups.push({ group: 'outer', segments: [...boundaryEdges(cov), ...caps] });
    if (innerEdge) groups.push({ group: 'inner', segments: [...boundaryEdges(ins), ...caps] });
    if (fill) {
        const region = (outerEdge || !innerEdge) ? cov : ins;
        groups.push({ group: 'fill', segments: allEdges(region) });
    }
    return groups;
}
