import { DebugDisplayTextElement } from './DebugDisplayTextElement.js';

export class ID extends DebugDisplayTextElement {
    getFormattedData() {
        return '§2' + this.entity.id;
    }
}