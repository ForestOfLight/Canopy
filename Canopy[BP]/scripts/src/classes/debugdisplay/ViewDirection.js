import { VectorDebugDisplayElement } from './VectorDebugDisplayElement.js';

export class ViewDirection extends VectorDebugDisplayElement {
    getFormattedData() {
        return super.getFormattedVector(this.entity.getViewDirection());
    }
}