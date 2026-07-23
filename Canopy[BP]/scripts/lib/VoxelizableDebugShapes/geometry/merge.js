/**
 * Merge collinear, endpoint-sharing axis-aligned segments into maximal runs.
 * `segments` is flat [x1,y1,z1,x2,y2,z2,...]. Returns a new flat array.
 */
export function mergeAxisAligned(segments) {
    const passthrough = [];
    // key -> array of [lo, hi] intervals along the varying axis
    const groups = new Map();

    for (let i = 0; i < segments.length; i += 6) {
        const x1 = segments[i], y1 = segments[i + 1], z1 = segments[i + 2];
        const x2 = segments[i + 3], y2 = segments[i + 4], z2 = segments[i + 5];
        const dx = x1 !== x2, dy = y1 !== y2, dz = z1 !== z2;
        const varyCount = (dx ? 1 : 0) + (dy ? 1 : 0) + (dz ? 1 : 0);
        if (varyCount !== 1) { // degenerate or diagonal — leave as-is
            passthrough.push(x1, y1, z1, x2, y2, z2);
            continue;
        }
        let axis, key, lo, hi;
        if (dx) { axis = 0; key = `0|${y1}|${z1}`; lo = Math.min(x1, x2); hi = Math.max(x1, x2); }
        else if (dy) { axis = 1; key = `1|${x1}|${z1}`; lo = Math.min(y1, y2); hi = Math.max(y1, y2); }
        else { axis = 2; key = `2|${x1}|${y1}`; lo = Math.min(z1, z2); hi = Math.max(z1, z2); }
        let g = groups.get(key);
        if (!g) { g = { axis, a: dx ? y1 : x1, b: dz ? y1 : z1, fixed: [x1, y1, z1], intervals: [] }; groups.set(key, g); }
        g.intervals.push([lo, hi]);
    }

    const out = [];
    for (const g of groups.values()) {
        g.intervals.sort((p, q) => p[0] - q[0]);
        let [clo, chi] = g.intervals[0];
        const merged = [];
        for (let k = 1; k < g.intervals.length; k++) {
            const [lo, hi] = g.intervals[k];
            if (lo <= chi) chi = Math.max(chi, hi);        // overlap or touch
            else { merged.push([clo, chi]); clo = lo; chi = hi; }
        }
        merged.push([clo, chi]);
        const f = g.fixed;
        for (const [lo, hi] of merged) {
            if (g.axis === 0) out.push(lo, f[1], f[2], hi, f[1], f[2]);
            else if (g.axis === 1) out.push(f[0], lo, f[2], f[0], hi, f[2]);
            else out.push(f[0], f[1], lo, f[0], f[1], hi);
        }
    }
    for (const v of passthrough) out.push(v);
    return out;
}
