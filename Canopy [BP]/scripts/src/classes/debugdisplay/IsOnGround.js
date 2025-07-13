import { BooleanDebugDisplayElement } from './BooleanDebugDisplayElement.js';

export class IsOnGround extends BooleanDebugDisplayElement {
    getFormattedData() {
        return this.getFormattedBoolean(this.entity.isOnGround);
    }
}