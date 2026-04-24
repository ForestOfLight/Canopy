import { vi } from 'vitest';

export const debugDrawer = {
    addShape: vi.fn(),
    removeShape: vi.fn(),
};

export class DebugText {}
export class DebugBox {}
export class DebugShape {}
