const cellKey = (column, row) => column + ',' + row;

function collectCells(centerU, centerV, radiusU, radiusV, isMember) {
    const cells = new Set();
    if (radiusU <= 0 || radiusV <= 0)
        return cells;
    const columnStart = Math.floor(centerU - radiusU) - 1;
    const columnEnd = Math.ceil(centerU + radiusU) + 1;
    const rowStart = Math.floor(centerV - radiusV) - 1;
    const rowEnd = Math.ceil(centerV + radiusV) + 1;
    for (let column = columnStart; column <= columnEnd; column++) {
        for (let row = rowStart; row <= rowEnd; row++) {
            if (isMember(column, row))
                cells.add(cellKey(column, row));
        }
    }
    return cells;
}

export function coveredSet(centerU, centerV, radiusU, radiusV) {
    return collectCells(centerU, centerV, radiusU, radiusV, (column, row) => {
        const nearestU = Math.min(Math.max(centerU, column), column + 1);
        const nearestV = Math.min(Math.max(centerV, row), row + 1);
        const normalizedU = (nearestU - centerU) / radiusU;
        const normalizedV = (nearestV - centerV) / radiusV;
        return normalizedU * normalizedU + normalizedV * normalizedV < 1;
    });
}

export function insideSet(centerU, centerV, radiusU, radiusV) {
    return collectCells(centerU, centerV, radiusU, radiusV, (column, row) => {
        const farthestU = Math.abs(column - centerU) > Math.abs(column + 1 - centerU) ? column : column + 1;
        const farthestV = Math.abs(row - centerV) > Math.abs(row + 1 - centerV) ? row : row + 1;
        const normalizedU = (farthestU - centerU) / radiusU;
        const normalizedV = (farthestV - centerV) / radiusV;
        return normalizedU * normalizedU + normalizedV * normalizedV <= 1;
    });
}

export function boundaryEdges(cells) {
    const edges = [];
    for (const cellId of cells) {
        const [column, row] = cellId.split(',').map(Number);
        if (!cells.has(cellKey(column, row - 1)))
            edges.push(column, row, column + 1, row);
        if (!cells.has(cellKey(column, row + 1)))
            edges.push(column, row + 1, column + 1, row + 1);
        if (!cells.has(cellKey(column - 1, row)))
            edges.push(column, row, column, row + 1);
        if (!cells.has(cellKey(column + 1, row)))
            edges.push(column + 1, row, column + 1, row + 1);
    }
    return edges;
}

export function allEdges(cells) {
    const edges = [];
    for (const cellId of cells) {
        const [column, row] = cellId.split(',').map(Number);
        edges.push(
            column, row, column + 1, row,
            column, row + 1, column + 1, row + 1,
            column, row, column, row + 1,
            column + 1, row, column + 1, row + 1
        );
    }
    return edges;
}

export function circleVoxel2D(centerU, centerV, radiusU, radiusV, options) {
    const { innerEdge = false, outerEdge = false, fill = false } = options || {};
    if (radiusU <= 0 || radiusV <= 0)
        return [];
    const coveredCells = coveredSet(centerU, centerV, radiusU, radiusV);
    let insideCells = insideSet(centerU, centerV, radiusU, radiusV);
    if (insideCells.size === 0)
        insideCells = coveredCells;
    const groups = [];
    if (outerEdge)
        groups.push({ group: 'outer', segments: boundaryEdges(coveredCells) });
    if (innerEdge)
        groups.push({ group: 'inner', segments: boundaryEdges(insideCells) });
    if (fill) {
        const fillRegion = (outerEdge || !innerEdge) ? coveredCells : insideCells;
        groups.push({ group: 'fill', segments: allEdges(fillRegion) });
    }
    return groups;
}
