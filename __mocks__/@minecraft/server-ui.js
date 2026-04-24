/* eslint-disable max-classes-per-file */
import { vi } from 'vitest';

export const FormCancelationReason = {
    UserBusy: 'UserBusy',
    UserClosed: 'UserClosed',
};

export const uiManager = {
    closeAllForms: vi.fn(),
};

export class ModalFormData {}
export class ActionFormData {}
