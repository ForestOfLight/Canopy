export function normalizeCorners(a, b) {
    return {
        min: {
            x: Math.floor(Math.min(a.x, b.x)),
            y: Math.floor(Math.min(a.y, b.y)),
            z: Math.floor(Math.min(a.z, b.z))
        },
        max: {
            x: Math.floor(Math.max(a.x, b.x)),
            y: Math.floor(Math.max(a.y, b.y)),
            z: Math.floor(Math.max(a.z, b.z))
        }
    };
}

export function regionCapacity(min, max) {
    return (max.x - min.x + 1) * (max.y - min.y + 1) * (max.z - min.z + 1);
}

export function sameCorner(a, b) {
    return a.x === b.x && a.y === b.y && a.z === b.z;
}
