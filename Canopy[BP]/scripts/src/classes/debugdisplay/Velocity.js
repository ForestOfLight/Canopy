import { VectorDebugDisplayElement } from './VectorDebugDisplayElement.js';

export class Velocity extends VectorDebugDisplayElement {
    getFormattedData() {
        return super.getFormattedVector(this.entity.getVelocity());
    }
}