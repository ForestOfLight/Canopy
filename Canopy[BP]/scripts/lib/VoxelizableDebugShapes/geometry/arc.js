import { coveredSet, insideSet, boundaryEdges, allEdges } from './circle.js';

function angleDegrees(deltaU, deltaV) {
    const angle = Math.atan2(deltaV, deltaU) * 180 / Math.PI;
    return angle < 0 ? angle + 360 : angle;
}

function angleInRange(angle, startAngle, endAngle) {
    const normalizedStart = ((startAngle % 360) + 360) % 360;
    const normalizedEnd = ((endAngle % 360) + 360) % 360;
    if (normalizedStart <= normalizedEnd)
        return angle >= normalizedStart && angle <= normalizedEnd;
    return angle >= normalizedStart || angle <= normalizedEnd;
}

function filterCellsBySector(cells, centerU, centerV, startAngle, endAngle, signU, signV) {
    const sectorCells = new Set();
    for (const cellId of cells) {
        const [column, row] = cellId.split(',').map(Number);
        const cellAngle = angleDegrees(signU * (column + 0.5 - centerU), signV * (row + 0.5 - centerV));
        if (angleInRange(cellAngle, startAngle, endAngle))
            sectorCells.add(cellId);
    }
    return sectorCells;
}

function capSegment(centerU, centerV, radiusU, radiusV, capAngle, signU, signV) {
    const angle = capAngle * Math.PI / 180;
    const cosAngle = Math.cos(angle);
    const sinAngle = Math.sin(angle);
    const innerFraction = Math.max(0, 1 - 1 / Math.max(radiusU, radiusV));
    return [
        centerU + signU * radiusU * cosAngle * innerFraction,
        centerV + signV * radiusV * sinAngle * innerFraction,
        centerU + signU * radiusU * cosAngle,
        centerV + signV * radiusV * sinAngle,
    ];
}

export function arcVoxel2D(centerU, centerV, radiusU, radiusV, startAngle, endAngle, options, signU = 1, signV = 1) {
    const { innerEdge = false, outerEdge = false, fill = false } = options || {};
    if (radiusU <= 0 || radiusV <= 0 || startAngle === endAngle)
        return [];
    const isFullCircle = Math.abs(endAngle - startAngle) >= 360 - 1e-9;
    const allCoveredCells = coveredSet(centerU, centerV, radiusU, radiusV);
    const coveredCells = isFullCircle
        ? allCoveredCells
        : filterCellsBySector(allCoveredCells, centerU, centerV, startAngle, endAngle, signU, signV);
    let allInsideCells = insideSet(centerU, centerV, radiusU, radiusV);
    if (allInsideCells.size === 0)
        allInsideCells = allCoveredCells;
    const insideCells = isFullCircle
        ? allInsideCells
        : filterCellsBySector(allInsideCells, centerU, centerV, startAngle, endAngle, signU, signV);
    const capSegments = isFullCircle
        ? []
        : [
            ...capSegment(centerU, centerV, radiusU, radiusV, startAngle, signU, signV),
            ...capSegment(centerU, centerV, radiusU, radiusV, endAngle, signU, signV),
        ];
    const groups = [];
    if (outerEdge)
        groups.push({ group: 'outer', segments: [...boundaryEdges(coveredCells), ...capSegments] });
    if (innerEdge)
        groups.push({ group: 'inner', segments: [...boundaryEdges(insideCells), ...capSegments] });
    if (fill) {
        const fillRegion = (outerEdge || !innerEdge) ? coveredCells : insideCells;
        groups.push({ group: 'fill', segments: allEdges(fillRegion) });
    }
    return groups;
}
