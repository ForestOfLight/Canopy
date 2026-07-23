import { circleVoxel2D } from './circle.js';
import { planeAxes, lift2D } from './plane.js';
import { mergeAxisAligned } from './merge.js';
import { voxelizeOutline } from './line.js';

/** Axis-aligned → lifted+merged 2D voxel groups; rotated → outer outline from the smooth fallback. */
export function planarVoxel(basis, center, ru, rv, opts, smoothFallbackSegments) {
    if (ru <= 0 || rv <= 0) return [];
    const axes = planeAxes(basis);
    if (axes) {
        const cArr = [center.x, center.y, center.z];
        const g2d = circleVoxel2D(cArr[axes.u], cArr[axes.v], ru, rv, opts);
        return g2d.map((g) => ({ group: g.group, segments: mergeAxisAligned(lift2D(axes, center, g.segments)) }));
    }
    return [{ group: 'outer', segments: voxelizeOutline(smoothFallbackSegments) }];
}
