const DEGREES_TO_RADIANS = Math.PI / 180;

export function autoSegments(radius) {
    const cosineArgument = Math.max(-1, Math.min(1, 1 - 0.1 / radius));
    const segmentCount = Math.ceil(Math.PI / Math.acos(cosineArgument));
    return Math.max(12, Math.min(128, segmentCount));
}

export function smoothArc(frame, centerX, centerY, centerZ, radiusU, radiusV, startAngle, endAngle, segments) {
    const isClosed = Math.abs(endAngle - startAngle) >= 360 - 1e-9;
    const pointCount = isClosed ? segments : segments + 1;
    const startRadians = startAngle * DEGREES_TO_RADIANS;
    const spanRadians = (isClosed ? 360 : (endAngle - startAngle)) * DEGREES_TO_RADIANS;
    const points = new Array(pointCount * 3);
    for (let pointIndex = 0; pointIndex < pointCount; pointIndex++) {
        const angle = startRadians + spanRadians * (pointIndex / segments);
        frame.mapLocal(centerX, centerY, centerZ, Math.cos(angle) * radiusU, Math.sin(angle) * radiusV, 0, points, pointIndex * 3);
    }
    const edges = [];
    for (let segmentIndex = 0; segmentIndex < segments; segmentIndex++) {
        const nextIndex = isClosed ? (segmentIndex + 1) % pointCount : segmentIndex + 1;
        edges.push(
            points[segmentIndex * 3], points[segmentIndex * 3 + 1], points[segmentIndex * 3 + 2],
            points[nextIndex * 3], points[nextIndex * 3 + 1], points[nextIndex * 3 + 2]
        );
    }
    return edges;
}

export function smoothSphere(frame, centerX, centerY, centerZ, radius, segments) {
    const edges = [];
    const ringCount = Math.max(2, Math.floor(segments / 2));
    for (let ringIndex = 1; ringIndex < ringCount; ringIndex++) {
        const polarAngle = (ringIndex / ringCount) * Math.PI;
        const ringRadius = Math.sin(polarAngle) * radius;
        const normalOffset = Math.cos(polarAngle) * radius;
        const points = new Array(segments * 3);
        for (let pointIndex = 0; pointIndex < segments; pointIndex++) {
            const angle = (pointIndex / segments) * 2 * Math.PI;
            frame.mapLocal(centerX, centerY, centerZ, Math.cos(angle) * ringRadius, Math.sin(angle) * ringRadius, normalOffset, points, pointIndex * 3);
        }
        for (let pointIndex = 0; pointIndex < segments; pointIndex++) {
            const nextIndex = (pointIndex + 1) % segments;
            edges.push(
                points[pointIndex * 3], points[pointIndex * 3 + 1], points[pointIndex * 3 + 2],
                points[nextIndex * 3], points[nextIndex * 3 + 1], points[nextIndex * 3 + 2]
            );
        }
    }
    for (let meridianIndex = 0; meridianIndex < segments; meridianIndex++) {
        const meridianAngle = (meridianIndex / segments) * 2 * Math.PI;
        const points = new Array((segments + 1) * 3);
        for (let pointIndex = 0; pointIndex <= segments; pointIndex++) {
            const polarAngle = (pointIndex / segments) * Math.PI;
            const ringRadius = Math.sin(polarAngle) * radius;
            frame.mapLocal(centerX, centerY, centerZ, Math.cos(meridianAngle) * ringRadius, Math.sin(meridianAngle) * ringRadius, Math.cos(polarAngle) * radius, points, pointIndex * 3);
        }
        for (let pointIndex = 0; pointIndex < segments; pointIndex++) {
            edges.push(
                points[pointIndex * 3], points[pointIndex * 3 + 1], points[pointIndex * 3 + 2],
                points[(pointIndex + 1) * 3], points[(pointIndex + 1) * 3 + 1], points[(pointIndex + 1) * 3 + 2]
            );
        }
    }
    return edges;
}
