import { circleVoxel2D } from './circle.js';
import { lift2D } from './plane.js';
import { mergeAxisAligned } from './merge.js';
import { voxelizeOutline } from './line.js';

export function planarVoxel(frame, center, radiusU, radiusV, options, smoothFallbackSegments) {
    if (radiusU <= 0 || radiusV <= 0)
        return [];
    const axisMapping = frame.planeAxes();
    if (axisMapping) {
        const centerCoordinates = [center.x, center.y, center.z];
        const planarGroups = circleVoxel2D(
            centerCoordinates[axisMapping.uAxis], centerCoordinates[axisMapping.vAxis], radiusU, radiusV, options
        );
        return planarGroups.map((planarGroup) => ({
            group: planarGroup.group,
            segments: mergeAxisAligned(lift2D(axisMapping, center, planarGroup.segments)),
        }));
    }
    return [{ group: 'outer', segments: voxelizeOutline(smoothFallbackSegments) }];
}
