import { BooleanDebugDisplayElement } from './BooleanDebugDisplayElement.js';

export class IsSwimming extends BooleanDebugDisplayElement {
    getFormattedData() {
        return this.getFormattedBoolean(this.entity.isSwimming);
    }
}