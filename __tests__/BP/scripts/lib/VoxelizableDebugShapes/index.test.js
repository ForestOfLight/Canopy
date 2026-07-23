import { describe, it, expect } from 'vitest';
import * as api from '../../../../../Canopy[BP]/scripts/lib/VoxelizableDebugShapes/index.js';

describe('VoxelizableDebugShapes index', () => {
    it('exports every shape and the base', () => {
        for (const name of [
            'VoxelizableDebugShape', 'VoxelizableDebugLine', 'VoxelizableDebugBox',
            'VoxelizableDebugSquare', 'VoxelizableDebugCircle', 'VoxelizableDebugEllipse',
            'VoxelizableDebugArc', 'VoxelizableDebugSphere',
        ]) expect(typeof api[name]).toBe('function');
    });
});
