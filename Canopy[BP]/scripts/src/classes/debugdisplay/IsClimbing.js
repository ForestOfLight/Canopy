import { BooleanDebugDisplayElement } from './BooleanDebugDisplayElement.js';

export class IsClimbing extends BooleanDebugDisplayElement {
    getFormattedData() {
        return super.getFormattedBoolean(this.entity.isClimbing);
    }
}