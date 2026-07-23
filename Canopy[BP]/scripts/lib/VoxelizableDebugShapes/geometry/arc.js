import { coveredSet, insideSet, boundaryEdges, allEdges } from './circle.js';

function angleDeg(dp, dq) {
    const a = Math.atan2(dq, dp) * 180 / Math.PI;
    return a < 0 ? a + 360 : a;
}
function inRange(a, start, end) {
    start = ((start % 360) + 360) % 360;
    end = ((end % 360) + 360) % 360;
    if (start <= end) return a >= start && a <= end;
    return a >= start || a <= end;              // wraps through 0
}
// su/sv are the in-plane axis signs (from planeAxes): local +X maps to su·(world u),
// local +Z to sv·(world v). Angles/caps are defined in the LOCAL frame, so the world
// cell offsets are pre-multiplied by the signs before measuring/placing them. Without
// this, a sign-flipped-but-axis-aligned orientation (e.g. yaw 180) reflects the sector.
function filterSector(set, cp, cq, start, end, su, sv) {
    const out = new Set();
    for (const k of set) {
        const [i, j] = k.split(',').map(Number);
        if (inRange(angleDeg(su * (i + 0.5 - cp), sv * (j + 0.5 - cq)), start, end)) out.add(k);
    }
    return out;
}
function capAt(cp, cq, ru, rv, deg, su, sv) {
    const a = deg * Math.PI / 180; const c = Math.cos(a); const s = Math.sin(a);
    const inFrac = Math.max(0, 1 - 1 / Math.max(ru, rv));
    return [cp + su * ru * c * inFrac, cq + sv * rv * s * inFrac, cp + su * ru * c, cq + sv * rv * s];
}

export function arcVoxel2D(cp, cq, ru, rv, startDeg, endDeg, opts, su = 1, sv = 1) {
    const { innerEdge = false, outerEdge = false, fill = false } = opts || {};
    if (ru <= 0 || rv <= 0 || startDeg === endDeg) return [];
    const isFullCircle = Math.abs(endDeg - startDeg) >= 360 - 1e-9;
    const cov = isFullCircle ? coveredSet(cp, cq, ru, rv) : filterSector(coveredSet(cp, cq, ru, rv), cp, cq, startDeg, endDeg, su, sv);
    let insFull = insideSet(cp, cq, ru, rv);
    if (insFull.size === 0) insFull = coveredSet(cp, cq, ru, rv);
    const ins = isFullCircle ? insFull : filterSector(insFull, cp, cq, startDeg, endDeg, su, sv);
    const caps = isFullCircle ? [] : [...capAt(cp, cq, ru, rv, startDeg, su, sv), ...capAt(cp, cq, ru, rv, endDeg, su, sv)];
    const groups = [];
    if (outerEdge) groups.push({ group: 'outer', segments: [...boundaryEdges(cov), ...caps] });
    if (innerEdge) groups.push({ group: 'inner', segments: [...boundaryEdges(ins), ...caps] });
    if (fill) {
        const region = (outerEdge || !innerEdge) ? cov : ins;
        groups.push({ group: 'fill', segments: allEdges(region) });
    }
    return groups;
}
