import { mapLocal } from './orient.js';

/** 8 world corners. hu along local +X (u), hv along local +Z (v), hn along normal (n). */
export function boxCorners(basis, cx, cy, cz, hu, hv, hn) {
    const c = [];
    for (const su of [-1, 1]) {for (const sn of [-1, 1]) {for (const sv of [-1, 1]) {
        const p = [0, 0, 0];
        mapLocal(basis, cx, cy, cz, su * hu, sv * hv, sn * hn, p, 0);
        c.push(p);
    }}}
    return c; // index = ((su bit)*2 + (sn bit))*2 + (sv bit)
}

export function boxEdges(c) {
    const idx = (iu, in_, iv) => (iu * 2 + in_) * 2 + iv;
    const segs = [];
    const push = (a, b) => segs.push(a[0], a[1], a[2], b[0], b[1], b[2]);
    for (const n of [0, 1]) for (const v of [0, 1]) push(c[idx(0, n, v)], c[idx(1, n, v)]); // along u
    for (const u of [0, 1]) for (const v of [0, 1]) push(c[idx(u, 0, v)], c[idx(u, 1, v)]); // along n
    for (const u of [0, 1]) for (const n of [0, 1]) push(c[idx(u, n, 0)], c[idx(u, n, 1)]); // along v
    return segs;
}

export function worldAABB(c) {
    const a = [Infinity, Infinity, Infinity]; const b = [-Infinity, -Infinity, -Infinity];
    for (const p of c) for (let k = 0; k < 3; k++) { a[k] = Math.min(a[k], p[k]); b[k] = Math.max(b[k], p[k]); }
    return [a[0], a[1], a[2], b[0], b[1], b[2]];
}
