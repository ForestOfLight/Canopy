export function lift2D(axisMapping, center, planarEdges) {
    const centerCoordinates = [center.x, center.y, center.z];
    const normalCoordinate = centerCoordinates[axisMapping.normalAxis];
    const edges = [];
    for (let offset = 0; offset < planarEdges.length; offset += 4) {
        const start = [0, 0, 0];
        const end = [0, 0, 0];
        start[axisMapping.uAxis] = planarEdges[offset];
        start[axisMapping.vAxis] = planarEdges[offset + 1];
        start[axisMapping.normalAxis] = normalCoordinate;
        end[axisMapping.uAxis] = planarEdges[offset + 2];
        end[axisMapping.vAxis] = planarEdges[offset + 3];
        end[axisMapping.normalAxis] = normalCoordinate;
        edges.push(start[0], start[1], start[2], end[0], end[1], end[2]);
    }
    return edges;
}
