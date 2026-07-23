import { circleVoxel2D } from './circle.js';
import { planeAxes, lift2D } from './plane.js';
import { mergeAxisAligned } from './merge.js';

/** Stacked block-circles along the slice axis. Returns null when basis is not axis-aligned. */
export function sphereVoxel(basis, center, r, opts) {
    if (r <= 0) return [];
    const axes = planeAxes(basis);
    if (!axes) return null;
    const cArr = [center.x, center.y, center.z];
    const cp = cArr[axes.u], cq = cArr[axes.v], cN = cArr[axes.n];
    const acc = { outer: [], inner: [], fill: [] };
    const wLo = Math.floor(cN - r), wHi = Math.ceil(cN + r) - 1;
    for (let w = wLo; w <= wHi; w++) {
        const dNear = Math.max(0, Math.max(w - cN, cN - (w + 1)));
        const rl = Math.sqrt(Math.max(0, r * r - dNear * dNear));
        if (rl <= 0) continue;
        const lc = [center.x, center.y, center.z];
        lc[axes.n] = w; // place this ring at plane n = w
        const layerCenter = { x: lc[0], y: lc[1], z: lc[2] };
        for (const g of circleVoxel2D(cp, cq, rl, rl, opts))
            acc[g.group].push(...lift2D(axes, layerCenter, g.segments));
    }
    const out = [];
    if (opts.outerEdge && acc.outer.length) out.push({ group: 'outer', segments: mergeAxisAligned(acc.outer) });
    if (opts.innerEdge && acc.inner.length) out.push({ group: 'inner', segments: mergeAxisAligned(acc.inner) });
    if (opts.fill && acc.fill.length) out.push({ group: 'fill', segments: mergeAxisAligned(acc.fill) });
    return out;
}
