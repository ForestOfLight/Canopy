/* eslint-disable max-classes-per-file */
// Support both Vitest (vi.fn()) and plain Node.js (noOp) contexts
let mockFn;
try {
    const vitest = await import('vitest');
    mockFn = vitest.vi.fn;
} catch {
    mockFn = () => () => {};
}

const fn = () => mockFn();

export const FormCancelationReason = {
    UserBusy: 'UserBusy',
    UserClosed: 'UserClosed',
};

export const uiManager = {
    closeAllForms: fn(),
};

export class ModalFormData {}
export class ActionFormData {}
