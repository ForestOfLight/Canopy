import { BooleanDebugDisplayElement } from './BooleanDebugDisplayElement.js';

export class IsSneaking extends BooleanDebugDisplayElement {
    getFormattedData() {
        return this.getFormattedBoolean(this.entity.isSneaking);
    }
}