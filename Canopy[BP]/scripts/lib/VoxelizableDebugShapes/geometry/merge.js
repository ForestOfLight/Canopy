function collectRuns(segments) {
    const nonAxisAligned = [];
    const runsByLine = new Map();
    for (let offset = 0; offset < segments.length; offset += 6) {
        const startX = segments[offset];
        const startY = segments[offset + 1];
        const startZ = segments[offset + 2];
        const endX = segments[offset + 3];
        const endY = segments[offset + 4];
        const endZ = segments[offset + 5];
        const variesX = startX !== endX;
        const variesY = startY !== endY;
        const variesZ = startZ !== endZ;
        const varyingAxisCount = (variesX ? 1 : 0) + (variesY ? 1 : 0) + (variesZ ? 1 : 0);
        if (varyingAxisCount !== 1) {
            nonAxisAligned.push(startX, startY, startZ, endX, endY, endZ);
            continue;
        }
        let axis;
        let lineKey;
        let intervalStart;
        let intervalEnd;
        if (variesX) {
            axis = 0;
            lineKey = `0|${startY}|${startZ}`;
            intervalStart = Math.min(startX, endX);
            intervalEnd = Math.max(startX, endX);
        } else if (variesY) {
            axis = 1;
            lineKey = `1|${startX}|${startZ}`;
            intervalStart = Math.min(startY, endY);
            intervalEnd = Math.max(startY, endY);
        } else {
            axis = 2;
            lineKey = `2|${startX}|${startY}`;
            intervalStart = Math.min(startZ, endZ);
            intervalEnd = Math.max(startZ, endZ);
        }
        let run = runsByLine.get(lineKey);
        if (!run) {
            run = { axis, anchor: [startX, startY, startZ], intervals: [] };
            runsByLine.set(lineKey, run);
        }
        run.intervals.push([intervalStart, intervalEnd]);
    }
    return { runsByLine, nonAxisAligned };
}

function mergeIntervals(intervals) {
    intervals.sort((left, right) => left[0] - right[0]);
    const merged = [];
    let [currentStart, currentEnd] = intervals[0];
    for (let index = 1; index < intervals.length; index++) {
        const [nextStart, nextEnd] = intervals[index];
        if (nextStart <= currentEnd) {
            currentEnd = Math.max(currentEnd, nextEnd);
        } else {
            merged.push([currentStart, currentEnd]);
            currentStart = nextStart;
            currentEnd = nextEnd;
        }
    }
    merged.push([currentStart, currentEnd]);
    return merged;
}

export function mergeAxisAligned(segments) {
    const { runsByLine, nonAxisAligned } = collectRuns(segments);
    const mergedSegments = [];
    for (const run of runsByLine.values()) {
        const anchor = run.anchor;
        for (const [runStart, runEnd] of mergeIntervals(run.intervals)) {
            if (run.axis === 0)
                mergedSegments.push(runStart, anchor[1], anchor[2], runEnd, anchor[1], anchor[2]);
            else if (run.axis === 1)
                mergedSegments.push(anchor[0], runStart, anchor[2], anchor[0], runEnd, anchor[2]);
            else
                mergedSegments.push(anchor[0], anchor[1], runStart, anchor[0], anchor[1], runEnd);
        }
    }
    for (const coordinate of nonAxisAligned)
        mergedSegments.push(coordinate);
    return mergedSegments;
}
