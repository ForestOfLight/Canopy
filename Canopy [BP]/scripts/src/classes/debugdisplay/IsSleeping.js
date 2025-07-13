import { BooleanDebugDisplayElement } from './BooleanDebugDisplayElement.js';

export class IsSleeping extends BooleanDebugDisplayElement {
    getFormattedData() {
        return this.getFormattedBoolean(this.entity.isSleeping);
    }
}