import { BooleanDebugDisplayElement } from './BooleanDebugDisplayElement.js';

export class IsValid extends BooleanDebugDisplayElement {
    getFormattedData() {
        return this.getFormattedBoolean(this.entity.isValid);
    }
}