import { DebugDisplayElement } from './DebugDisplayElement.js';

export class ID extends DebugDisplayElement {
    getFormattedData() {
        return '§2' + this.entity.id;
    }
}