import { isAxisAligned } from './orient.js';

/** For an axis-aligned basis, which world axes are u and v, plus the normal axis. */
export function planeAxes(basis) {
    if (!isAxisAligned(basis)) return null;
    const axisOf = (o) => {
        for (let k = 0; k < 3; k++) if (Math.abs(basis[o + k]) > 0.5) return { axis: k, sign: Math.sign(basis[o + k]) };
        return { axis: 0, sign: 1 };
    };
    const U = axisOf(0); const V = axisOf(3); const N = axisOf(6);
    return { u: U.axis, su: U.sign, v: V.axis, sv: V.sign, n: N.axis };
}

/** Lift 2D edges (world coords along u,v) onto the plane at center[n]. */
export function lift2D(axes, center, seg2D) {
    const cArr = [center.x, center.y, center.z];
    const out = [];
    for (let i = 0; i < seg2D.length; i += 4) {
        const a = [0, 0, 0]; const b = [0, 0, 0];
        a[axes.u] = seg2D[i]; a[axes.v] = seg2D[i + 1]; a[axes.n] = cArr[axes.n];
        b[axes.u] = seg2D[i + 2]; b[axes.v] = seg2D[i + 3]; b[axes.n] = cArr[axes.n];
        out.push(a[0], a[1], a[2], b[0], b[1], b[2]);
    }
    return out;
}
