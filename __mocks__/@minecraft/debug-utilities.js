/* eslint-disable max-classes-per-file */
// Mock for @minecraft/debug-utilities
const noOp = () => {};

export const debugDrawer = {
    drawArrow: noOp,
    drawBox: noOp,
    drawLine: noOp,
    drawText: noOp,
};

export class DebugArrow {}
export class DebugBox {}
export class DebugLine {}
export class DebugText {}
