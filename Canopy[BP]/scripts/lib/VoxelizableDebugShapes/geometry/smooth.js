import { mapLocal } from './orient.js';

const DEG = Math.PI / 180;

export function autoSegments(r) {
    const arg = Math.max(-1, Math.min(1, 1 - 0.1 / r));
    const n = Math.ceil(Math.PI / Math.acos(arg));
    return Math.max(12, Math.min(128, n));
}

export function smoothArc(basis, cx, cy, cz, ru, rv, startDeg, endDeg, segments) {
    const closed = Math.abs(endDeg - startDeg) >= 360 - 1e-9;
    const count = closed ? segments : segments; // segment count either way
    const pts = closed ? segments : segments + 1;
    const start = startDeg * DEG;
    const span = (closed ? 360 : (endDeg - startDeg)) * DEG;
    const p = new Array(pts * 3);
    for (let i = 0; i < pts; i++) {
        const t = closed ? (i / segments) : (i / segments);
        const a = start + span * t;
        mapLocal(basis, cx, cy, cz, Math.cos(a) * ru, Math.sin(a) * rv, 0, p, i * 3);
    }
    const out = [];
    for (let i = 0; i < count; i++) {
        const j = closed ? (i + 1) % pts : i + 1;
        out.push(p[i * 3], p[i * 3 + 1], p[i * 3 + 2], p[j * 3], p[j * 3 + 1], p[j * 3 + 2]);
    }
    return out;
}

export function smoothSphere(basis, cx, cy, cz, r, segments) {
    const out = [];
    const rings = Math.max(2, Math.floor(segments / 2)); // latitude divisions
    // latitude rings (constant polar angle), drawn as circles in the u/v plane offset along n
    for (let k = 1; k < rings; k++) {
        const phi = (k / rings) * Math.PI;        // 0..π
        const rr = Math.sin(phi) * r;
        const w = Math.cos(phi) * r;              // offset along normal
        const p = new Array(segments * 3);
        for (let i = 0; i < segments; i++) {
            const a = (i / segments) * 2 * Math.PI;
            mapLocal(basis, cx, cy, cz, Math.cos(a) * rr, Math.sin(a) * rr, w, p, i * 3);
        }
        for (let i = 0; i < segments; i++) {
            const j = (i + 1) % segments;
            out.push(p[i * 3], p[i * 3 + 1], p[i * 3 + 2], p[j * 3], p[j * 3 + 1], p[j * 3 + 2]);
        }
    }
    // longitude rings (great circles through the poles)
    for (let m = 0; m < segments; m++) {
        const theta = (m / segments) * 2 * Math.PI;
        const p = new Array((segments + 1) * 3);
        for (let i = 0; i <= segments; i++) {
            const phi = (i / segments) * Math.PI;
            const rr = Math.sin(phi) * r;
            mapLocal(basis, cx, cy, cz, Math.cos(theta) * rr, Math.sin(theta) * rr, Math.cos(phi) * r, p, i * 3);
        }
        for (let i = 0; i < segments; i++)
            out.push(p[i * 3], p[i * 3 + 1], p[i * 3 + 2], p[(i + 1) * 3], p[(i + 1) * 3 + 1], p[(i + 1) * 3 + 2]);
    }
    return out;
}
