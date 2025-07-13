import { BooleanDebugDisplayElement } from './BooleanDebugDisplayElement.js';

export class IsFalling extends BooleanDebugDisplayElement {
    getFormattedData() {
        return super.getFormattedBoolean(this.entity.isFalling);
    }
}