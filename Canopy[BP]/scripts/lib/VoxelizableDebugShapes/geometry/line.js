import { mergeAxisAligned } from './merge.js';

/**
 * Staircase along block edges from (x0,y0,z0) to (x1,y1,z1). One unit step per
 * iteration along the axis whose next grid boundary is nearest the ideal line
 * (unit-grid Amanatides); ties break X→Y→Z. Endpoints snap to integer corners.
 */
export function voxelLine(x0, y0, z0, x1, y1, z1) {
    x0 = Math.round(x0); y0 = Math.round(y0); z0 = Math.round(z0);
    x1 = Math.round(x1); y1 = Math.round(y1); z1 = Math.round(z1);
    const dx = Math.abs(x1 - x0); const dy = Math.abs(y1 - y0); const dz = Math.abs(z1 - z0);
    const sx = Math.sign(x1 - x0); const sy = Math.sign(y1 - y0); const sz = Math.sign(z1 - z0);
    const steps = dx + dy + dz;
    if (steps === 0) return [];

    let tx = dx > 0 ? 0.5 / dx : Infinity;
    let ty = dy > 0 ? 0.5 / dy : Infinity;
    let tz = dz > 0 ? 0.5 / dz : Infinity;

    let x = x0; let y = y0; let z = z0;
    const segs = [];
    for (let s = 0; s < steps; s++) {
        const px = x; const py = y; const pz = z;
        if (tx <= ty && tx <= tz) { x += sx; tx += 1 / dx; }
        else if (ty <= tz) { y += sy; ty += 1 / dy; }
        else { z += sz; tz += 1 / dz; }
        segs.push(px, py, pz, x, y, z);
    }
    return mergeAxisAligned(segs);
}

/** Voxelize an arbitrary segment set (rotated-orientation fallback, outline only). */
export function voxelizeOutline(segments) {
    const out = [];
    for (let i = 0; i < segments.length; i += 6) {
        const v = voxelLine(segments[i], segments[i + 1], segments[i + 2],
            segments[i + 3], segments[i + 4], segments[i + 5]);
        for (const n of v) out.push(n);
    }
    return mergeAxisAligned(out);
}
