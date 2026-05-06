import { BooleanDebugDisplayElement } from './BooleanDebugDisplayElement.js';

export class IsInWater extends BooleanDebugDisplayElement {
    getFormattedData() {
        return this.getFormattedBoolean(this.entity.isInWater);
    }
}