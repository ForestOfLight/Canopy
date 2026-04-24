import { BooleanDebugDisplayElement } from './BooleanDebugDisplayElement.js';

export class IsSprinting extends BooleanDebugDisplayElement {
    getFormattedData() {
        return this.getFormattedBoolean(this.entity.isSprinting);
    }
}