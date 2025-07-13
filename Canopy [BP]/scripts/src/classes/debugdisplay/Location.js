import { VectorDebugDisplayElement } from './VectorDebugDisplayElement.js';

export class Location extends VectorDebugDisplayElement {
    getFormattedData() {
        return super.getFormattedVector(this.entity.location);
    }
}