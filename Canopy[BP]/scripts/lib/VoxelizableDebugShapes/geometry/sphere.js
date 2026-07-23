import { circleVoxel2D } from './circle.js';
import { lift2D } from './plane.js';
import { mergeAxisAligned } from './merge.js';

export function sphereVoxel(frame, center, radius, options) {
    if (radius <= 0)
        return [];
    const axisMapping = frame.planeAxes();
    if (!axisMapping)
        return null;
    const centerCoordinates = [center.x, center.y, center.z];
    const centerU = centerCoordinates[axisMapping.uAxis];
    const centerV = centerCoordinates[axisMapping.vAxis];
    const centerNormal = centerCoordinates[axisMapping.normalAxis];
    const groupSegments = { outer: [], inner: [], fill: [] };
    const sliceStart = Math.floor(centerNormal - radius);
    const sliceEnd = Math.ceil(centerNormal + radius) - 1;
    for (let slice = sliceStart; slice <= sliceEnd; slice++) {
        const nearestDistance = Math.max(0, Math.max(slice - centerNormal, centerNormal - (slice + 1)));
        const sliceRadius = Math.sqrt(Math.max(0, radius * radius - nearestDistance * nearestDistance));
        if (sliceRadius <= 0)
            continue;
        const sliceCenterCoordinates = [center.x, center.y, center.z];
        sliceCenterCoordinates[axisMapping.normalAxis] = slice;
        const sliceCenter = { x: sliceCenterCoordinates[0], y: sliceCenterCoordinates[1], z: sliceCenterCoordinates[2] };
        for (const sliceGroup of circleVoxel2D(centerU, centerV, sliceRadius, sliceRadius, options))
            groupSegments[sliceGroup.group].push(...lift2D(axisMapping, sliceCenter, sliceGroup.segments));
    }
    const groups = [];
    if (options.outerEdge && groupSegments.outer.length)
        groups.push({ group: 'outer', segments: mergeAxisAligned(groupSegments.outer) });
    if (options.innerEdge && groupSegments.inner.length)
        groups.push({ group: 'inner', segments: mergeAxisAligned(groupSegments.inner) });
    if (options.fill && groupSegments.fill.length)
        groups.push({ group: 'fill', segments: mergeAxisAligned(groupSegments.fill) });
    return groups;
}
