import { VectorDebugDisplayElement } from './VectorDebugDisplayElement.js';

export class HeadLocation extends VectorDebugDisplayElement {
    getFormattedData() {
        return super.getFormattedVector(this.entity.getHeadLocation());
    }
}