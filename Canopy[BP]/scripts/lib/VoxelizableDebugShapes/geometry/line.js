import { mergeAxisAligned } from './merge.js';

export function voxelLine(startX, startY, startZ, endX, endY, endZ) {
    startX = Math.round(startX);
    startY = Math.round(startY);
    startZ = Math.round(startZ);
    endX = Math.round(endX);
    endY = Math.round(endY);
    endZ = Math.round(endZ);
    const deltaX = Math.abs(endX - startX);
    const deltaY = Math.abs(endY - startY);
    const deltaZ = Math.abs(endZ - startZ);
    const stepX = Math.sign(endX - startX);
    const stepY = Math.sign(endY - startY);
    const stepZ = Math.sign(endZ - startZ);
    const totalSteps = deltaX + deltaY + deltaZ;
    if (totalSteps === 0)
        return [];

    let distanceToNextX = deltaX > 0 ? 0.5 / deltaX : Infinity;
    let distanceToNextY = deltaY > 0 ? 0.5 / deltaY : Infinity;
    let distanceToNextZ = deltaZ > 0 ? 0.5 / deltaZ : Infinity;

    let currentX = startX;
    let currentY = startY;
    let currentZ = startZ;
    const segments = [];
    for (let step = 0; step < totalSteps; step++) {
        const previousX = currentX;
        const previousY = currentY;
        const previousZ = currentZ;
        if (distanceToNextX <= distanceToNextY && distanceToNextX <= distanceToNextZ) {
            currentX += stepX;
            distanceToNextX += 1 / deltaX;
        } else if (distanceToNextY <= distanceToNextZ) {
            currentY += stepY;
            distanceToNextY += 1 / deltaY;
        } else {
            currentZ += stepZ;
            distanceToNextZ += 1 / deltaZ;
        }
        segments.push(previousX, previousY, previousZ, currentX, currentY, currentZ);
    }
    return mergeAxisAligned(segments);
}

export function voxelizeOutline(segments) {
    const voxelizedSegments = [];
    for (let offset = 0; offset < segments.length; offset += 6) {
        const lineSegments = voxelLine(
            segments[offset], segments[offset + 1], segments[offset + 2],
            segments[offset + 3], segments[offset + 4], segments[offset + 5]
        );
        for (const coordinate of lineSegments)
            voxelizedSegments.push(coordinate);
    }
    return mergeAxisAligned(voxelizedSegments);
}
